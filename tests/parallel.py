# Copyright © 2026 Christopher Snow.
"""Part II interactions, saved state and responsive review evidence."""
import json
from playwright.sync_api import expect

def check_parallel(browser,url,root,errors):
    chapters=json.loads(__import__('subprocess').check_output(['node','--input-type=module','-e',"import {parallelChapters} from './src/parallel-chapters.mjs'; console.log(JSON.stringify(parallelChapters))"],cwd=root,text=True))
    for chapter in chapters:
        for width in [390,820,1440]:
            for theme in ['light','dark']:
                ctx=browser.new_context(viewport={'width':width,'height':950},color_scheme=theme,service_workers='block')
                page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto(url+'lessons/'+chapter['slug']+'.html')
                expect(page.locator('h1')).to_have_text(chapter['title'])
                for ex in page.locator('[data-parallel]').all():
                    expect(ex.locator('[data-result]')).to_be_hidden()
                    ex.locator('[data-run]').click()
                    expect(ex.locator('[data-result]')).to_be_visible()
                    if ex.locator('[data-next]').is_enabled():
                        ex.locator('[data-next]').click()
                        expect(ex.locator('[data-position]')).to_contain_text('Step 2')
                    for control in ex.locator('select').all():
                        control.select_option(index=1)
                        expect(ex.locator('[data-result]')).to_be_hidden()
                        ex.locator('[data-run]').click()
                        expect(ex.locator('[data-result]')).to_be_visible()
                    # Update/reading snapshots must retain both settings and revealed state.
                    page.evaluate("import(new URL('./experiment-state.mjs',document.querySelector('script[src*=\"/parallel.mjs\"]').src).href).then(m=>m.saveReadingState())")
                    before=ex.locator('[data-result]').inner_text();exid=ex.get_attribute('id')
                    page.reload();ex=page.locator('#'+exid)
                    expect(ex.locator('[data-result]')).to_have_text(before,use_inner_text=True)
                    if chapter['slug']=='compaction':
                        for predicate,count,output in [('all',8,'[0, 1, 2, 3, 4, 5, 6, 7]'),('none',0,'(empty)')]:
                            ex.locator('[data-setting=predicate]').select_option(predicate)
                            expect(ex.locator('[data-result]')).to_be_hidden()
                            ex.locator('[data-run]').click()
                            expect(ex.locator('[data-result]')).to_contain_text(f'{count} survivors; {count} output writes')
                            while ex.locator('[data-next]').is_enabled():
                                ex.locator('[data-next]').click()
                            expect(ex.locator('[data-result]')).to_contain_text('Output so far: '+output)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(chapter['slug'],width,theme)
                page.screenshot(path=str(root/f"test-results/{chapter['slug']}-{width}-{theme}.png"),full_page=True)
                page.get_by_role('checkbox',name='Mark lesson as done').check()
                page.reload();expect(page.get_by_role('checkbox',name='Mark lesson as done')).to_be_checked()
                ctx.close()
        ctx=browser.new_context(java_script_enabled=False);page=ctx.new_page()
        page.goto(url+'lessons/'+chapter['slug']+'.html')
        expect(page.locator('[data-result]').first).to_be_hidden()
        assert 'Compare your answer' in page.locator('main').inner_text()
        ctx.close()
    print('PASS: parallel patterns, responsive themes, result invalidation, restart restoration and completion')
