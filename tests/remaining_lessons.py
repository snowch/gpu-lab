# Copyright © 2026 Christopher Snow.
"""Progressive chapters replacing the legacy dashboards."""
from playwright.sync_api import expect
from version_check import mock_version

SLUGS=['scheduling','divergence','reduction','matmul','tensor-cores','attention','inference','putting-it-together']

def check_remaining(browser,base_url,root,errors):
    for width,theme in [(360,'light'),(360,'dark'),(820,'light'),(820,'dark'),(1440,'light'),(1440,'dark')]:
        context=browser.new_context(viewport={'width':width,'height':950},color_scheme=theme,service_workers='block')
        mock_version(context)
        page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        for number,slug in enumerate(SLUGS,6):
            page.goto(base_url+'lessons/'+slug+'.html')
            expect(page.locator('.intro .eyebrow')).to_have_text(f'CHAPTER {number}')
            expect(page.locator('html')).to_have_attribute('data-theme',theme)
            expect(page.locator('.chapter-opening-code').first).to_contain_text('import torch')
            expect(page.locator('.chapter-browser-note')).to_contain_text('no installation or GPU required')
            experiments=page.locator('[data-book-experiment]')
            assert experiments.count()>=2
            first_result=None
            for i,experiment in enumerate(experiments.all()):
                expect(experiment.locator('[data-results]')).to_be_hidden()
                run=experiment.locator('[data-run]')
                run.evaluate("el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-350,behavior:'instant'})")
                before=page.evaluate('scrollY');run.focus();run.press('Enter')
                expect(experiment.locator('[role=status]')).to_contain_text('Run complete')
                expect(experiment.locator('[role=status]')).to_be_in_viewport()
                assert abs(page.evaluate('scrollY')-before)<10,slug+' Run scroll jump'
                expect(experiment.locator('[data-results]')).to_be_visible()
                output=experiment.locator('[data-visual-output]').inner_text()
                if experiment.locator('[data-next]').is_enabled():
                    experiment.locator('[data-next]').focus();experiment.locator('[data-next]').press('Enter')
                    assert experiment.locator('[data-visual-output]').inner_text()!=output,slug+' trace did not change'
                    experiment.locator('[data-back]').click()
                    expect(experiment.locator('[data-visual-output]')).to_have_text(output,use_inner_text=True)
                for control in experiment.locator('select').all():
                    options=control.locator('option').evaluate_all('(els)=>els.map(el=>el.value)')
                    control.select_option(next(value for value in options if value!=control.input_value()))
                    expect(experiment.locator('[data-results]')).to_be_hidden()
                    expect(experiment.locator('[role=status]')).to_contain_text('Settings changed')
                    run.click();expect(experiment.locator('[data-results]')).to_be_visible()
                if i==0:first_result=experiment.locator('[data-visual-output]').inner_text()
                else:expect(experiments.first.locator('[data-visual-output]')).to_have_text(first_result,use_inner_text=True)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),slug+' overflow'
            experiments.first.screenshot(path=str(root/f'test-results/continuation-{slug}-{width}-{theme}.png'),style='.topbar {position:static!important}')
            page.locator('.continuation-transfer summary').click()
            expect(page.locator('.continuation-transfer details div')).to_be_visible()
            expect(page.locator('.chapter-references')).to_be_visible()
            expect(page.locator('.documentation-exercises .reference-task')).to_have_count(2)
            page.locator('.book-pager a').last.click();expect(page.locator('h1')).to_be_visible()
        context.close()
    context=browser.new_context(java_script_enabled=False,viewport={'width':360,'height':900});page=context.new_page()
    for slug in SLUGS:
        page.goto(base_url+'lessons/'+slug+'.html')
        for experiment in page.locator('[data-book-experiment]').all():
            expect(experiment.locator('[data-results]')).to_be_hidden()
            expect(experiment.locator('[data-run]')).to_be_disabled()
            experiment.locator('noscript > details > summary').click()
            expect(experiment.locator('noscript > details')).to_have_attribute('open','')
            assert len(experiment.locator('noscript > details').inner_text())>80
        expect(page.locator('.chapter-definition').first).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    context.close()
    print('PASS: chapters 6–13, independent runs, invalidation, keyboard stepping, mobile/tablet/desktop, themes and static examples')
