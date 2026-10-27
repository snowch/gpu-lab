# Copyright © 2026 Christopher Snow.
"""Native disclosures, new-tab references and independent lookup progression."""
from playwright.sync_api import expect
import re

def check_reference_practice(browser,url,root):
    for width,theme in [(360,'light'),(360,'dark'),(1440,'light'),(1440,'dark')]:
        context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
        # Test navigation behaviour without depending on external sites in CI.
        context.route('https://docs.pytorch.org/**',lambda route:route.fulfill(content_type='text/html',body='<h1>Official documentation</h1>'))
        page=context.new_page();page.goto(url+'lessons/hello.html')
        expect(page.locator('.reference-task')).to_have_count(3)
        task=page.locator('aside[aria-labelledby="reference-hello-pytorch"]')
        expect(task.locator('.reference-code')).to_contain_text('device="cuda"')
        expect(task).to_contain_text('does not specify dtype')
        expect(task.get_by_role('heading')).to_have_text('Look it up: Where does this tensor live?')
        expect(task.locator('svg')).to_have_attribute('aria-hidden','true')
        expect(task.locator('details')).not_to_have_attribute('open','')
        task.locator('summary').focus();page.keyboard.press('Enter')
        expect(task.locator('details')).to_have_attribute('open','')
        expect(task).to_contain_text('torch.float32')
        page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
        with page.expect_popup() as popup:
            task.locator('a[target="_blank"]').first.click()
        expect(popup.value.get_by_role('heading')).to_have_text('Official documentation')
        popup.value.close()
        expect(page.locator('#hello-output-0')).to_have_text('Output: [3, 6, 9, 12, 15]')
        context.set_offline(True)
        expect(task).to_contain_text('torch.float32')
        task.screenshot(path=str(root/f'test-results/reference-{width}-{theme}.png'))
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        context.set_offline(False)
        for slug in ['devices','reading','layout','requests','memory','kernel','scheduling','divergence','shared-memory','reduction','matmul','tensor-cores','attention','inference','meet-gpu','desktop']:
            page.goto(url+'lessons/'+slug+'.html')
            expect(page.locator('.reference-task')).to_have_count(2)
            expect(page.locator('.chapter-references h2')).to_have_text('References')
            expect(page.locator('.documentation-exercises h2')).to_have_text('Use the documentation')
            assert page.locator('.chapter-references').evaluate("el=>Boolean(el.compareDocumentPosition(document.querySelector('.documentation-exercises')) & Node.DOCUMENT_POSITION_FOLLOWING)")
            task=page.locator('.reference-task').first
            if slug in ['reduction','matmul','tensor-cores','attention','inference']:
                task=page.locator('.reference-task').filter(has=page.get_by_role('heading',name=re.compile('Find it in the guide'))).first
                expect(task.get_by_role('heading')).to_contain_text('Find it in the guide')
                expect(task.locator('details')).not_to_have_attribute('open','')
                task.locator('summary').click()
                expect(task.get_by_role('link',name='Open the relevant section')).to_be_visible()
            for item in page.locator('.reference-task').all():
                item.locator('summary').focus()
                if item.locator('details').get_attribute('open') is None: page.keyboard.press('Enter')
                expect(item.locator('details p').first).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),slug
        context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page()
    for slug in ['hello','devices','reading','layout','requests','memory','kernel','scheduling','divergence','shared-memory','reduction','matmul','tensor-cores','attention','inference','meet-gpu','desktop']:
        page.goto(url+'lessons/'+slug+'.html')
        expect(page.locator('.chapter-references')).to_be_visible()
        for task in page.locator('.reference-task').all():
            task.locator('summary').click()
            expect(task.locator('details p').first).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),slug
    context.close()
    print('PASS: reference tasks across all lessons, guided/independent lookup, native keyboard/no-JavaScript disclosures, new tab preserving work, offline text and both themes')
