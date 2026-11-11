# Copyright © 2026 Christopher Snow.
"""Two independently built releases, actual worker/cache/network lifecycle.
No mocked service-worker methods or synthetic version-only SW substitutions.
"""
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import subprocess
from threading import Thread
from tempfile import TemporaryDirectory
import time
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / 'test-results'
RESULTS.mkdir(exist_ok=True)

class CourseHandler(BaseHTTPRequestHandler):
    revision = 'one'
    roots = {}
    requests = []
    fail = None
    slow = False
    legacy = False
    corrupt = None
    def log_message(self, *_): pass
    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path.startswith('/gpu-lab/'): path = path[len('/gpu-lab'):]
        if path.endswith('/'): path += 'index.html'
        path = path.lstrip('/')
        self.requests.append(path)
        root = self.roots[self.revision]
        # A real static release directory. Both versions are retained for this
        # test deployment, just as documented for durable immutable assets.
        if path.startswith('releases/'):
            for candidate in self.roots.values():
                if (candidate / path).is_file(): root = candidate; break
        file = (root / path).resolve()
        if self.slow and path.startswith('releases/') and not path.endswith('release.json'): time.sleep(.07)
        if self.fail and path.endswith(self.fail): self.send_error(503); return
        if not file.is_relative_to(root) or not file.is_file(): self.send_error(404); return
        body = file.read_bytes()
        if self.corrupt and path.endswith(self.corrupt): body += b'corrupt'
        if self.legacy and path == 'sw.js':
            legacy=(ROOT/'tests/fixtures/legacy-worker.js').read_text()
            files=json.loads((root/'release.json').read_text())['files']
            body=legacy.replace('__VERSION__',json.dumps('legacy-complete')).replace('__FILES__',json.dumps([f['path'] for f in files])).encode()
        types = {'.mp4':'video/mp4', '.vtt':'text/vtt', '.jpg':'image/jpeg', '.pdf':'application/pdf', '.woff2':'font/woff2', '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.cu':'text/plain', '.py':'text/plain'}
        self.send_response(200); self.send_header('Content-Type', types.get(file.suffix,'application/octet-stream'))
        self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(body))); self.end_headers()
        try: self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError): pass

def panel(page):
    # Release markup can appear before the restarted page has attached its controls.
    page.wait_for_load_state('load')
    if not page.locator('#app-status-dialog').is_visible(): page.locator('#app-status-open').click()

def check(page):
    panel(page); page.locator('#check-update').click()

def ready(page):
    expect(page.locator('#offline-status')).to_have_text('Available offline', timeout=30000)

def built(temp, name):
    source = temp / name; source.mkdir()
    for path in ['scripts','src','content','assets','docker','examples','index.html','manifest.webmanifest']:
        item = ROOT / path
        if item.is_dir(): shutil.copytree(item, source / path)
        else: shutil.copy2(item, source / path)
    p = source / 'index.html'; p.write_text(p.read_text().replace('<html ', f'<html data-test-release="{name}" ',1))
    subprocess.run(['node','scripts/build.mjs'],cwd=source,check=True,stdout=subprocess.DEVNULL)
    return source / 'dist'

