# Copyright © 2026 Christopher Snow.
"""Real service-worker checks: complete offline use and transactional updates."""
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
from threading import Thread
from tempfile import TemporaryDirectory
from urllib.parse import unquote, urlsplit

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
LESSONS = ['memory', 'scheduling', 'divergence', 'shared-memory', 'reduction',
           'matmul', 'tensor-cores', 'attention', 'inference']


class CourseHandler(BaseHTTPRequestHandler):
    revision = 'one'

    def log_message(self, *_):
        pass

    def do_GET(self):
        path = unquote(urlsplit(self.path).path)
        if path.startswith('/gpu-lab/'):
            path = path[len('/gpu-lab'):]
        if path.endswith('/'):
            path += 'index.html'
        file = (DIST / path.lstrip('/')).resolve()
        if not file.is_relative_to(DIST) or not file.is_file() or (
            self.revision == 'broken' and path == '/examples/gather.cu'
        ):
            self.send_error(404)
            return
        body = file.read_bytes()
        if path == '/sw.js':
            body = re.sub(rb'const VERSION = "([^"]+)";',
                          lambda m: b'const VERSION = "' + m[1] + b'-' + self.revision.encode() + b'";', body)
        if path == '/index.html':
            body = body.replace(b'<html ', b'<html data-test-release="' + self.revision.encode() + b'" ')
        types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
                 '.css': 'text/css', '.cu': 'text/plain', '.py': 'text/plain',
                 '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png'}
        self.send_response(200)
        self.send_header('Content-Type', types.get(file.suffix, 'application/octet-stream'))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def ready(page):
    expect(page.locator('#offline-status')).to_have_attribute('data-state', 'ready')
    page.wait_for_function('navigator.serviceWorker.controller !== null')


def update(page, outcome):
    page.evaluate('''async () => {
      window.installOutcome = null;
      const registration = await navigator.serviceWorker.getRegistration();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker.addEventListener('statechange', () => {
          window.installOutcome = worker.state;
        });
      }, {once: true});
      await registration.update();
    }''')
    page.wait_for_function('(state) => window.installOutcome === state', arg=outcome)


def check_install(page, context, url):
    # Check the browser's actual manifest parsing and installability diagnostics.
    session = context.new_cdp_session(page)
    manifest = session.send('Page.getAppManifest')
    assert manifest['url'] == url + 'manifest.webmanifest', manifest
    assert not manifest['errors'], manifest
    errors = session.send('Page.getInstallabilityErrors')['installabilityErrors']
    # Isolated Playwright contexts are incognito; test the same diagnostics in a
    # normal persistent profile below, where installation is allowed.
    assert not [error for error in errors if error['errorId'] != 'in-incognito'], errors
    session.detach()
    page.locator('#install').click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()
    expect(page.locator('#install')).to_be_focused()
    # Simulate browser events to test our UI without accepting an OS install.
    page.evaluate('''() => {
      const event = new Event('beforeinstallprompt', {cancelable: true});
      window.promptCalls = 0;
      event.prompt = async () => { window.promptCalls += 1; };
      event.userChoice = Promise.resolve({outcome: 'dismissed'});
      dispatchEvent(event);
      if (!event.defaultPrevented) throw new Error('Install prompt was not deferred');
    }''')
    page.locator('#install').click()
    page.locator('#install-confirm').click()
    expect(page.locator('#install-message')).to_contain_text('Installation cancelled')
    assert page.evaluate('window.promptCalls') == 1
    expect(page.locator('#install-confirm')).to_be_hidden()
    expect(page.locator('#install-instructions')).to_be_visible()
    page.evaluate("dispatchEvent(new Event('appinstalled'))")
    expect(page.locator('#install')).to_be_hidden()
    expect(page.locator('#install-message')).to_contain_text('GPU Lab is installed')
    page.locator('#install-close').click()


