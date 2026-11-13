from course_flow import SLUGS
# Copyright © 2026 Christopher Snow.
"""Optional chapter endings stay compact without hiding the teaching or next step."""
import json
from playwright.sync_api import expect
from version_check import mock_version


def check_section_cues(browser, url, root):
    for width in [360,820,1440]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
            mock_version(context);page=context.new_page();errors=[]
            page.on('pageerror',lambda error:errors.append(str(error)))
            for slug in ['hello','reading','launch-from-input','putting-it-together','kernel','shared-memory']:
                page.goto(url+'lessons/'+slug+'.html')
                for kind in ['desktop','references','documentation']:
                    resource=page.locator(f'[data-section-kind="{kind}"]')
                    if kind=='desktop' and slug=='shared-memory':continue
                    expect(resource).to_have_count(1)
                    assert resource.evaluate('e=>e.tagName==="DETAILS"&&!e.open')
                    summary=resource.locator(':scope > summary')
                    expect(summary).to_be_visible()
                    assert summary.bounding_box()['height']>=44
                    summary.focus();page.keyboard.press('Enter')
                    expect(resource).to_have_attribute('open','')
                    expect(resource.locator('.resource-body')).to_be_visible()
                    heading=resource.locator('.section-cue-heading').first
                    expect(heading).to_be_visible()
                    expect(heading.locator('[aria-hidden="true"] svg')).to_have_attribute('focusable','false')
                    assert resource.evaluate('e=>e.scrollWidth<=e.clientWidth'),(slug,width,theme)
                    resource.screenshot(path=str(root/f'test-results/resource-open-{slug}-{kind}-{width}-{theme}.png'))
                    summary.focus();page.keyboard.press('Space')
                    expect(resource).not_to_have_attribute('open','')
                resources=page.locator('.chapter-resource')
                height=resources.last.bounding_box()['y']+resources.last.bounding_box()['height']-resources.first.bounding_box()['y']
                # The capstone includes its course-continuation section after the recap.
                if slug!='putting-it-together': assert height<350,(slug,width,theme,height)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(slug,width,theme)
                first=resources.first
                first.evaluate("e=>scrollTo({top:scrollY+e.getBoundingClientRect().top-180,behavior:'instant'})")
                page.screenshot(path=str(root/f'test-results/resource-ending-{slug}-{width}-{theme}.png'))
            if (width,theme)==(820,'light'):
                for slug in SLUGS:
                    page.goto(url+'lessons/'+slug+'.html')
                    link=page.locator(f'#{slug}-watch')
                    expect(link).to_be_visible()
                    media=json.loads((root/f'content/{slug}-media.json').read_text())
                    seconds=media['durationSeconds'];duration=f'{seconds//60}:{seconds%60:02}'
                    expect(link.locator('.recap-duration')).to_have_text(duration)
                    assert link.bounding_box()['height']>=44
            page.goto(url+'lessons/hello.html')
            page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
            for kind in ['references','documentation']:
                page.locator(f'[data-section-kind="{kind}"]>summary').click()
            link=page.locator('#hello-watch');link.focus();page.keyboard.press('Enter')
            expect(page.locator('#hello-video')).to_be_visible()
            page.locator('#hello-return').click()
            expect(page.locator('#hello-factor-0')).to_have_value('3')
            expect(page.locator('#hello-output-0')).to_have_text('Output: [3.0, 6.0, 9.0, 12.0, 15.0]')
            for kind in ['references','documentation']:
                expect(page.locator(f'[data-section-kind="{kind}"]')).to_have_attribute('open','')
            expect(page.locator('#hello-watch')).to_be_focused()
            assert not errors,errors
            context.close()
    context=browser.new_context(java_script_enabled=False,viewport={'width':360,'height':900})
    page=context.new_page()
    for slug in ['hello','reading','putting-it-together','kernel']:
        page.goto(url+f'lessons/{slug}.html')
        for kind in ['desktop','references','documentation']:
            resource=page.locator(f'[data-section-kind="{kind}"]')
            resource.locator(':scope > summary').click()
            expect(resource.locator('.resource-body')).to_be_visible()
        if slug!='kernel':expect(page.locator(f'#{slug}-watch')).to_be_visible()
    context.close()
    print('PASS: compact resources, keyboard disclosures, recap durations, preserved work/disclosures, static fallback, six layouts/themes')
