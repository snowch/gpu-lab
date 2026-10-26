# Copyright © 2026 Christopher Snow.
"""Optional shared-memory bank lab; migrated chapters use continuation checks."""
from playwright.sync_api import expect
from version_check import mock_version

def check_lessons(browser, base_url, root, errors):
    for width in [1440, 360]:
        for theme in ['light', 'dark']:
            context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme)
            mock_version(context)
            page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(base_url+'lessons/shared-memory.html')
            expect(page.locator('#results')).to_be_hidden()
            expect(page.locator('.worked-example')).to_be_visible()
            expect(page.locator('.concepts')).to_be_visible()
            page.locator('#guess').fill('32');page.get_by_role('button',name='Check prediction').click()
            expect(page.locator('#feedback')).to_contain_text('Your prediction matches')
            expect(page.locator('[data-visual="shared-memory"]')).to_be_visible()
            before=page.locator('#step-detail').inner_text();page.locator('#next').click()
            assert page.locator('#step-detail').inner_text()!=before
            page.locator('#restart').click();expect(page.locator('#step-detail')).to_have_text(before)
            page.locator('#bankPattern').select_option('padded');page.locator('#show-result').click()
            expect(page.locator('.bank-card.selected')).to_have_count(32)
            expect(page.locator('#next')).to_be_disabled()
            page.locator('#lane').select_option('1');expect(page.locator('#lane-detail')).to_contain_text('word 33, byte address 132, bank 1')
            page.locator('#bankPattern').select_option('broadcast');page.locator('#show-result').click()
            expect(page.locator('.bank-card.selected')).to_have_count(1)
            expect(page.locator('.word-queue')).to_contain_text('32 readers')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(root/f'test-results/shared-memory-{width}-{theme}.png'),full_page=True)
            context.close()
    context=browser.new_context(java_script_enabled=False);page=context.new_page()
    page.goto(base_url+'lessons/shared-memory.html')
    expect(page.locator('.worked-example')).to_be_visible();expect(page.locator('.challenge li')).to_have_count(4)
    context.close()
    print('PASS: optional bank lab, predictions, padding, broadcast, keyboard and static fallback')
