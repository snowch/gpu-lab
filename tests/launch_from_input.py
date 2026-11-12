# Copyright © 2026 Christopher Snow.
"""Guided host setup: entry, readable excerpts, native answers and return path."""
from playwright.sync_api import expect


def check_launch_from_input(browser, url, root):
    for width in [390, 820, 1440]:
        for theme in ['light', 'dark']:
            context = browser.new_context(viewport={'width': width, 'height': 1000}, color_scheme=theme, service_workers='block')
            page = context.new_page()
            page.goto(url + 'lessons/devices.html')
            page.locator('#device-factor-2').fill('3')
            page.locator('#device-run-2').click()
            page.locator('#cuda-practice a').click()
            expect(page.locator('h1')).to_have_text('From an input array to a CUDA launch')
            expect(page.locator('main > header .eyebrow')).to_have_text('EXTRA PRACTICE')
            expect(page.locator('#launch-sizes')).to_contain_text('input.size()')
            expect(page.locator('#launch-copy_in + .code-explanations li')).to_have_count(4)
            explanation = page.locator('#launch-sizes + .code-explanations button').first
            explanation.focus()
            expect(page.locator('#launch-sizes .is-code-highlighted')).to_contain_text('int n =')
            expect(page.locator('#launch-comparison')).not_to_have_attribute('open', '')
            page.locator('#launch-comparison > summary').focus()
            page.keyboard.press('Enter')
            expect(page.locator('#launch-comparison')).to_contain_text('9 × 4 = 36 bytes')
            expect(page.locator('#launch-comparison')).to_contain_text('9–11')
            page.get_by_text('Read the complete CUDA program', exact=True).click()
            expect(page.locator('#launch-complete')).to_contain_text('input.empty()')
            response = context.request.get(url + 'examples/launch-from-input.cu')
            assert response.ok
            assert page.locator('#launch-complete').inner_text() == response.text()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(root / f'test-results/launch-from-input-{width}-{theme}.png'), full_page=True)
            page.go_back()
            expect(page.locator('#device-factor-2')).to_have_value('3')
            expect(page.locator('#device-feedback-2')).to_contain_text('[3.0, 6.0, 9.0, 12.0, 15.0]')
            context.close()

    context = browser.new_context(java_script_enabled=False)
    page = context.new_page()
    page.goto(url + 'lessons/launch-from-input.html')
    expect(page.locator('#launch-sizes + .code-explanations')).to_be_visible()
    page.locator('#launch-comparison > summary').click()
    expect(page.locator('#launch-comparison')).to_contain_text('extra blocks alone would not fix')
    expect(page.get_by_role('link', name='Download the complete CUDA program', exact=True)).to_be_visible()
    context.close()
    print('PASS: input-derived launch practice, keyboard/no-JavaScript answers, exact-source download, return state and phone/tablet/desktop in both themes')
