from version_check import mock_version, check_version
# Copyright © 2026 Christopher Snow.
from playwright.sync_api import expect

SLUGS = [('reduction', None), ('matmul', '512'), ('tensor-cores', '8'), ('attention', '0'), ('inference', None)]
NAMED_CHOICES = {'reduction': 'All reads are safe', 'inference': 'Memory-limited'}

def metric(page, label):
    return page.locator(f'[data-metric="{label}"] strong')

def check_remaining(browser, base_url, root, errors):
    for width in [1440, 360]:
        for theme in ['light', 'dark']:
            context = browser.new_context(viewport={'width': width, 'height': 1000}, color_scheme=theme)
            mock_version(context)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
            for slug, guess in SLUGS:
                page.goto(base_url + 'lessons/' + slug + '.html')
                expect(page.locator('#results')).to_be_hidden()
                expect(page.locator('html')).to_have_attribute('data-theme', theme)
                # Worked example is visible before any interaction.
                expect(page.locator('.worked-example')).to_be_visible()
                expect(page.locator('.concepts')).to_be_visible()
                assert page.locator('.concepts dt').count() >= 2, slug
                assert page.locator('section.concepts').evaluate('(node) => !!node.closest("section.prose")')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{slug} concepts overflow'
                if slug in NAMED_CHOICES:
                    page.locator(f'input[name="guess"][value="0"]').check()
                else:
                    page.locator('#guess').fill(guess)
                page.get_by_role('button', name='Check prediction').click()
                expect(page.locator('#feedback')).to_contain_text('Your prediction matches')
                expect(page.locator(f'[data-visual="{slug}"]')).to_be_visible()
                before = page.locator('#step-detail').inner_text()
                page.locator('#next').click()
                assert page.locator('#step-detail').inner_text() != before
                page.locator('#step').focus()
                page.locator('#step').press('End')
                expect(page.locator('#next')).to_be_disabled()
                if slug == 'reduction':
                    expect(page.locator('.tree-node.active-level strong')).to_have_text('36')
                page.locator('#restart').click()
                expect(page.locator('#step-detail')).to_have_text(before)
                if slug == 'reduction':
                    page.locator('#ordering').select_option('unsafe')
                    expect(page.locator('#results')).to_be_hidden()
                    page.locator('input[name="guess"][value="1"]').check()
                    page.get_by_role('button', name='Check prediction').click()
                    expect(page.locator('#feedback')).to_contain_text('matches: 1')
                    expect(metric(page, 'Computed sum')).to_have_text('Undefined')
                    page.locator('#next').click()
                    expect(page.locator('.hazard-note')).to_be_visible()
                elif slug == 'matmul':
                    page.locator('#tile').select_option('4')
                    page.locator('details.more-settings summary').click()
                    page.locator('#registers').select_option('64')
                    page.locator('#sharedBudget').select_option('128')
                    page.locator('#guess').fill('0')
                    page.get_by_role('button', name='Check prediction').click()
                    expect(page.locator('#feedback')).to_contain_text('model gives 256')
                    expect(metric(page, 'Resident blocks (toy SM)')).to_have_text('1')
                    expect(page.locator('.resource-pool')).to_have_count(3)
                    expect(page.locator('.resident-blocks .flow-box')).to_have_count(1)
                    expect(page.locator('.matrix-group .matrix-panel')).to_have_count(3)
                elif slug == 'tensor-cores':
                    expect(page.locator('.format-row')).to_have_count(3)
                    page.locator('#format').select_option('fp32')
                    page.locator('#show-result').click()
                    expect(metric(page, 'Absolute difference')).to_have_text('0')
                    page.locator('#pattern').select_option('small')
                    page.locator('#format').select_option('fp16')
                    page.locator('#show-result').click()
                    expect(metric(page, 'Selected result C[0,0]')).to_have_text('0')
                    page.locator('#format').select_option('bf16')
                    page.locator('#show-result').click()
                    assert float(metric(page, 'Selected result C[0,0]').inner_text().replace(',', '')) > 0
                elif slug == 'attention':
                    page.locator('#mode').select_option('materialised')
                    page.locator('#guess').fill('128')
                    page.get_by_role('button', name='Check prediction').click()
                    expect(page.locator('#feedback')).to_contain_text('matches: 128')
                    expect(metric(page, 'Intermediate read/write bytes')).to_have_text('1,024')
                    expect(page.locator('.attention-comparison .matrix-footprint')).to_have_count(2)
                    page.locator('#mode').select_option('online')
                    page.locator('#scale').select_option('1000')
                    page.locator('#show-result').click()
                    assert float(metric(page, 'Max reference difference').inner_text().replace(',', '')) < 1e-12
                else:
                    page.locator('#phase').select_option('prefill')
                    page.locator('#batch').select_option('16')
                    page.locator('details.more-settings summary').click()
                    page.locator('#sequence').select_option('2048')
                    page.locator('#show-result').click()
                    expect(metric(page, 'Dominant bound')).to_have_text('compute')
                    expect(page.locator('.sequence-lane')).to_have_count(4)
                    expect(page.locator('[data-visual="inference"]')).to_contain_text('2,048 cached tokens per sequence')
                    page.locator('#measuredMs').fill('0.01')
                    page.locator('#measuredMs').press('Tab')
                    page.locator('#show-result').click()
                    expect(page.locator('#explanation')).to_contain_text('below the model bound')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{slug}: horizontal overflow'
                page.screenshot(path=str(root / f'test-results/{slug}-{width}-{theme}.png'), full_page=True)
                page.get_by_role('link', name='Return to roadmap →' if slug == 'inference' else 'Next lesson →').click()
                expect(page.locator('h1')).to_be_visible()
            context.close()
            print(f'PASS: remaining labs and reduction workshop, {width}px, {theme}; predictions, stepping, accuracy, resource limits, navigation')
    context = browser.new_context(java_script_enabled=False)
    mock_version(context)
    page = context.new_page()
    for slug, _ in SLUGS:
        page.goto(base_url + 'lessons/' + slug + '.html')
        expect(page.locator('noscript .notice')).to_be_visible()
        expect(page.locator('.worked-example')).to_be_visible()
        expect(page.locator('.challenge li')).to_have_count(4)
        expect(page.locator('.lesson-nav a[aria-current="page"]')).to_have_count(1)
    context.close()
