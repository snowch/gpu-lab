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
                    if chapter['slug']=='scan' and ex.locator('[data-setting=kind]').count():
                        while ex.locator('[data-next]').is_enabled():ex.locator('[data-next]').click()
                        expect(ex.locator('.pattern-figure')).to_contain_text('Shift:')
                        expect(ex.locator('.pattern-figure')).to_contain_text('Output length = last offset 2 + last flag 0 = 2.')
                    if chapter['slug']=='pattern-investigation':
                        ex.locator('[data-setting=distribution]').select_option('mixed')
                        ex.locator('[data-setting=goal]').select_option('group')
                        ex.locator('[data-run]').click()
                        expect(ex.locator('[data-result]')).to_contain_text('Stable output token positions [0, 2, 5, 7, 1, 4, 3, 6]')
                        while ex.locator('[data-next]').is_enabled():ex.locator('[data-next]').click()
                        expect(ex.locator('[data-result]')).to_contain_text('Output token positions so far: [0, 2, 5, 7, 1, 4, 3, 6]')
                        ex.locator('[data-setting=goal]').select_option('counts')
                        expect(ex.locator('[data-result]')).to_be_hidden()
                        ex.locator('[data-run]').click()
                        expect(ex.locator('[data-result]')).to_contain_text('no prefix offsets or grouping; 0 scatter writes')
                        ex.locator('[data-setting=goal]').select_option('group');ex.locator('[data-run]').click()
                    if chapter['slug']=='progress':
                        while ex.locator('[data-next]').is_enabled():ex.locator('[data-next]').click()
                        if exid=='progress-forks':
                            expect(ex.locator('.pattern-figure li')).to_have_text(['A → fork 1 → owner B','B → fork 2 → owner C','C → fork 0 → owner A'])
                        else:expect(ex.locator('.pattern-figure')).to_contain_text('2 of 4 required arrivals → invalid participation')
                    if chapter['slug']=='compaction':
                        for predicate,count,output in [('all',8,'[0, 1, 2, 3, 4, 5, 6, 7]'),('none',0,'(empty)')]:
                            ex.locator('[data-setting=predicate]').select_option(predicate)
                            expect(ex.locator('[data-result]')).to_be_hidden()
                            ex.locator('[data-run]').click()
                            expect(ex.locator('[data-result]')).to_contain_text(f'{count} survivors; {count} output writes')
                            while ex.locator('[data-next]').is_enabled():
                                ex.locator('[data-next]').click()
                            if predicate=='all':expect(ex.locator('[data-output-token]')).to_have_text([str(i) for i in range(8)])
                            else:expect(ex.locator('.pattern-output')).to_contain_text('No output slots used (empty).')
                if width==390 and theme=='light':
                    first=page.locator('[data-parallel]').first
                    saved=first.locator('[data-result]').inner_text()
                    page.get_by_role('button',name='GPU map',exact=True).click()
                    frame=page.frame_locator('#gpu-map-frame')
                    frame.locator('#gpu > summary').click()
                    frame.locator('#sm-0 > summary').click()
                    frame.get_by_role('link',name='Optional appendix: Inside an SM').first.click()
                    back=page.locator('[data-reading-return]').first
                    expect(back).to_have_text(f"Return to Chapter {chapter['number']}")
                    back.click()
                    expect(page.locator('h1')).to_have_text(chapter['title'])
                    page.get_by_role('button',name='Close map',exact=True).click()
                    expect(first.locator('[data-result]')).to_have_text(saved,use_inner_text=True)
                    page.goto(url+'lessons/meet-gpu.html?from='+chapter['slug'])
                    close=page.locator('.top-actions .gpu-map-link')
                    expect(close).to_have_attribute('href',chapter['slug']+'.html')
                    close.click()
                    expect(page.locator('h1')).to_have_text(chapter['title'])
                    page.wait_for_load_state('load')
                    for returned in page.locator('[data-parallel]').all():
                        if chapter['slug']=='pattern-investigation':returned.locator('[data-setting=goal]').select_option('group')
                        returned.locator('[data-run]').click()
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(chapter['slug'],width,theme)
                page.screenshot(path=str(root/f"test-results/{chapter['slug']}-{width}-{theme}.png"),full_page=True)
                page.get_by_role('checkbox',name='Mark lesson as done').check()
                page.reload();expect(page.get_by_role('checkbox',name='Mark lesson as done')).to_be_checked()
                ctx.close()
        ctx=browser.new_context(java_script_enabled=False);page=ctx.new_page()
        page.goto(url+'lessons/'+chapter['slug']+'.html')
        expect(page.locator('[data-result]').first).to_be_hidden()
        expect(page.locator('[data-run]').first).to_be_disabled()
        expect(page.locator('noscript .notice')).to_be_visible()
        expect(page.locator('noscript .notice')).to_contain_text('Enable JavaScript to run the experiments.')
        assert 'Compare your answer' in page.locator('main').inner_text()
        ctx.close()
    print('PASS: parallel patterns, responsive themes, result invalidation, restart restoration and completion')
