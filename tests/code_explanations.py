# Copyright © 2026 Christopher Snow.
"""Walkthroughs follow current source and do not affect experiments or downloads."""
from playwright.sync_api import expect
from version_check import mock_version

CHAPTERS=['hello','devices','reading','layout','requests','scheduling','divergence','reduction','matmul','tensor-cores','attention','inference','putting-it-together']

def check_code_explanations(browser,url,root):
    for width,theme in [(360,'light'),(360,'dark'),(820,'light'),(820,'dark'),(1440,'light'),(1440,'dark')]:
        context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
        mock_version(context)
        page=context.new_page()
        slugs=CHAPTERS+['memory','kernel','shared-memory'] if (width,theme)==(820,'light') else ['hello','matmul','inference']
        for slug in slugs:
            page.goto(url+'lessons/'+slug+'.html')
            pre=page.locator('pre[data-explained-code]').first
            expect(pre).to_be_visible()
            listing=pre.locator('xpath=following-sibling::*[1]')
            expect(listing).to_have_class('code-explanations')
            source=pre.text_content()
            for button in listing.locator('button').all():
                fragment=button.get_attribute('data-code-fragment')
                assert fragment in source,(slug,fragment)
                button.scroll_into_view_if_needed()
                before=page.evaluate('scrollY')
                button.click()
                expect(button).to_have_attribute('aria-pressed','true')
                assert abs(page.evaluate('scrollY')-before)<3,'Explanation selection moved the page'
                assert pre.locator('.is-code-highlighted').count()>0
                assert pre.text_content()==source,'Highlight changed copyable source'
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(slug,width,theme)
            if slug in ['hello','matmul','inference']:
                listing.screenshot(path=str(root/f'test-results/explanations-{slug}-{width}-{theme}.png'))
        # Changing the multiplier refreshes CUDA text and annotations, without changing prediction state.
        page.goto(url+'lessons/hello.html')
        page.locator('#hello-factor-4').fill('3')
        pre=page.locator('#hello-full-4')
        expect(pre).to_contain_text('3.0f')
        listing=pre.locator('xpath=following-sibling::*[1]')
        expect(listing).to_contain_text('3.0f')
        expect(listing).not_to_contain_text('2.0f')
        expect(page.locator('#hello-map-4 .hello-thread>strong:last-child')).to_have_text(['?']*8)
        button=listing.locator('button').first
        button.focus();page.keyboard.press('Enter')
        expect(button).to_have_attribute('aria-pressed','true')
        # Dynamic row/column fragments are regenerated, not left with the original index.
        page.goto(url+'lessons/reading.html')
        page.locator('#reading-index-row').select_option('2')
        pre=page.locator('#reading-code-row').locator('xpath=..')
        listing=pre.locator('xpath=following-sibling::*[1]')
        expect(listing).to_contain_text('x[2, :]')
        expect(listing).not_to_contain_text('x[0, :]')
        context.close()
    context=browser.new_context(java_script_enabled=False,viewport={'width':360,'height':900})
    page=context.new_page()
    for slug in CHAPTERS+['memory','shared-memory']:
        page.goto(url+'lessons/'+slug+'.html')
        expect(page.locator('.code-explanations').first).to_be_visible()
        assert page.locator('.code-explanations').first.locator('li').count()>=2
        expect(page.locator('.code-explanation-hint').first).to_be_hidden()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),slug
    context.close()
    print('PASS: code explanations across all chapters, current fragments, highlighting, copyable source, independent predictions, keyboard, layouts/themes and static fallback')
