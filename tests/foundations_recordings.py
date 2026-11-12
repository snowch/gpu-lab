# Copyright © 2026 Christopher Snow.
import json
from playwright.sync_api import expect

RECORDINGS=[dict(slug='devices',chapter=2,title='Follow tensor values between CPU and GPU',
    control='#device-count-0',value='8',run='#device-run-0',result='#device-feedback-0',
    untouched='#device-map-1 code',untouched_text=['x_cpu','x_gpu']),
    dict(slug='reading',chapter=4,title='Select tensor rows and columns',control='#reading-index-row',value='1',run='#reading-run-row',result='#reading-feedback-row',untouched='#reading-map-column .book-reads li>span:last-child strong',untouched_text=['?']*5),
    dict(slug='layout',chapter=5,title='Follow tensor views into memory',control='#reading-index-column',value='1',run='#reading-run-column',result='#reading-feedback-column',untouched='#reading-map-packed .book-reads li>span:last-child strong',untouched_text=['?']*5),
    dict(slug='requests',chapter=6,title='Group five reads into memory sectors',control='#reading-index-sectors',value='3',run='#reading-run-sectors',result='#reading-feedback-sectors'),
    dict(slug='scheduling',chapter=7,title='Choose a ready warp while another waits',control='#scheduling-ready-warps',value='4',run='[data-book-experiment="scheduling-ready"] [data-run]',result='#scheduling-ready-feedback',untouched='#scheduling-wait-feedback',untouched_text=['Predict the result, then press Run.'],advance=3,position='[data-book-experiment="scheduling-ready"] [data-position]'),
    dict(slug='divergence',chapter=8,title='Follow active masks through different paths',control='#divergence-mixed-pattern',value='one-negative',run='[data-book-experiment="divergence-mixed"] [data-run]',result='#divergence-mixed-feedback',untouched='#divergence-uniform-feedback',untouched_text=['Predict the result, then press Run.'],advance=1,position='[data-book-experiment="divergence-mixed"] [data-position]'),
    dict(slug='tensor-cores',chapter=11,title='Follow input rounding into FP32 sums',control='#precision-conversion-format',value='bf16',run='[data-book-experiment="precision-conversion"] [data-run]',result='#precision-conversion-feedback',untouched='#precision-accumulation-feedback',untouched_text=['Run to compare the converted-input and original-input sums.'],advance=3,position='[data-book-experiment="precision-conversion"] [data-position]'),
    dict(slug='attention',chapter=12,title='Update attention totals without full score matrices',control='#attention-online-tile',value='4',run='[data-book-experiment="attention-online"] [data-run]',result='#attention-online-feedback',untouched='#attention-weighted-feedback',untouched_text=['Run to inspect the scores, weights and result.'],advance=1,position='[data-book-experiment="attention-online"] [data-position]'),
    dict(slug='inference',chapter=13,title='Connect cache capacity to inference budgets',control='#inference-phase-phase',value='prefill',run='[data-book-experiment="inference-phase"] [data-run]',result='#inference-phase-feedback',untouched='#inference-capacity-feedback',untouched_text=['Predict the result, then press Run.'],advance=2,position='[data-book-experiment="inference-phase"] [data-position]')]

