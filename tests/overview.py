# Copyright © 2026 Christopher Snow.
"""Follow blocks and warps through the architecture introduction."""
from playwright.sync_api import expect
from version_check import mock_version


def check_overview(browser, base_url, root, errors):
    for width in [1440, 360]:
        for theme in ['light', 'dark']:
            context = browser.new_context(viewport={'width': width, 'height': 1000}, color_scheme=theme)
            mock_version(context)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(base_url+'#meet-gpu')
            expect(page).to_have_url(base_url+'lessons/meet-gpu.html')
            for layer in page.locator('.architecture-layer').all():
                if layer.get_attribute('open') is None:
                    layer.locator('summary').click()
            expect(page.locator('.sm-block')).to_have_count(2)
            expect(page.locator('.sm-registers')).to_have_count(4)
            expect(page.locator('.sm-shared')).to_have_count(2)
            page.locator('.sm-ownership').screenshot(path=str(root / f'test-results/sm-ownership-{width}-{theme}.png'), style='.topbar { visibility:hidden; }')
            for block, sm in [('A', 0), ('B', 1), ('C', 0), ('D', 1)]:
                page.locator('#map-block').select_option(block)
                expect(page.locator(f'[data-map-block="{block}"].is-selected')).to_have_count(2)
                expect(page.locator('.work-sm.is-selected')).to_have_attribute('data-map-sm', str(sm))
                expect(page.locator('#work-map-selection')).to_contain_text(f'block {block} on SM {sm}')
            page.locator('#map-warp').focus()
            page.keyboard.press('ArrowDown')
            expect(page.locator('#map-warp')).to_have_value('1')
            expect(page.locator('.overview-lane')).to_have_count(32)
            expect(page.locator('.overview-lane').first).to_have_attribute('aria-label', 'Lane 0, thread 32')
            expect(page.locator('.overview-lane').last).to_have_attribute('aria-label', 'Lane 31, thread 63')
            page.locator('#work-map').screenshot(path=str(root / f'test-results/work-map-{width}-{theme}.png'), style='.topbar,.work-map-controls { visibility:hidden; }')
            page.locator('.overview-lanes').scroll_into_view_if_needed()
            expect(page.locator('#work-map-controls')).to_be_in_viewport()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Overview diagram overflows'
            assert page.locator('#work-map').evaluate('el => el.scrollWidth <= el.clientWidth')
            context.close()
    context = browser.new_context(viewport={'width': 360, 'height': 800}, java_script_enabled=False)
    page = context.new_page()
    page.goto(base_url+'lessons/meet-gpu.html')
    for layer in page.locator('.architecture-layer').all():
        if layer.get_attribute('open') is None:
            layer.locator('summary').click()
    expect(page.locator('.sm-ownership')).to_be_visible()
    expect(page.locator('#work-map')).to_be_visible()
    expect(page.locator('.overview-lane')).to_have_count(32)
    expect(page.locator('#work-map-controls')).to_be_hidden()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    context.close()
    print('PASS: SM resources, block placement, keyboard warp selection, lane indices, both themes and no-JavaScript diagrams')
