# Copyright © 2026 Christopher Snow.
"""Every chapter has a dedicated recap; new recordings preserve lesson/player state."""
import json
import re
from playwright.sync_api import expect
from version_check import mock_version
from course_flow import SLUGS

NEW=[('hello',1),('launch-from-input',3),('putting-it-together',14)]


def prepare(page,slug):
    if slug=='hello':
        page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
        return page.locator('#hello-output-0').inner_text()
    if slug=='launch-from-input':
        page.locator('#launch-comparison > summary').click()
        return page.locator('#launch-comparison').inner_text()
    page.locator('#capstone-choice-tile').select_option('4')
    page.locator('#capstone-choice [data-run]').click()
    return page.locator('#capstone-choice-feedback').inner_text()


def check_parent(page,slug,result):
    if slug=='hello':
        expect(page.locator('#hello-factor-0')).to_have_value('3')
        expect(page.locator('#hello-output-0')).to_have_text(result)
    elif slug=='launch-from-input':
        expect(page.locator('#launch-comparison')).to_have_attribute('open','')
        expect(page.locator('#launch-comparison')).to_have_text(result,use_inner_text=True)
    else:
        expect(page.locator('#capstone-choice-tile')).to_have_value('4')
        expect(page.locator('#capstone-choice-feedback')).to_have_text(result)


def check_complete_recaps(browser,url,root,errors):
    ctx=browser.new_context(service_workers='block');mock_version(ctx);page=ctx.new_page()
    for number,slug in enumerate(SLUGS,1):
        page.goto(url+f'lessons/{slug}.html')
        section=page.locator(f'#{slug}-recording-link')
        expect(section).to_have_count(1)
        expect(section).to_have_attribute('data-section-kind','recap')
        link=section.locator(f'#{slug}-watch')
        expect(link).to_have_attribute('href',f'{slug}-video.html?from={slug}')
        response=ctx.request.get(url+f'lessons/{slug}-video.html')
        assert response.ok,(number,slug,response.status)
    ctx.close()
    for slug,chapter in NEW:
        media=json.loads((root/f'content/{slug}-media.json').read_text())
        scenes=json.loads((root/f'content/{slug}-scenes.json').read_text())
        for width in [390,820,1440]:
            for theme in ['light','dark']:
                ctx=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
                mock_version(ctx);page=ctx.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
                parent=url+f'lessons/{slug}.html?keep=recap'
                page.goto(parent);result=prepare(page,slug)
                link=page.locator(f'#{slug}-watch');link.scroll_into_view_if_needed()
                position=page.evaluate('scrollY');link.focus();page.keyboard.press('Enter')
                expect(page.locator(f'#{slug}-recording')).to_have_attribute('aria-label',f'Chapter {chapter} narrated recap')
                expect(page.locator('#lesson-complete,.chapter-references')).to_have_count(0)
                video=page.locator(f'#{slug}-video');expect(video).to_be_visible()
                expect(video.locator('track')).to_have_attribute('src',re.compile(rf'/assets/media/{slug}/captions\.vtt$'))
                expect(video).to_have_attribute('preload','none')
                expect(page.locator(f'#{slug}-transcript')).not_to_have_attribute('open','')
                page.locator(f'#{slug}-transcript > summary').focus();page.keyboard.press('Enter')
                expect(page.locator(f'#{slug}-transcript section')).to_have_count(len(scenes))
                video.evaluate('v=>v.load()');page.wait_for_function('id=>document.getElementById(id).readyState>=1',arg=slug+'-video')
                assert video.evaluate('v=>[v.videoWidth,v.videoHeight]')==[3840,2160]
                assert abs(video.evaluate('v=>v.duration')-media['durationSeconds'])<1
                video.evaluate('v=>{v.currentTime=45;v.playbackRate=1.25;v.muted=true;v.play()}')
                page.wait_for_function('id=>document.getElementById(id).currentTime>45.1',arg=slug+'-video');video.evaluate('v=>v.pause()')
                page.wait_for_function('id=>document.getElementById(id).textTracks[0].cues?.length>0',arg=slug+'-video')
                assert video.evaluate('v=>v.textTracks[0].mode')=='showing'
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                page.locator(f'#{slug}-recording').screenshot(path=str(root/f'test-results/complete-recap-{slug}-{width}-{theme}.png'),style='.topbar{position:static!important}')
                page.locator(f'#{slug}-return').click();expect(page).to_have_url(parent)
                check_parent(page,slug,result)
                page.wait_for_function('position=>Math.abs(scrollY-position)<8',arg=position)
                expect(page.locator(f'#{slug}-watch')).to_be_focused()
                page.locator(f'#{slug}-watch').click()
                page.wait_for_function('id=>document.getElementById(id).currentTime>=45',arg=slug+'-video')
                assert page.locator(f'#{slug}-video').evaluate('v=>v.paused&&v.playbackRate===1.25')
                expect(page.locator(f'#{slug}-transcript')).to_have_attribute('open','')
                ctx.close()
        ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':1000});page=ctx.new_page()
        page.goto(url+f'lessons/{slug}.html');expect(page.locator(f'#{slug}-watch')).to_be_visible()
        page.goto(url+f'lessons/{slug}-video.html');expect(page.locator(f'#{slug}-video')).to_be_visible()
        page.locator(f'#{slug}-transcript > summary').click()
        expect(page.locator(f'#{slug}-transcript')).to_contain_text(scenes[-1]['captions'][-1])
        expect(page.locator(f'#{slug}-return')).to_have_attribute('href',f'{slug}.html#{slug}-recording-link')
        assert ctx.request.get(url+f'assets/media/{slug}/slides.pdf').ok
        ctx.close()
        print(f'PASS: Chapter {chapter} recap: 4K playback, captions/transcript, keyboard, preserved parent/player state, six layouts/themes and static fallback')
    print('PASS: dedicated recap links and pages for all fourteen chapters')