def check_foundations_recordings(browser,url,root,errors):
    for spec in RECORDINGS:
        slug=spec['slug'];media=json.loads((root/f'content/{slug}-media.json').read_text())
        scenes=json.loads((root/f'content/{slug}-scenes.json').read_text())
        for width in [390,820,1440]:
            for theme in ['light','dark']:
                ctx=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
                page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(url+f'lessons/{slug}.html?keep=video')
                page.locator(spec['control']).select_option(spec['value']);page.locator(spec['run']).click()
                if spec.get('advance'):
                    for _ in range(spec['advance']):page.locator(spec['run']).locator('xpath=..').locator('[data-next]').click()
                trace_position=page.locator(spec['position']).inner_text() if spec.get('position') else None
                result=page.locator(spec['result']).inner_text()
                if spec.get('untouched'):expect(page.locator(spec['untouched'])).to_have_text(spec['untouched_text'])
                recap=page.locator(f'#{slug}-recording-link')
                assert recap.evaluate('el=>el.previousElementSibling.matches(".book-section")&&el.nextElementSibling.matches(".desktop-links")')
                link=page.locator(f'#{slug}-watch');link.evaluate("el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-250,behavior:'instant'})")
                position=page.evaluate('scrollY');link.focus();page.keyboard.press('Enter')
                expect(page.locator('h1')).to_have_text(spec['title'])
                expect(page.locator('.sidebar')).to_be_hidden()
                expect(page.locator('#lesson-complete,.chapter-references')).to_have_count(0)
                video=page.locator(f'#{slug}-video')
                for attr in ['controls','playsinline']:expect(video).to_have_attribute(attr,'')
                expect(video).to_have_attribute('preload','none');assert video.get_attribute('autoplay') is None
                expect(video.locator('track')).to_have_attribute('kind','captions')
                expect(video.locator('track')).to_have_attribute('srclang','en')
                expect(video.locator('track')).to_have_attribute('default','')
                page.locator(f'#{slug}-transcript summary').focus();page.keyboard.press('Enter')
                expect(page.locator(f'#{slug}-transcript section')).to_have_count(len(scenes))
                video.evaluate('v=>v.load()');page.wait_for_function('id=>document.getElementById(id).readyState>=1',arg=slug+'-video')
                assert abs(video.evaluate('v=>v.duration')-media['durationSeconds'])<1
                assert video.evaluate('v=>v.videoWidth')==3840
                video.evaluate('v=>{v.currentTime=45;v.playbackRate=1.25;v.muted=true;v.play()}')
                page.wait_for_function('id=>document.getElementById(id).currentTime>45.1',arg=slug+'-video');video.evaluate('v=>v.pause()')
                page.wait_for_function('id=>document.getElementById(id).textTracks[0].cues?.length>0',arg=slug+'-video')
                assert video.evaluate('v=>v.textTracks[0].mode')=='showing'
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                page.locator(f'#{slug}-recording').screenshot(path=str(root/f'test-results/{slug}-video-{width}-{theme}.png'),style='.topbar{position:static!important}')
                page.locator(f'#{slug}-return').click();expect(page).to_have_url(url+f'lessons/{slug}.html?keep=video')
                expect(page.locator(spec['control'])).to_have_value(spec['value'])
                expect(page.locator(spec['result'])).to_have_text(result,use_inner_text=True)
                if trace_position:expect(page.locator(spec['position'])).to_have_text(trace_position)
                if spec.get('untouched'):expect(page.locator(spec['untouched'])).to_have_text(spec['untouched_text'])
                page.wait_for_function('position=>Math.abs(scrollY-position)<8',arg=position)
                expect(page.locator(f'#{slug}-watch')).to_be_focused();page.locator(f'#{slug}-watch').click()
                page.wait_for_function('id=>document.getElementById(id).currentTime>=45',arg=slug+'-video')
                assert page.locator(f'#{slug}-video').evaluate('v=>v.paused&&v.playbackRate===1.25')
                expect(page.locator(f'#{slug}-transcript')).to_have_attribute('open','');ctx.close()
        ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000})
        page=ctx.new_page();page.goto(url+f'lessons/{slug}-video.html')
        expect(page.locator(f'#{slug}-video')).to_be_visible();page.locator(f'#{slug}-transcript summary').click()
        expect(page.locator(f'#{slug}-transcript')).to_contain_text(scenes[-1]['captions'][-1])
        expect(page.locator(f'#{slug}-return')).to_have_attribute('href',f'{slug}.html#{slug}-recording-link')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');ctx.close()
        print(f'PASS: Chapter {spec["chapter"]} recording: native playback/captions, keyboard, independent parent state and paused return, six layouts/themes, no JavaScript')
