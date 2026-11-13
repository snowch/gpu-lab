from course_flow import SLUGS
# Copyright © 2026 Christopher Snow.
"""Recurring section roles stay visible, labelled and usable in the shared design."""
from playwright.sync_api import expect
from version_check import mock_version


def check_section_cues(browser, url, root):
    for width in [360,820,1440]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
            mock_version(context)
            page=context.new_page()
            for slug in ['reading','hello','launch-from-input','putting-it-together','kernel','shared-memory']:
                page.goto(url+'lessons/'+slug+'.html')
                expect(page.locator('.chapter-resource[data-section-kind="references"] h2')).to_have_accessible_name('References')
                for section in page.locator('.chapter-resource').all():
                    section.evaluate("el=>{for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true}")
                    if section.evaluate('el=>el.tagName==="DETAILS"&&!el.open'):section.locator(':scope > summary').click()
                    heading=section.locator('.section-cue-heading').first
                    expect(heading).to_be_visible()
                    expect(heading.locator('[aria-hidden="true"] svg')).to_have_attribute('focusable','false')
                    assert heading.inner_text().strip()
                    assert section.evaluate('el=>el.scrollWidth<=el.clientWidth'),(slug,width,theme)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(slug,width,theme)
            if (width,theme)==(820,'light'):
                for slug in SLUGS:
                    page.goto(url+'lessons/'+slug+'.html')
                    for section in page.locator('section[id$="-recording-link"]').all():
                        expect(section).to_have_attribute('data-section-kind','recap')
                        expect(section.locator('.section-cue-heading')).to_be_visible()
            page.goto(url+'lessons/reading.html')
            recap=page.locator('[data-section-kind="recap"]')
            recap.screenshot(path=str(root/f'test-results/resource-recap-{width}-{theme}.png'),style='.topbar{position:static!important}')
            link=recap.locator('a');link.focus();page.keyboard.press('Enter')
            expect(page.locator('#reading-video')).to_be_visible()
            context.close()
    context=browser.new_context(java_script_enabled=False,viewport={'width':360,'height':900})
    page=context.new_page();page.goto(url+'lessons/reading.html')
    for kind in ['recap','desktop','references','documentation']:
        expect(page.locator(f'[data-section-kind="{kind}"] h2')).to_be_visible()
    context.close()
    print('PASS: section roles, decorative icons, readable headings, keyboard recap link, static fallback, layouts and themes')
