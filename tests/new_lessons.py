# Copyright © 2026 Christopher Snow.
from playwright.sync_api import expect

def check_lessons(browser, base_url, root, errors):
    for width in [1440, 360]:
        for theme in ['light', 'dark']:
            context = browser.new_context(viewport={'width': width, 'height': 1000}, color_scheme=theme)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
            for slug, guess in [('scheduling', '10'), ('divergence', '4'), ('shared-memory', '32')]:
                page.goto(base_url + 'lessons/' + slug + '.html')
                expect(page.locator('html')).to_have_attribute('data-theme', theme)
                expect(page.locator('#results')).to_be_hidden()
                page.locator('#guess').fill(guess)
                page.get_by_role('button', name='Check prediction').click()
                expect(page.locator('#feedback')).to_contain_text('Your prediction matches')
                before = page.locator('#step-detail').inner_text()
                page.locator('#next').click()
                assert page.locator('#step-detail').inner_text() != before
                page.locator('#restart').click()
                expect(page.locator('#step-detail')).to_have_text(before)
                expect(page.locator('#back')).to_be_disabled()
                if slug == 'scheduling':
                    page.locator('#warps').select_option('8')
                    expect(page.locator('#results')).to_be_hidden()
                    page.locator('#guess').fill('0')
                    page.get_by_role('button', name='Check prediction').click()
                    expect(page.locator('#feedback')).to_contain_text('matches: 0')
                    expect(page.locator('.warp-card')).to_have_count(8)
                elif slug == 'divergence':
                    page.locator('#pattern').select_option('halves')
                    page.locator('#activeLanes').select_option('16')
                    page.locator('#inspect').click()
                    expect(page.locator('#next')).to_be_disabled()
                    expect(page.locator('.mask-lane.selected')).to_have_count(16)
                    expect(page.locator('.mask-lane.inactive')).to_have_count(16)
                    page.locator('#lane').select_option('20')
                    expect(page.locator('#lane-detail')).to_contain_text('inactive; no output write')
                else:
                    page.locator('#bankPattern').select_option('padded')
                    page.locator('#inspect').click()
                    expect(page.locator('.bank-card.selected')).to_have_count(32)
                    expect(page.locator('#next')).to_be_disabled()
                    page.locator('#lane').select_option('1')
                    expect(page.locator('#lane-detail')).to_contain_text('word 33, byte address 132, bank 1')
                    page.locator('#bankPattern').select_option('broadcast')
                    page.locator('#inspect').click()
                    expect(page.locator('.bank-card.selected')).to_have_count(1)
                    expect(page.locator('#step-detail')).to_contain_text('1 banks serve 32 lanes')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{slug}: horizontal overflow'
                page.screenshot(path=str(root / f'test-results/{slug}-{width}-{theme}.png'), full_page=True)
                page.get_by_role('link', name='Next lesson →').click()
                expect(page.locator('h1')).to_be_visible()
            context.close()
            print(f'PASS: three new lessons, {width}px, {theme}; predictions, trace, masks, banks, navigation')
    context = browser.new_context(java_script_enabled=False)
    page = context.new_page()
    for slug in ['scheduling', 'divergence', 'shared-memory']:
        page.goto(base_url + 'lessons/' + slug + '.html')
        expect(page.locator('noscript .notice')).to_be_visible()
        expect(page.locator('.challenge li')).to_have_count(4)
        expect(page.locator('.lesson-nav a[aria-current="page"]')).to_have_count(1)
    context.close()
