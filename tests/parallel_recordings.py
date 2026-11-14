# Copyright © 2026 Christopher Snow.
"""Published Part II recaps, model visuals and independent player/lesson state."""
import json,subprocess
from playwright.sync_api import expect
from version_check import mock_version

def check_parallel_recordings(browser,url,root,errors):
    recaps=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {parallelRecordings} from './src/parallel-recordings.mjs';console.log(JSON.stringify(parallelRecordings))"],cwd=root,text=True))
    for recap in recaps:
        slug=recap['slug'];media=json.loads((root/f'content/{slug}-media.json').read_text())
        scenes=json.loads((root/f'content/{slug}-scenes.json').read_text())
        for width in [390,820,1440]:
            for theme in ['light','dark']:
                ctx=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block');mock_version(ctx)
                page=ctx.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
                parent=url+f'lessons/{slug}.html?keep=visual-recap';page.goto(parent)
                ex=page.locator('[data-parallel]').last
                for control in ex.locator('select').all():control.select_option(index=1)
                ex.locator('[data-run]').click();ex.locator('[data-next]').click()
                result=ex.locator('[data-result]').inner_text();expect(ex.locator('.pattern-figure')).to_be_visible()
                link=page.locator(f'#{slug}-watch');link.scroll_into_view_if_needed();position=page.evaluate('scrollY')
                link.focus();page.keyboard.press('Enter')
                video=page.locator(f'#{slug}-video');expect(video).to_be_visible();expect(video).to_have_attribute('preload','none')
                expect(page.locator(f'#{slug}-recording')).to_have_attribute('aria-label',f"Chapter {recap['chapter']} narrated recap")
                expect(page.locator('#lesson-complete,.chapter-references')).to_have_count(0)
                video.evaluate('v=>v.load()');page.wait_for_function('id=>document.getElementById(id).readyState>=1',arg=slug+'-video')
                assert video.evaluate('v=>[v.videoWidth,v.videoHeight]')==[3840,2160]
                assert abs(video.evaluate('v=>v.duration')-media['durationSeconds'])<1
                video.evaluate('v=>{v.currentTime=45;v.playbackRate=1.25;v.muted=true;v.play()}')
                page.wait_for_function('id=>document.getElementById(id).currentTime>45.1',arg=slug+'-video');video.evaluate('v=>v.pause()')
                page.wait_for_function('id=>document.getElementById(id).textTracks[0].cues?.length>0',arg=slug+'-video')
                assert video.evaluate('v=>v.textTracks[0].mode')=='showing'
                page.locator(f'#{slug}-transcript > summary').click();expect(page.locator(f'#{slug}-transcript section')).to_have_count(len(scenes))
                page.locator(f'#{slug}-recording').screenshot(path=str(root/f'test-results/{slug}-recap-{width}-{theme}.png'),style='.topbar{position:static!important}')
                page.locator(f'#{slug}-return').click();expect(page).to_have_url(parent)
                expect(ex.locator('[data-result]')).to_have_text(result,use_inner_text=True)
                page.wait_for_function('position=>Math.abs(scrollY-position)<8',arg=position);expect(page.locator(f'#{slug}-watch')).to_be_focused()
                ex.screenshot(path=str(root/f'test-results/{slug}-visual-{width}-{theme}.png'),style='.topbar{position:static!important}')
                page.locator(f'#{slug}-watch').click();page.wait_for_function('id=>document.getElementById(id).currentTime>=45',arg=slug+'-video')
                assert page.locator(f'#{slug}-video').evaluate('v=>v.paused&&v.playbackRate===1.25')
                expect(page.locator(f'#{slug}-transcript')).to_have_attribute('open','')
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');ctx.close()
        ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000});page=ctx.new_page()
        page.goto(url+f'lessons/{slug}.html');expect(page.locator(f'#{slug}-watch')).to_be_visible()
        page.get_by_text('Inspect a worked example',exact=True).first.click();expect(page.locator('.pattern-figure').first).to_be_visible()
        page.goto(url+f'lessons/{slug}-video.html');expect(page.locator(f'#{slug}-video')).to_be_visible()
        page.locator(f'#{slug}-transcript > summary').click();expect(page.locator(f'#{slug}-transcript')).to_contain_text(scenes[-1]['captions'][-1])
        expect(page.locator(f'#{slug}-return')).to_have_attribute('href',f'{slug}.html#{slug}-recording-link')
        assert ctx.request.get(url+f'assets/media/{slug}/slides.pdf').ok;ctx.close()
        print(f'PASS: Chapter {recap["chapter"]} visual and narrated recap: six layouts/themes, 4K playback/captions, keyboard, parent/player restoration, transcript/PDF and no-JavaScript')
