# Copyright © 2026 Christopher Snow.
from pathlib import Path
from playwright.sync_api import expect
from version_check import mock_version


def save_and_reload(page):
    page.evaluate('''async()=>{
      const script=document.querySelector('script[src$="/src/hello.mjs"]');
      const {saveReadingState}=await import(new URL('./experiment-state.mjs',script.src).href);
      saveReadingState();
    }''')
    page.reload()
    expect(page.locator('.restore-notice')).to_have_count(0)


def grouping(page,blocks='1',position='0:4',values='same'):
    page.locator('#hello-launch-guess').select_option(blocks)
    page.locator('#hello-position-guess').select_option(position)
    page.locator('#hello-values-guess').select_option(values)
    page.locator('#hello-launch-run').click()


def hello_flow(page,url):
    page.goto(url+'lessons/hello.html')
    expect(page.locator('.hello-section')).to_have_count(5)
    expect(page.locator('.hello-start-code')).to_contain_text('device="cuda"')
    expect(page.locator('.hello-start-values')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    expect(page.locator('[id^=hello-factor-]')).to_have_count(1)
    expect(page.locator('[id^=hello-run-]')).to_have_count(2)
    for stage in [0,1]:
        expect(page.locator(f'#hello-map-{stage} .hello-thread strong:last-child')).to_have_text(['?']*5)
        page.locator(f'#hello-run-{stage}').click()
    expect(page.locator('#hello-output-0')).to_contain_text('[3.0, 6.0, 9.0, 12.0, 15.0]')
    page.locator('#hello-factor-0').fill('4')
    expect(page.locator('#hello-map-0 .hello-thread strong:last-child')).to_have_text(['?']*5)
    expect(page.locator('#hello-output-1')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    page.locator('#hello-factor-0').fill('')
    page.locator('#hello-run-0').click()
    expect(page.locator('#hello-output-0')).to_contain_text('Enter a multiplier')
    page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
    page.locator('#hello-map-1 [data-thread="4"]').focus();page.keyboard.press('Enter')
    expect(page.locator('#hello-index-1')).to_contain_text('input at index 4')
    for stage in [2,4]:
        expect(page.locator(f'#hello-output-{stage}')).to_contain_text('Worked output:')
        card=page.locator(f'#hello-map-{stage} [data-thread="5"]')
        card.scroll_into_view_if_needed();before=page.evaluate('scrollY');card.click()
        assert abs(page.evaluate('scrollY')-before)<30
        expect(card).to_contain_text('No calculation')
        expect(card).to_contain_text('Skipped')
    expect(page.locator('#hello-cuda-trace')).to_contain_text('No calculation · no output written')
    page.locator('#hello-map-4 [data-thread="4"]').click()
    expect(page.locator('#hello-cuda-trace')).to_contain_text('i = 1 × 4 + 0 = 4')
    expect(page.locator('#hello-cuda-trace')).to_contain_text('Input 5.0 → output 10.0')
    page.locator('#hello-bridge-complete-2 summary').click()
    with page.expect_download() as download:page.locator('#hello-bridge-download-2').click()
    assert 'input[i] * 2.0f' in Path(download.value.path()).read_text()
    page.locator('#hello-bridge-complete-2 summary').click()

    # Regrouping: require all predictions; wrong answers still get useful feedback.
    expect(page.locator('#hello-launch-answer')).to_be_hidden()
    page.locator('#hello-launch-run').click()
    expect(page.locator('#hello-launch-guess')).to_be_focused()
    grouping(page,'2','1:0','different')
    expect(page.locator('#hello-launch-feedback')).to_contain_text('Compare your predictions')
    expect(page.locator('#hello-launch-map .hello-group')).to_have_count(1)
    expect(page.locator('#hello-launch-index')).to_contain_text('block 0 × 8 + position 4 = index 4')
    expect(page.locator('#hello-launch-output')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    grouping(page)
    expect(page.locator('#hello-launch-feedback')).to_contain_text('All three predictions match')
    page.locator('#hello-launch-map [data-thread="6"]').click()
    expect(page.locator('#hello-launch-index')).to_contain_text('skips the calculation')
    with page.expect_download() as download:page.locator('#hello-launch-download').click()
    assert 'runKernel<<<(n + 8 - 1) / 8, 8>>>' in Path(download.value.path()).read_text()
    page.locator('#hello-launch-size').select_option('4')
    expect(page.locator('#hello-launch-answer')).to_be_hidden()
    expect(page.locator('#hello-position-guess')).to_have_value('')
    grouping(page,'2','1:0')
    expect(page.locator('#hello-launch-map .hello-group')).to_have_count(2)
    expect(page.locator('#hello-launch-feedback')).to_contain_text('All three predictions match')

    # <= admits exactly thread 5, not all surplus threads; correction changes the visual.
    expect(page.locator('#hello-bounds-answer')).to_be_hidden()
    page.locator('#hello-bounds-check').click()
    expect(page.locator('#hello-bounds-guess')).to_be_focused()
    for guess in ['4','6','none','5']:
        page.locator('#hello-bounds-guess').select_option(guess)
        expect(page.locator('#hello-bounds-answer')).to_be_hidden()
        page.locator('#hello-bounds-check').click()
        expect(page.locator('#hello-map-3 [data-state=invalid]')).to_have_count(1)
        expect(page.locator('#hello-map-3 [data-thread="5"]')).to_contain_text('Invalid access')
        expect(page.locator('#hello-map-3 [data-state=skip]')).to_have_count(2)
    expect(page.locator('#hello-bounds-feedback')).to_contain_text('Correct.')
    page.locator('#hello-map-3 [data-thread="6"]').click()
    expect(page.locator('#hello-bounds-index')).to_contain_text('skips both array accesses')
    page.locator('#hello-bounds-fix').click()
    expect(page.locator('#hello-map-3 [data-state=invalid]')).to_have_count(0)
    expect(page.locator('#hello-map-3 [data-state=skip]')).to_have_count(3)
    expect(page.locator('#hello-diagnostic-code')).to_contain_text('if (i < n)')

    # Coverage is distinct from bounds safety; extra safe blocks are not minimal.
    expect(page.locator('#hello-transfer-diagram')).to_be_hidden()
    page.locator('#hello-transfer-run').click()
    expect(page.locator('#hello-coverage-guess')).to_be_focused()
    page.locator('#hello-coverage-guess').select_option('all')
    page.locator('#hello-skip-guess').select_option('8')
    page.locator('#hello-repair-blocks').select_option('2')
    page.locator('#hello-transfer-run').click()
    expect(page.locator('#hello-transfer-diagram .hello-transfer-cell').nth(8)).to_contain_text('Unwritten')
    expect(page.locator('#hello-transfer-result')).to_contain_text('cannot supply missing threads')
    page.locator('#hello-repair-blocks').select_option('4')
    expect(page.locator('#hello-transfer-diagram')).to_be_hidden()
    page.locator('#hello-transfer-run').click()
    expect(page.locator('#hello-transfer-result')).to_contain_text('safe, but three blocks are sufficient')
    page.locator('#hello-coverage-guess').select_option('missing')
    page.locator('#hello-skip-guess').select_option('9')
    page.locator('#hello-repair-blocks').select_option('3')
    page.locator('#hello-transfer-run').click()
    expect(page.locator('#hello-transfer-result')).to_contain_text('All three predictions match')
    expect(page.locator('#hello-transfer-diagram')).to_contain_text('9, 10, 11')
    expect(page.locator('#hello-transfer-diagram .hello-transfer-cell strong')).to_have_text(['2.0','4.0','6.0','8.0','10.0','12.0','14.0','16.0','18.0'])
    save_and_reload(page)
    expect(page.locator('#hello-launch-feedback')).to_contain_text('All three predictions match')
    expect(page.locator('#hello-map-3 [data-state=skip]')).to_have_count(3)
    expect(page.locator('#hello-diagnostic-code')).to_contain_text('if (i < n)')
    expect(page.locator('#hello-transfer-result')).to_contain_text('All three predictions match')
    expect(page.locator('#hello-output-0')).to_contain_text('[3.0, 6.0, 9.0, 12.0, 15.0]')
    # Unchecked predictions stay unchecked on a restart, including changed guard state.
    page.locator('#hello-bounds-guess').select_option('none')
    page.locator('#hello-position-guess').select_option('0:4')
    page.locator('#hello-repair-blocks').select_option('2')
    save_and_reload(page)
    for panel in ['hello-bounds-answer','hello-launch-answer','hello-transfer-diagram']:
        expect(page.locator('#'+panel)).to_be_hidden()
    expect(page.locator('#hello-bounds-guess')).to_have_value('none')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')


def check_old_hello_snapshot(browser,url):
    context=browser.new_context(service_workers='block');page=context.new_page()
    page.goto(url+'lessons/hello.html')
    page.evaluate('''()=>{
      sessionStorage.setItem('gpu-lab:restart:'+location.pathname+location.search,JSON.stringify({schema:1,
        controls:[{id:'hello-factor-0',value:'4'},{id:'hello-factor-1',value:'7'},
          {id:'hello-factor-2',value:'3'},{id:'hello-factor-3',value:'3'},{id:'hello-factor-4',value:'3'},
          {id:'hello-guard-3',checked:false},{id:'hello-transfer-count',value:'8'},
          {id:'hello-launch-size',value:'8'},{id:'hello-launch-guess',value:'1'}],
        experiments:{'hello-0':{selected:0,ran:true},'hello-1':{selected:2,ran:true},
          'hello-2':{selected:4,ran:true},'hello-3':{ran:true},'hello-4':{selected:5,ran:true},
          'hello-transfer':{revealed:true},'hello-launch':{revealed:true,selected:6}},
        details:[true,true,true,true],messages:{'hello-launch-feedback':'Correct. Old answer'},scroll:[0,0]}));
    }''')
    page.reload()
    expect(page.locator('.restore-notice')).to_have_count(0)
    expect(page.locator('#hello-factor-0')).to_have_value('4')
    expect(page.locator('#hello-output-0')).to_contain_text('[4.0, 8.0, 12.0, 16.0, 20.0]')
    expect(page.locator('#hello-map-1 [data-thread="2"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('#hello-map-1 .hello-thread strong:last-child')).to_have_text(['?']*5)
    expect(page.locator('#hello-output-2')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    for panel in ['hello-bounds-answer','hello-launch-answer','hello-transfer-diagram']:
        expect(page.locator('#'+panel)).to_be_hidden()
    expect(page.locator('main details[open]')).to_have_count(0)
    context.close()


def check_hello(browser,url,root,errors):
    for width in [360,820,1440]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':900},color_scheme=theme)
            mock_version(context)
            page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            hello_flow(page,url)
            for i in [1,2,3,4,5]:
                page.locator(f'#idea-{i}').screenshot(path=str(root/f'test-results/hello-idea-{i}-{width}-{theme}.png'),style='.topbar {position:static!important}')
            context.close()
    check_old_hello_snapshot(browser,url)
    context=browser.new_context(java_script_enabled=False);page=context.new_page()
    page.goto(url+'lessons/hello.html')
    expect(page.locator('.hello-section')).to_have_count(5)
    expect(page.locator('#hello-map-2 .hello-thread')).to_have_count(8)
    expect(page.locator('#hello-output-4')).to_contain_text('Worked output:')
    expect(page.locator('#hello-full-4')).to_contain_text('__global__')
    expect(page.locator('#hello-map-2 [data-thread="5"]')).to_contain_text('No calculation')
    expect(page.locator('#hello-bounds-check')).to_be_disabled()
    page.locator('#idea-4 details').filter(has=page.get_by_text('Compare a worked explanation',exact=True)).locator('summary').click()
    expect(page.locator('#idea-4')).to_contain_text('Threads 6 and 7 still fail')
    page.locator('.hello-section-end details').last.locator('summary').click()
    expect(page.locator('.hello-section-end details').last).to_contain_text('indices 0–8 write results')
    context.close()
    print('PASS: guided inspection, three reasoning challenges, feedback, downloads, keyboard, snapshots and no-JS comparisons')
