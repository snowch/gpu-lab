# Copyright © 2026 Christopher Snow.
"""Desktop appendix paths and current-source downloads in the real browser."""
from playwright.sync_api import expect
from pathlib import Path

def check_desktop(browser,url,root):
    for width in [360,820,1440]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
            page=context.new_page()
            page.goto(url+'lessons/desktop.html')
            expect(page.locator('.desktop-index tbody tr')).to_have_count(13)
            for link in page.locator('main a[download]').all():
                response=context.request.get(link.evaluate('el=>el.href'))
                assert response.ok,link.get_attribute('href')
                assert len(response.body())>100
            for details in page.locator('main details').all():
                details.locator('summary').click()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(root/f'test-results/desktop-{width}-{theme}.png'),full_page=True)
            page.goto(url+'lessons/hello.html')
            button=page.locator('[data-download-python]').first
            expect(button).to_be_enabled()
            with page.expect_download() as download:
                button.click()
            source=Path(download.value.path()).read_text()
            assert 'choices=["cpu", "cuda"]' in source
            assert 'y = x * 2' in source
            expect(page.locator('[data-download-status]').first).to_contain_text('Downloaded')
            context.close()
    # The browser's download reflects the current complete snippet, including edits
    # caused by chapter controls, rather than a stale default file.
    context=browser.new_context(service_workers='block')
    page=context.new_page();page.goto(url+'lessons/divergence.html')
    experiment=page.locator('[data-book-experiment]').first
    panel=experiment.locator('.chapter-code-panel').filter(has=page.locator('[data-download-python]'))
    expect(experiment.locator('[role=status]')).to_have_text('Predict the result, then press Run.')
    experiment.locator('.continuation-code summary').click()
    before=panel.locator('code').inner_text()
    experiment.get_by_label('Input sign pattern').select_option('negative')
    expect(panel.locator('code')).to_contain_text('values = [-2.] * 32')
    source=panel.locator('code').inner_text()
    assert source != before
    with page.expect_download() as download: panel.locator('[data-download-python]').click()
    assert source in Path(download.value.path()).read_text().replace('device=_lab_device','device="cuda"')
    context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page();page.goto(url+'lessons/desktop.html')
    expect(page.locator('a[download=""]').first).to_be_visible()
    expect(page.locator('#first-cuda')).to_contain_text('PASS: verified 5')
    context.close()
    print('PASS: desktop appendix at phone/tablet/desktop sizes in both themes, complete-file links, current-source downloads and no-JavaScript access')
