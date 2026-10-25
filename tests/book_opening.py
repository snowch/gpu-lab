# Copyright © 2026 Christopher Snow.
"""Value flow, independent controls, accessible navigation and restart restoration."""
from playwright.sync_api import expect
from version_check import mock_version

def check_book_opening(browser,url,root,errors):
    check_chapter_styles(browser,url,root)
    for width,theme in [(360,'light'),(393,'dark'),(820,'light'),(1440,'dark')]:
        context=browser.new_context(viewport={'width':width,'height':900},color_scheme=theme,service_workers='block',has_touch=width<500)
        mock_version(context)
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(url+'lessons/hello.html')
        page.get_by_role('link',name='Chapter 2: Where do the numbers live? →',exact=True).click()
        expect(page.locator('h1')).to_have_text('Where do the numbers live?')
        expect(page.locator('[data-book-experiment]')).to_have_count(3)
        expect(page.locator('#device-run-0')).to_be_enabled()
        page.locator('#device-run-0').evaluate("el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-400,behavior:'instant'})")
        page.locator('#device-run-0').focus();page.keyboard.press('Enter')
        expect(page.locator('#device-feedback-0')).to_be_in_viewport(ratio=1)
        expect(page.locator('#device-feedback-0')).to_contain_text('20 bytes copied')
        expect(page.locator('#device-map-0 .device-buffer')).to_have_count(2)
        page.locator('#device-count-0').select_option('8');page.locator('#device-run-0').click()
        expect(page.locator('#device-feedback-0')).to_contain_text('32 bytes copied')
        expect(page.locator('#device-setup-0')).to_contain_text('8.0')
        page.locator('#device-factor-1').fill('3');page.locator('#device-run-1').click()
        expect(page.locator('#device-feedback-1')).to_contain_text('0 bytes copied')
        expect(page.locator('#device-feedback-1')).to_contain_text('[3, 6, 9, 12, 15]')
        expect(page.locator('#device-map-1 .device-memory').first).to_contain_text('x_cpu')
        expect(page.locator('#device-factor-2')).to_have_value('2')
        page.locator('#device-run-2').click()
        expect(page.locator('#device-feedback-2')).to_contain_text('[2, 4, 6, 8, 10]')
        page.locator('#device-factor-2').fill('')
        expect(page.locator('#device-feedback-2')).to_contain_text('Enter a multiplier')
        page.locator('#device-factor-2').fill('4');page.locator('#device-run-2').click()
        expect(page.locator('#device-feedback-2')).to_contain_text('[4, 8, 12, 16, 20]')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#device-1').screenshot(path=str(root/f'test-results/book-devices-{width}-{theme}.png'),style='.topbar {position:static!important}')
        page.get_by_role('link',name='Chapter 3: How do threads read a tensor? →',exact=True).click()
        expect(page.locator('[data-book-experiment]')).to_have_count(4)
        run=page.locator('#reading-run-row')
        expect(run).to_be_enabled()
        run.evaluate("el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-400,behavior:'instant'})")
        before=page.evaluate('scrollY')
        if width<500:run.tap()
        else:run.click()
        expect(page.locator('#reading-feedback-row')).to_be_in_viewport(ratio=1)
        assert abs(page.evaluate('scrollY')-before)<5,'Run moved the page'
        gap=page.locator('#reading-feedback-row').bounding_box()['y']-(run.bounding_box()['y']+run.bounding_box()['height'])
        assert 0<=gap<=32,'Run result is separated from its button'
        page.screenshot(path=str(root/f'test-results/run-result-{width}-{theme}.png'))
        expect(page.locator('#reading-feedback-row')).to_contain_text('[2, 4, 6, 8, 10]')
        page.locator('#reading-factor-row').fill('3')
        expect(page.locator('#reading-feedback-row')).to_have_text('Run to inspect the output.')
        page.locator('#reading-factor-row').fill('2')
        page.locator('#reading-index-row').select_option('1');page.locator('#reading-run-row').click()
        expect(page.locator('#reading-feedback-row')).to_contain_text('[12, 14, 16, 18, 20]')
        page.locator('#reading-run-column').click()
        expect(page.locator('#reading-feedback-column')).to_contain_text('[2, 12, 22, 32, 42]')
        page.locator('#reading-run-packed').click()
        expect(page.locator('#reading-feedback-packed')).to_contain_text('[2, 12, 22, 32, 42]')
        expect(page.locator('#reading-map-packed')).to_contain_text('new positions [0, 1, 2, 3, 4]')
        page.locator('#reading-pattern-sectors').select_option('column')
        page.locator('#reading-guess-sectors').fill('1')
        page.locator('#reading-run-sectors').scroll_into_view_if_needed();before=page.evaluate('scrollY')
        page.locator('#reading-run-sectors').click()
        expect(page.locator('#reading-feedback-sectors')).to_contain_text('3 sectors for 20 useful bytes')
        expect(page.locator('#reading-feedback-sectors')).to_contain_text('You predicted 1')
        assert abs(page.evaluate('scrollY')-before)<35,'Run moved the page'
        expect(page.locator('#reading-map-sectors .book-sectors>div')).to_have_count(3)
        page.locator('#reading-pattern-sectors').select_option('packed')
        expect(page.locator('#reading-map-sectors .book-sectors>div')).to_have_count(0)
        page.locator('#reading-run-sectors').click()
        expect(page.locator('#reading-feedback-sectors')).to_contain_text('1 sector for 20 useful bytes')
        expect(page.locator('#reading-feedback-row')).to_contain_text('[12, 14, 16, 18, 20]')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('#reading-packed').screenshot(path=str(root/f'test-results/book-reading-{width}-{theme}.png'),style='.topbar {position:static!important}')
        # Companion is available beneath the Pages base path.
        response=context.request.get(url+'examples/book-opening.py')
        assert response.ok and 'transposed.stride()' in response.text()
        context.close()
    context=browser.new_context(java_script_enabled=False,viewport={'width':360,'height':800})
    page=context.new_page()
    for slug,count in [('devices',3),('reading',4)]:
        page.goto(url+'lessons/'+slug+'.html')
        expect(page.locator('[data-book-experiment]')).to_have_count(count)
        expect(page.locator('.sidebar nav')).to_be_visible()
        expect(page.locator('noscript .notice')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    context.close()
    print('PASS: book opening, device copies, equal-work layouts, independent results, keyboard, phone/tablet/desktop and static fallback')


def check_chapter_styles(browser,url,root):
    for width,theme in [(393,'light'),(393,'dark'),(820,'light'),(820,'dark'),(1440,'light'),(1440,'dark')]:
        context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
        page=context.new_page();baseline=None
        for slug in ['hello','devices','reading']:
            page.goto(url+'lessons/'+slug+'.html')
            expect(page.locator('.brand-note')).to_have_text('/ interactive book')
            expect(page.locator('.intro .book-note')).to_have_count(0)
            expect(page.locator('.chapter-browser-note')).to_have_count(1)
            expect(page.locator('.chapter-browser-note')).to_contain_text('no installation or GPU required')
            styles=page.evaluate("""() => Object.fromEntries([
              ['code','.chapter-opening-code'],['notice','.chapter-browser-note'],
              ['section','.hello-section, .book-section'],['heading','.hello-section h2, .book-section h2']
            ].map(([key,selector])=>{const s=getComputedStyle(document.querySelector(selector));return [key,Object.fromEntries(['fontSize','lineHeight','color','backgroundColor','paddingTop','paddingBottom','marginTop','marginBottom','borderLeftWidth','borderLeftColor'].map(p=>[p,s[p]]))]}))""")
            if baseline is None:baseline=styles
            else:assert styles==baseline,(width,theme,slug,styles,baseline)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.locator('.hello-start, .book-start').screenshot(path=str(root/f'test-results/chapter-style-{slug}-{width}-{theme}.png'),style='.topbar{position:static!important}')
        context.close()
    print('PASS: shared opening code, guidance, section spacing and typography across chapters 1–3, phone/tablet/desktop and both themes')
