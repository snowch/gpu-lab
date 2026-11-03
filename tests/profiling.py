# Copyright © 2026 Christopher Snow.
"""The optional hardware guide remains readable without GPU execution."""
from playwright.sync_api import expect


def check_profiling(browser, url, root, errors):
    for width in [360, 800, 1440]:
        for theme in ['light', 'dark']:
            context = browser.new_context(viewport={'width': width, 'height': 1000},
                                          color_scheme=theme, service_workers='block')
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url + 'lessons/profiling.html')
            expect(page.locator('h1')).to_have_text('Inspect PyTorch GPU launches')
            expect(page.locator('#lesson-complete')).to_have_count(0)
            expect(page.locator('#profiling-capture')).to_contain_text('prof.export_chrome_trace("trace.json")')
            expect(page.locator('#profiling-capture')).not_to_contain_text('args.external')
            expect(page.locator('#profiling-ncu')).to_contain_text('--nvtx-include "gpu_lab_multiply/"')
            expect(page.get_by_role('link', name='Perfetto trace viewer (new tab)')).to_have_attribute('target', '_blank')
            for filename in ['profile-pytorch.py', 'inspect-pytorch-trace.py']:
                link = page.locator(f'a[download][href="../examples/{filename}"]')
                with page.expect_download() as download:
                    link.click()
                assert download.value.suggested_filename == filename
                assert download.value.path().read_bytes() == (root/'examples'/filename).read_bytes()
            panel = page.locator('#profiling-capture')
            list_ = panel.locator('xpath=following-sibling::*[1]')
            expect(list_).to_have_class('code-explanations')
            button = list_.get_by_role('button').last
            button.focus()
            expect(panel.locator('.is-code-highlighted')).to_contain_text('prof.export_chrome_trace')
            expect(page.locator('.lesson-nav a[aria-current="page"]')).to_have_attribute('href', 'profiling.html')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.locator('#capture').screenshot(path=str(root/f'test-results/profiling-{width}-{theme}.png'))
            context.close()
    context = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 1000})
    page = context.new_page()
    page.goto(url + 'lessons/profiling.html')
    expect(page.locator('#profiling-capture')).to_be_visible()
    expect(page.locator('.code-explanations').first).to_be_visible()
    expect(page.locator('#timeline')).to_contain_text('gpu_lab_multiply')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    context.close()
    print('PASS: profiling guide downloads, source explanations, navigation, no-JavaScript reading, both themes and three viewport widths')