with TemporaryDirectory(prefix='gpu-status-releases-') as tmp:
    temp = Path(tmp)
    CourseHandler.roots = {name: built(temp, name) for name in ['one','two']}
    releases = {name: json.loads((root/'release.json').read_text()) for name,root in CourseHandler.roots.items()}
    assert releases['one']['id'] != releases['two']['id']
    server = ThreadingHTTPServer(('127.0.0.1',0),CourseHandler)
    Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            options = {'headless':True}
            if os.environ.get('CHROMIUM_PATH'): options['executable_path'] = os.environ['CHROMIUM_PATH']
            browser = p.chromium.launch(**options)
            for prefix,width,theme in [('/gpu-lab/',390,'dark'),('/',1440,'light')]:
                CourseHandler.revision='one'; CourseHandler.fail=None; CourseHandler.slow=False
                url=f'http://127.0.0.1:{server.server_port}{prefix}'
                context=browser.new_context(viewport={'width':width,'height':900},color_scheme=theme,has_touch=width<500,reduced_motion='reduce')
                errors=[]; context.on('page',lambda page:page.on('pageerror',lambda error:errors.append(str(error))))
                page=context.new_page(); page.goto(url+'lessons/hello.html?exercise=1#idea-2'); panel(page)
                expect(page.locator('#version-status')).to_have_text('Up to date')
                page.wait_for_function('navigator.serviceWorker.controller !== null')
                expect(page.locator('#offline-status')).to_have_text('Not saved for offline use')
                expect(page.locator('#offline-size')).to_contain_text(f"{releases['one']['bytes']:,} bytes")
                # Installation/checking/opening must not fetch other labs or CUDA assets.
                assert not any(x.startswith('releases/') and x.endswith('examples/gather.cu') for x in CourseHandler.requests)
                assert not any(x.endswith('.html') and not x.endswith('lessons/hello.html') for x in CourseHandler.requests)
                check(page); expect(page.locator('#version-status')).to_have_text('Up to date')
                assert not any(x.endswith('examples/gather.cu') for x in CourseHandler.requests)
                page.screenshot(path=str(RESULTS/f'status-{width}-{theme}-online.png'))
                page.evaluate("caches.open('sibling-app:keep'); localStorage.setItem('user-content','keep')")
                # Interrupted first download resumes verified earlier files.
                CourseHandler.slow=True
                page.locator('#save-offline').click()
                expect(page.locator('#download-progress')).to_be_visible()
                page.wait_for_function('document.getElementById("asset-progress").value > 0')
                page.locator('#cancel-download').click()
                expect(page.locator('#save-offline')).to_have_text('Resume download')
                expect(page.locator('#offline-status')).to_have_text('Offline download incomplete')
                CourseHandler.slow=False
                before=CourseHandler.requests.count(f"releases/{releases['one']['id']}/assets/apple-touch-icon.png")
                page.locator('#save-offline').click(); ready(page)
                assert before == CourseHandler.requests.count(f"releases/{releases['one']['id']}/assets/apple-touch-icon.png")
                page.screenshot(path=str(RESULTS/f'status-{width}-{theme}-saved.png'))
                page.keyboard.press('Escape')
                # Fresh offline tabs visit every saved HTML and required asset.
                context.set_offline(True)
                for file in releases['one']['files']:
                    if file['path'].endswith('.html'):
                        tab=context.new_page(); response=tab.goto(url+file['path']); assert response.ok and response.from_service_worker
                        assert tab.locator('meta[name="gpu-release"]').get_attribute('content')==releases['one']['id']
                        if file['path']=='lessons/hello.html':
                            tab.evaluate('document.fonts.ready')
                            assert tab.evaluate("[...document.fonts].some(f=>f.family==='IBM Plex Sans'&&f.status==='loaded')")
                            assert tab.evaluate("[...document.fonts].some(f=>f.family==='IBM Plex Mono'&&f.status==='loaded')")
                        tab.close()
                assets=page.evaluate('''async files => {for (const f of files) { const r=await fetch(new URL(f.path, new URL(document.querySelector('meta[name="gpu-base"]').content,location.href))); if(!r.ok || (await r.arrayBuffer()).byteLength!==f.bytes) return f.path;} return null;}''',releases['one']['files'])
                assert assets is None, assets
                expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['?']*5)
                page.locator('#lesson-complete').check()
                page.locator('#hello-run-0').click()
                page.locator('#hello-map-0 button[data-thread="2"]').click()
                expect(page.locator('#hello-output-0')).to_have_text('Output: [2.0, 4.0, 6.0, 8.0, 10.0]')
                page.locator('#hello-factor-0').fill('3')
                page.locator('#hello-position-guess').select_option('0:4')
                page.locator('#hello-values-guess').select_option('same')
                page.locator('#hello-launch-guess').select_option('1')
                page.locator('#hello-launch-run').click()
                page.locator('#hello-launch-map [data-thread="4"]').click()
                page.locator('#hello-bounds-guess').select_option('5');page.locator('#hello-bounds-check').click()
                page.locator('#hello-coverage-guess').select_option('missing')
                page.locator('#hello-repair-blocks').select_option('2')
                page.locator('#hello-skip-guess').select_option('9');page.locator('#hello-transfer-run').click()
                second=context.new_page(); second.goto(url+'lessons/memory.html?keep=1#simulator')
                second.locator('#stride').select_option('8'); second.locator('#show-result').click()
                second.locator('#lanes button').nth(5).click()
                kernel=context.new_page(); kernel.goto(url+'lessons/kernel.html')
                kernel.locator('#kernel-index').select_option('global');kernel.locator('#run-model').click()
                kernel.get_by_role('button',name='Inspect 35',exact=True).click();kernel.locator('#trace-end').click()
                trace=kernel.locator('#kernel-event').inner_text()
                lesson=context.new_page();lesson.goto(url+'lessons/scheduling.html')
                lesson.locator('#scheduling-wait-latency').select_option('3')
                lesson.locator('#scheduling-wait [data-run]').click();lesson.locator('#scheduling-wait [data-next]').click()
                lesson.locator('#scheduling-ready-warps').select_option('4');lesson.locator('#scheduling-ready [data-run]').click()
                lesson_trace=lesson.locator('#scheduling-wait [data-visual-output]').inner_text()
                ready_trace=lesson.locator('#scheduling-ready [data-visual-output]').inner_text()
                final=context.new_page();final.goto(url+'lessons/putting-it-together.html')
                final.locator('#capstone-choice-tile').select_option('4');final.locator('#capstone-choice [data-run]').click()
                final_result=final.locator('#capstone-choice [data-visual-output]').inner_text()
                devices=context.new_page();devices.goto(url+'lessons/devices.html')
                devices.locator('#device-count-0').select_option('8');devices.locator('#device-run-0').click()
                devices.locator('#device-factor-1').fill('3');devices.locator('#device-run-1').click()
                reading=context.new_page();reading.goto(url+'lessons/reading.html')
                reading.locator('#reading-index-column').select_option('1');reading.locator('#reading-run-column').click()
                layout=context.new_page();layout.goto(url+'lessons/layout.html')
                layout.locator('#reading-index-packed').select_option('2');layout.locator('#reading-run-packed').click()
                requests=context.new_page();requests.goto(url+'lessons/requests.html')
                requests.locator('#reading-pattern-sectors').select_option('column');requests.locator('#reading-run-sectors').click()
                recordings=[]
                for route,prefix,folder in [('inside-sm','sm','inside-sm'),('reduction-video','reduction','reduction'),('matmul-video','matmul','matmul')]:
                    tab=context.new_page();tab.goto(url+'lessons/'+route+'.html')
                    video=tab.locator('#'+prefix+'-video')
                    video.evaluate('v=>v.load()')
                    tab.wait_for_function('id=>document.getElementById(id).readyState>=1',arg=prefix+'-video')
                    video.evaluate('v=>{v.currentTime=45;v.playbackRate=1.25}')
                    tab.locator('#'+prefix+'-transcript summary').click()
                    recordings.append((tab,prefix,folder))
                lesson.locator('#scheduling-sm-explore').click()
                for _ in range(4):lesson.locator('#sm-next').click()
                concept_map=context.new_page();concept_map.goto(url+'lessons/meet-gpu.html?chapter=matmul')
                for disclosure in ['gpu','sm-0','block-a','a-warp-1','a-w1-lane-7']:
                    concept_map.locator('#'+disclosure+' > summary').click()
                page.locator('.gpu-map-link').click()
                embedded=page.frame_locator('#gpu-map-frame')
                for disclosure in ['gpu','sm-0','block-a','a-warp-1','a-w1-lane-7']:
                    embedded.locator('#'+disclosure+' > summary').click()
                context.set_offline(False);CourseHandler.revision='two';check(page)
                expect(page.locator('#version-status')).to_have_text('Update available')
                expect(page.locator('#app-status-summary')).to_contain_text('Update available')
                # Real browser quota failure cannot overwrite a complete release.
                cdp=context.new_cdp_session(page)
                cdp.send('Storage.overrideQuotaForOrigin', {'origin':urlsplit(url).scheme+'://'+urlsplit(url).netloc,'quotaSize':1})
                page.locator('#download-update').click()
                expect(page.locator('#app-status-error')).not_to_be_empty(timeout=30000)
                ready(page);expect(page.locator('#restart-update')).to_be_hidden()
                cdp.send('Storage.overrideQuotaForOrigin', {'origin':urlsplit(url).scheme+'://'+urlsplit(url).netloc})
                cdp.detach()
                # Failed replacement keeps the complete old release available.
                CourseHandler.fail='examples/gather.cu';page.locator('#download-update').click()
                expect(page.locator('#app-status-error')).not_to_be_empty(timeout=30000)
                ready(page);expect(page.locator('#restart-update')).to_be_hidden()
                CourseHandler.fail=None;page.locator('#download-update').click()
                try:
                    expect(page.locator('#version-status')).to_have_text('Update ready',timeout=30000)
                except AssertionError:
                    print('Update diagnostics:', {
                        'error':page.locator('#app-status-error').inner_text(),
                        'progress':page.locator('#progress-text').inner_text(),
                        'storage':page.evaluate('navigator.storage.estimate()'),
                        'recentRequests':CourseHandler.requests[-8:],
                    },flush=True)
                    raise
                page.locator('#later-update').click();expect(page.locator('#app-status-summary')).to_contain_text('Update ready')
                assert second.locator('meta[name="gpu-release"]').get_attribute('content')==releases['one']['id']
                # Input composition in ANY window blocks everyone without resetting state.
                second.evaluate("dispatchEvent(new CompositionEvent('compositionstart'))")
                panel(page);page.locator('#restart-update').click()
                expect(page.locator('#app-status-error')).to_contain_text('Finish the current input')
                second.evaluate("dispatchEvent(new CompositionEvent('compositionend'))")
                expect(second.locator('#sector-count')).to_have_text('32')
                # A busy/unsaved participant or denied snapshot storage blocks all tabs.
                second.evaluate("window.updateGuard=e=>{e.detail.reason='Finish the unsaved operation first.'};addEventListener('gpu-lab:before-restart',updateGuard)")
                page.locator('#restart-update').click();expect(page.locator('#app-status-error')).to_contain_text('unsaved operation')
                second.evaluate("() => {removeEventListener('gpu-lab:before-restart',updateGuard);window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Storage denied','SecurityError')};}")
                page.locator('#restart-update').click();expect(page.locator('#app-status-error')).to_contain_text('Storage denied')
                second.evaluate('() => {Storage.prototype.setItem=window.originalSet;}')
                # A tab with its JS disabled never receives a forced navigation.
                blocked=context.new_page();blocked.goto(url+'index.html');blocked.wait_for_load_state('networkidle')
                blocked_cdp=context.new_cdp_session(blocked);blocked_cdp.send('Emulation.setScriptExecutionDisabled',{'value':True})
                page.locator('#restart-update').click();expect(page.locator('#app-status-error')).to_contain_text('did not respond',timeout=10000)
                blocked_cdp.detach();blocked.close()
                # Activation works offline and restores each tab's independent work/route.
                context.set_offline(True);page.locator('#restart-update').click()
                for tab in [page,second,kernel,lesson,devices,reading,layout,requests,concept_map,final]:
                    expect(tab.locator('meta[name="gpu-release"]')).to_have_attribute('content',releases['two']['id'])
                    assert tab.evaluate('''id=>[...document.scripts].filter(s=>s.type==='module').every(s=>s.src.includes('/releases/'+id+'/'))''',releases['two']['id'])
                expect(concept_map.locator('#a-w1-lane-7')).to_have_attribute('open','')
                expect(concept_map.locator('#a-w1-lane-7')).to_contain_text('thread 39')
                expect(concept_map.locator('#map-chapter, .map-match, .map-highlight')).to_have_count(0)
                expect(concept_map.locator('#hardware-panel')).to_be_visible()
                expect(concept_map.locator('#a-warp-1')).to_have_attribute('open','')
                expect(page.locator('#gpu-map-panel')).to_be_visible()
                expect(page.frame_locator('#gpu-map-frame').locator('#a-w1-lane-7')).to_have_attribute('open','')
                page.locator('.gpu-map-link').click()
                expect(page.locator('#gpu-map-panel')).to_be_hidden()
                expect(page).to_have_url(url+'lessons/hello.html?exercise=1#idea-2')
                expect(page.locator('#lesson-complete')).to_be_checked()
                expect(page.locator('.sidebar a[data-completion-lesson=hello]')).to_have_attribute('data-done','true')
                expect(page.locator('#hello-factor-0')).to_have_value('3')
                expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['?']*5)
                expect(page.locator('#hello-output-0')).not_to_contain_text('Output:')
                expect(reading.locator('#reading-map-row .book-reads li>span:last-child strong')).to_have_text(['?']*5)
                expect(layout.locator('#reading-map-row .book-storage')).to_be_hidden()
                expect(page.locator('#hello-output-0')).to_contain_text('Run')
                expect(page.locator('#hello-map-0 button[data-thread="2"]')).to_have_attribute('aria-pressed','true')
                expect(page.locator('#hello-map-3 [data-state=invalid]')).to_have_count(1)
                expect(page.locator('#hello-transfer-diagram')).to_contain_text('Unwritten')
                expect(page.locator('#hello-launch-answer')).to_be_visible()
                expect(page.locator('#hello-launch-size')).to_have_value('8')
                expect(page.locator('#hello-launch-feedback')).to_contain_text('All three predictions match')
                expect(page.locator('#hello-launch-index')).to_contain_text('index = 0 × 8 + 4 = 4')
                expect(second).to_have_url(url+'lessons/memory.html?keep=1#simulator')
                expect(second.locator('#stride')).to_have_value('8');expect(second.locator('#sector-count')).to_have_text('32')
                expect(second.locator('#lanes button').nth(5)).to_have_attribute('aria-pressed','true')
                expect(lesson.locator('#sm-position')).to_have_text('Event 4 of 8')
                expect(lesson.locator('#sm-explorer [data-sm-unit=arithmetic]')).to_contain_text('1.0 × 2 → 2.0')
                for tab,prefix,folder in recordings:
                    expect(tab.locator('meta[name="gpu-release"]')).to_have_attribute('content',releases['two']['id'])
                    expect(tab.locator('#'+prefix+'-transcript')).to_have_attribute('open','')
                    tab.wait_for_function('id=>Math.abs(document.getElementById(id).currentTime-45)<.5',arg=prefix+'-video')
                    video=tab.locator('#'+prefix+'-video')
                    assert video.evaluate('v=>v.paused&&v.playbackRate===1.25')
                    media=video.locator('source').get_attribute('src')
                    partial=tab.evaluate('''async media=>{const r=await fetch(media,{headers:{Range:'bytes=100-199'}});return {status:r.status,range:r.headers.get('Content-Range'),bytes:(await r.arrayBuffer()).byteLength}}''',media)
                    size=(ROOT/'assets/media'/folder/(folder+'.mp4')).stat().st_size
                    assert partial=={'status':206,'range':f'bytes 100-199/{size}','bytes':100},partial
                    video.evaluate('v=>{v.currentTime=120;v.muted=true;v.play()}')
                    tab.wait_for_function('id=>document.getElementById(id).currentTime>120.1',arg=prefix+'-video')
                    video.evaluate('v=>v.pause()')
                expect(kernel.locator('#kernel-event')).to_have_text(trace)
                expect(lesson.locator('#scheduling-wait [data-visual-output]')).to_have_text(lesson_trace,use_inner_text=True)
                expect(lesson.locator('#scheduling-ready [data-visual-output]')).to_have_text(ready_trace,use_inner_text=True)
                expect(lesson.locator('#scheduling-wait-latency')).to_have_value('3')
                expect(lesson.locator('#scheduling-ready-warps')).to_have_value('4')
                expect(final.locator('#capstone-choice-tile')).to_have_value('4')
                expect(final.locator('#capstone-choice [data-visual-output]')).to_have_text(final_result,use_inner_text=True)
                expect(final.locator('#capstone-baseline [data-results]')).to_be_hidden()
                expect(devices.locator('#device-feedback-0')).to_contain_text('32 bytes copied')
                expect(devices.locator('#device-feedback-1')).to_contain_text('[3.0, 6.0, 9.0, 12.0, 15.0]')
                expect(reading.locator('#reading-feedback-column')).to_contain_text('[4.0, 14.0, 24.0, 34.0, 44.0]')
                expect(requests.locator('#reading-feedback-sectors')).to_contain_text('3 sectors for 20 useful bytes')
                expect(layout.locator('#reading-feedback-packed')).to_contain_text('[6.0, 16.0, 26.0, 36.0, 46.0]')
                panel(page);ready(page)
                # Eviction is detected on focus; repair retains/reuses remaining assets.
                cache=f"gpu-lab:{url}:release-{releases['two']['id']}"
                page.evaluate('''async ({cache,url}) => {await (await caches.open(cache)).delete(url+'examples/gather.cu');dispatchEvent(new Event('focus'));}''',{'cache':cache,'url':url})
                expect(page.locator('#offline-status')).to_have_text('Offline download incomplete')
                context.set_offline(False);CourseHandler.corrupt='examples/gather.cu'
                assert not page.evaluate('''async url => (await fetch(url+'examples/gather.cu')).ok''',url)
                CourseHandler.corrupt=None;page.locator('#save-offline').click();ready(page)
                page.locator('#remove-offline').click();page.locator('#cancel-remove').click();ready(page)
                page.locator('#remove-offline').click();page.locator('#confirm-remove').click()
                expect(page.locator('#offline-status')).to_have_text('Not saved for offline use')
                assert page.evaluate('caches.keys()') == ['sibling-app:keep']
                assert page.evaluate("localStorage.getItem('user-content')") == 'keep'
                expect(page.locator('#lesson-complete')).to_be_checked()
                assert page.evaluate("localStorage.getItem('gpu-lab:v1:manual-completion:hello')") == 'true'
                expect(page.locator('#hello-factor-0')).to_have_value('3')
                expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['?']*5)
                expect(page.locator('#hello-output-0')).not_to_contain_text('Output:')
                expect(reading.locator('#reading-map-row .book-reads li>span:last-child strong')).to_have_text(['?']*5)
                expect(layout.locator('#reading-map-row .book-storage')).to_be_hidden()
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                assert not errors,errors
                context.close();CourseHandler.requests=[]
                print(f'PASS {prefix} {width}px {theme}: opt-in, real bytes, cancel/resume, all offline assets/pages, failed replacement, deployed update, Later, composition guard, three-tab restart and restored experiments, eviction/repair, scoped removal')
            # An online-only update does not grant permanent offline consent.
            CourseHandler.revision='one'
            url=f'http://127.0.0.1:{server.server_port}/gpu-lab/'
            ctx=browser.new_context();tab=ctx.new_page();tab.goto(url);panel(tab)
            expect(tab.locator('#offline-status')).to_have_text('Not saved for offline use')
            CourseHandler.revision='two';check(tab);expect(tab.locator('#version-status')).to_have_text('Update available')
            tab.locator('#download-update').click();expect(tab.locator('#version-status')).to_have_text('Update ready',timeout=30000)
            tab.locator('#later-update').click();tab.reload()
            expect(tab.locator('html')).to_have_attribute('data-test-release','one')
            tab.close();tab=ctx.new_page();tab.goto(url)
            expect(tab.locator('html')).to_have_attribute('data-test-release','one')
            panel(tab);expect(tab.locator('#version-status')).to_have_text('Update ready')
            tab.locator('#restart-update').click();expect(tab.locator('html')).to_have_attribute('data-test-release','two')
            panel(tab);expect(tab.locator('#offline-status')).to_have_text('Not saved for offline use')
            tab.locator('#save-offline').click();ready(tab);ctx.close()
            print('PASS online-only update: prepare/restart succeeds without opting into offline access; explicit save remains available')
            # A persistent installed profile: closing every window does NOT apply
            # a prepared release. Reopen completely offline, then explicitly restart.
            CourseHandler.revision='one';CourseHandler.requests=[]
            url=f'http://127.0.0.1:{server.server_port}/gpu-lab/'
            profile=temp/'profile'
            ctx=p.chromium.launch_persistent_context(str(profile),**options)
            tab=ctx.pages[0];tab.goto(url);panel(tab);tab.locator('#save-offline').click();ready(tab)
            manifest=ctx.new_cdp_session(tab).send('Page.getAppManifest')
            assert not manifest['errors'],manifest
            CourseHandler.revision='two';check(tab);expect(tab.locator('#version-status')).to_have_text('Update available')
            tab.locator('#download-update').click();expect(tab.locator('#version-status')).to_have_text('Update ready',timeout=30000)
            tab.locator('#later-update').click();ctx.close()
            ctx=p.chromium.launch_persistent_context(str(profile),**options);ctx.set_offline(True)
            tab=ctx.pages[0];tab.goto(url)
            expect(tab.locator('html')).to_have_attribute('data-test-release','one')
            panel(tab);ready(tab);expect(tab.locator('#version-status')).to_have_text('Update ready')
            tab.locator('#restart-update').click();expect(tab.locator('html')).to_have_attribute('data-test-release','two')
            ctx.close()
            print('PASS persistent profile: no activation on closing all windows; cold offline reopen, deferred badge and explicit offline restart')
            # Exercise the actual former worker and its automatically saved cache.
            CourseHandler.revision='one';CourseHandler.legacy=True
            legacy_profile=temp/'legacy-profile'
            ctx=p.chromium.launch_persistent_context(str(legacy_profile),**options)
            tab=ctx.pages[0];tab.goto(url)
            tab.wait_for_function('navigator.serviceWorker.controller !== null')
            legacy_key=f'gpu-lab:{url}:legacy-complete'
            assert legacy_key in tab.evaluate('caches.keys()')
            CourseHandler.legacy=False;CourseHandler.revision='two'
            tab.evaluate('''async () => { const r=await navigator.serviceWorker.getRegistration();await r.update();}''')
            tab.wait_for_function('''async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)''')
            ctx.close()
            ctx=p.chromium.launch_persistent_context(str(legacy_profile),**options)
            tab=ctx.pages[0];tab.goto(url);panel(tab)
            expect(tab.locator('html')).to_have_attribute('data-test-release','two')
            expect(tab.locator('#offline-status')).to_have_text('Offline download incomplete')
            assert legacy_key in tab.evaluate('caches.keys()')
            tab.locator('#save-offline').click();ready(tab)
            ctx.set_offline(True);tab.reload();panel(tab);ready(tab)
            ctx.close();CourseHandler.legacy=False
            print('PASS legacy migration: real former worker, retained cache/consent, explicit verified repair and offline reopen')
            browser.close()
    finally:server.shutdown()