server = ThreadingHTTPServer(('127.0.0.1', 0), CourseHandler)
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as playwright:
        options = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = playwright.chromium.launch(**options)
        for prefix, width in [('/gpu-lab/', 390), ('/', 1440)]:
            CourseHandler.revision = 'one'
            url = f'http://127.0.0.1:{server.server_port}{prefix}'
            context = browser.new_context(viewport={'width': width, 'height': 900})
            errors = []
            context.on('page', lambda page: page.on('pageerror', lambda error: errors.append(str(error))))
            page = context.new_page()
            # A direct visit to the last lab must save the introduction and every other lab.
            page.goto(url + 'lessons/inference.html')
            ready(page)
            check_install(page, context, url)
            keys = page.evaluate('caches.keys()')
            assert len(keys) == 1 and keys[0].endswith('-one'), keys
            old_cache = keys[0]
            # An unrelated app's cache must survive GPU Lab updates on this origin.
            page.evaluate("caches.open('another-app:keep')")
            context.set_offline(True)
            expect(page.locator('#offline-status')).to_contain_text('Working offline')
            # Install metadata and every icon must remain available without network.
            assert page.evaluate('''async base => {
              const manifest = await (await fetch(base + 'manifest.webmanifest')).json();
              if (manifest.display !== 'standalone' || new URL(manifest.start_url, base).href !== base) return false;
              for (const icon of [...manifest.icons, {src:'assets/apple-touch-icon.png',sizes:'180x180'}]) {
                const blob = await (await fetch(new URL(icon.src, base))).blob();
                const bitmap = await createImageBitmap(blob);
                if (`${bitmap.width}x${bitmap.height}` !== icon.sizes) return false;
                bitmap.close();
              }
              return (await fetch(base + 'assets/icon.svg')).ok;
            }''', url)
            for slug in LESSONS:
                response = page.goto(url + f'lessons/{slug}.html?offline-test=1#simulator')
                assert response.ok and response.from_service_worker
                ready(page)
                page.locator('#show-result').click()
                expect(page.locator('#results')).to_be_visible()
                if slug == 'memory':
                    expect(page.locator('#sector-count')).to_have_text('4')
                    page.get_by_role('button', name='Tensor column', exact=True).click()
                    page.locator('#show-result').click()
                    expect(page.locator('#sector-count')).to_have_text('32')
                else:
                    before = page.locator('#step-detail').inner_text()
                    page.locator('#step').focus()
                    page.locator('#step').press('End')
                    assert page.locator('#step-detail').inner_text() != before
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                page.reload()
                ready(page)
            page.goto(url + 'lessons/memory.html')
            with page.expect_download() as download:
                page.get_by_role('link', name='Download runnable example ↓').click()
            assert 'cudaGetLastError' in Path(download.value.path()).read_text()
            for file in ['examples/ai-kernels.cu', 'examples/tensor-layout.py']:
                result = page.evaluate('''async url => {
                  const response = await fetch(url);
                  return {ok: response.ok, text: await response.text()};
                }''', url + file)
                assert result['ok'] and len(result['text']) > 100
            page.close()
            page = context.new_page()
            response = page.goto(url)
            assert response.from_service_worker
            expect(page.locator('.roadmap h3')).to_have_count(8)
            expect(page.locator('html')).to_have_attribute('data-test-release', 'one')
            page.get_by_role('link', name='Start Lab 01: Reading a tensor →').click()
            page.locator('#show-result').click()
            expect(page.locator('#sector-count')).to_have_text('4')
            print(f'PASS: {prefix}, {width}px; all unvisited labs, controls, reload, tab reopen and downloads offline')

            # A failed update cannot damage the saved course or claim to be ready.
            context.set_offline(False)
            page.goto(url)
            CourseHandler.revision = 'broken'
            update(page, 'redundant')
            assert page.evaluate('caches.keys()') == [old_cache, 'another-app:keep']
            expect(page.locator('#offline-status')).not_to_contain_text('Update saved')
            context.set_offline(True)
            page.reload()
            expect(page.locator('html')).to_have_attribute('data-test-release', 'one')
            ready(page)

            # A successful update waits while either course tab remains open.
            CourseHandler.revision = 'one'
            context.set_offline(False)
            second = context.new_page()
            second.goto(url + 'lessons/memory.html')
            ready(second)
            CourseHandler.revision = 'two'
            update(page, 'installed')
            expect(page.locator('#offline-status')).to_contain_text('Update saved')
            page.reload()
            expect(page.locator('html')).to_have_attribute('data-test-release', 'one')
            page.close()
            second.reload()
            expect(second.locator('#offline-status')).to_contain_text('Update saved')
            second.close()
            # Allow activation without keeping a controlled course tab alive.
            observer = context.new_page()
            observer.goto(url + 'missing.html')
            observer.wait_for_function('''async () => {
              const keys = await caches.keys();
              return keys.some(key => key.endsWith('-two')) && !keys.some(key => key.endsWith('-one'));
            }''')
            assert 'another-app:keep' in observer.evaluate('caches.keys()')
            context.set_offline(True)
            observer.goto(url)
            expect(observer.locator('html')).to_have_attribute('data-test-release', 'two')
            ready(observer)
            expect(observer.locator('#offline-status')).not_to_contain_text('Update saved')
            assert not errors, errors
            context.close()
            print(f'PASS: {prefix}; failed update recovery, waiting across two tabs, activation and scoped cache cleanup')

        # Failed first installation is reported without preventing normal online use.
        CourseHandler.revision = 'broken'
        context = browser.new_context()
        page = context.new_page()
        page.goto(url)
        expect(page.locator('#offline-status')).to_have_attribute('data-state', 'unavailable')
        expect(page.locator('.roadmap h3')).to_have_count(8)
        CourseHandler.revision = 'two'
        page.reload()
        ready(page)
        context.close()
        # Unsupported / blocked service workers degrade to an online course.
        context = browser.new_context(service_workers='block')
        page = context.new_page()
        page.goto(url + 'lessons/memory.html')
        page.locator('#show-result').click()
        expect(page.locator('#sector-count')).to_have_text('4')
        context.close()
        browser.close()
        print('PASS: failed first save recovers on revisit; simulators work when service workers are blocked')
        # Offline storage must survive restarting the browser, not just a tab reload.
        with TemporaryDirectory(prefix='gpu-lab-profile-') as profile:
            context = playwright.chromium.launch_persistent_context(profile, **options)
            page = context.new_page()
            page.goto(url)
            ready(page)
            session = context.new_cdp_session(page)
            assert not session.send('Page.getInstallabilityErrors')['installabilityErrors']
            session.detach()
            context.close()
            context = playwright.chromium.launch_persistent_context(profile, **options)
            context.set_offline(True)
            page = context.new_page()
            page.goto(url + 'lessons/memory.html')
            ready(page)
            page.locator('#show-result').click()
            expect(page.locator('#sector-count')).to_have_text('4')
            expect(page.locator('#offline-status')).to_contain_text('Working offline')
            context.close()
        print('PASS: saved course and simulator work offline after a full browser restart')
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=5)
