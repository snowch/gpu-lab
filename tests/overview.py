# Copyright © 2026 Christopher Snow.
"""Concept-map exploration, chapter context and return without losing work."""
from playwright.sync_api import expect

def check_overview(browser,base_url,root,errors):
    for width in [1440,820,360]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
            page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(base_url+'lessons/hello.html')
            page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
            with page.expect_popup() as popup:
                page.locator('.gpu-map-link').click()
            map_page=popup.value;map_page.on('pageerror',lambda error:errors.append(str(error)))
            expect(map_page.locator('#map-chapter')).to_have_value('hello')
            expect(map_page.locator('[data-palette=pytorch]')).to_have_attribute('aria-pressed','true')
            expect(map_page.locator('.chapter-match').first).to_contain_text('In highlighted chapter')
            # Keyboard exploration remains in place; chapter links describe where to read.
            map_page.locator('[data-palette=block]').focus();map_page.keyboard.press('Enter')
            expect(map_page.locator('#map-detail h2')).to_have_text('Thread block')
            map_page.locator('#map-detail summary').click()
            expect(map_page.locator('#map-detail')).to_contain_text('Several blocks can reside on one SM')
            expect(map_page.locator('#map-detail a[href="reduction.html"]')).to_be_visible()
            # Cross-view relationship selection and reload preserve the selected concept.
            connected=map_page.locator('.map-diagram-wide [data-concept=shared]' if width>1000 else '.map-diagram-narrow [data-concept=shared]')
            connected.click()
            expect(map_page.locator('#map-detail h2')).to_have_text('Shared memory')
            expect(map_page.locator('[data-map-view=memory]')).to_have_attribute('aria-pressed','true')
            map_page.reload();expect(map_page.locator('#map-detail h2')).to_have_text('Shared memory')
            for view in ['work','memory','ai']:
                map_page.locator('[data-map-view='+view+']').click()
                assert map_page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                map_page.locator('#map-diagram').screenshot(path=str(root/f'test-results/map-{view}-{width}-{theme}.png'))
            map_page.locator('#map-chapter').select_option('attention')
            expect(map_page.locator('#map-detail h2')).to_have_text('Attention')
            expect(map_page.locator('[data-map-view=ai]')).to_have_attribute('aria-pressed','true')
            with map_page.expect_event('close'):map_page.locator('#map-return').click(no_wait_after=True)
            expect(page.locator('#hello-output-0')).to_have_text('Output: [3, 6, 9, 12, 15]')
            # Saved/bookmarked links and former overview anchors remain useful.
            page.goto(base_url+'#meet-gpu')
            expect(page.locator('#gpu-map')).to_be_visible()
            context.close()
    context=browser.new_context(java_script_enabled=False,viewport={'width':360,'height':900})
    page=context.new_page();page.goto(base_url+'lessons/meet-gpu.html')
    expect(page.locator('#gpu-map')).to_be_hidden()
    for concept in ['block','shared','attention']:
        item=page.locator('#concept-'+concept);item.locator('summary').click()
        expect(item.locator('p').first).to_be_visible()
        expect(item.locator('.map-chapter-links a').first).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    context.close()
    print('PASS: concept map views, directed relationships, chapter context, keyboard, cross-view selection, reload, return preserving work, phone/tablet/desktop, themes and static reference')
