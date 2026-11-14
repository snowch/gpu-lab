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
    outline=page.get_by_role('navigation',name='In this chapter')
    expect(outline.locator('a')).to_have_count(5)
    for link in outline.locator('a').all():
        expect(link).to_be_visible()
        expect(page.locator(link.get_attribute('href'))).to_have_count(1)
    expect(page.locator('.hello-start-code')).to_contain_text('device="cuda"')
    expect(page.locator('[id^=hello-factor-]')).to_have_count(1)
    expect(page.locator('[id^=hello-run-]')).to_have_count(1)
    expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['?']*5)
    page.locator('#hello-run-0').click()
    expect(page.locator('#hello-output-0')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    page.locator('#hello-factor-0').fill('4')
    expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['?']*5)
    page.locator('#hello-factor-0').fill('')
    page.locator('#hello-run-0').click()
    expect(page.locator('#hello-output-0')).to_contain_text('Enter a multiplier')
    page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
    row=page.locator('#hello-map-0 [data-thread="4"]')
    row.focus();page.keyboard.press('Enter')
    expect(row).to_be_focused()
    expect(page.locator('#hello-index-0')).to_contain_text('x[4] = 5.0')
    expect(page.locator('#hello-index-0')).to_contain_text('y[4] = 15.0')
    expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['3.0','6.0','9.0','12.0','15.0'])
    expect(page.locator('#hello-full-4')).to_be_visible()
    with page.expect_download() as download:page.locator('#hello-bridge-download-2').click()
    assert 'input[i] * 2.0f' in Path(download.value.path()).read_text()

    # The compact grouping preserves keyboard focus and a stable scroll position.
    expect(page.locator('#hello-index-rule-title')).to_have_text('Array index rule')
    for i in [0,2,4,5,7]:
        card=page.locator(f'#hello-map-2 [data-thread="{i}"]')
        card.scroll_into_view_if_needed();before=page.evaluate('scrollY');card.focus();page.keyboard.press('Enter')
        expect(card).to_be_focused()
        assert abs(page.evaluate('scrollY')-before)<30
        panel=page.locator('#hello-index-2')
        expect(panel.locator('.hello-index-equation')).to_have_text(f'index = {i//4} × 4 + {i%4} = {i}')
        if i<5:expect(panel).to_contain_text(f'input[{i}] = {i+1}.0')
        else:expect(panel).to_contain_text('skips the calculation')
    # Four tiles remain in each block on phones: no long two-column card stack.
    assert page.locator('#hello-map-2 .hello-group').first.evaluate('(el)=>el.getBoundingClientRect().height')<180
    assert page.locator('#hello-map-0').evaluate('(el)=>el.getBoundingClientRect().height')<450

    # Regrouping: require all predictions; wrong answers still get useful feedback.
    expect(page.locator('#hello-launch-answer')).to_be_hidden()
    page.locator('#hello-launch-run').click()
    expect(page.locator('#hello-launch-guess')).to_be_focused()
    grouping(page,'2','1:0','different')
    expect(page.locator('#hello-launch-feedback')).to_contain_text('Compare your predictions')
    expect(page.locator('#hello-launch-answer')).to_contain_text('Index = 0 × 8 + 4 = 4')
    expect(page.locator('#hello-launch-answer')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    expect(page.locator('#hello-launch-example, #hello-launch-map, #hello-launch-download')).to_have_count(0)
    grouping(page)
    expect(page.locator('#hello-launch-feedback')).to_contain_text('All three predictions match')
    page.locator('#hello-launch-size').select_option('4')
    expect(page.locator('#hello-launch-answer')).to_be_hidden()
    expect(page.locator('#hello-position-guess')).to_have_value('')
    grouping(page,'2','1:0')
    expect(page.locator('#hello-launch-answer')).to_contain_text('Index = 1 × 4 + 0 = 4')
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
    expect(page.locator('#hello-map-0 [data-thread="2"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['4.0','8.0','12.0','16.0','20.0'])
    expect(page.locator('#hello-index-2')).to_contain_text('input[4] = 5.0')
    for panel in ['hello-bounds-answer','hello-launch-answer','hello-transfer-diagram']:
        expect(page.locator('#'+panel)).to_be_hidden()
    expect(page.locator('main details[open]')).to_have_count(0)
    context.close()


def check_recent_hello_snapshot(browser,url):
    # The deployed version had two independent demos. Preserve the multiplier and
    # old thread selection while keeping its three checked challenges intact.
    context=browser.new_context(service_workers='block');page=context.new_page()
    page.goto(url+'lessons/hello.html')
    page.evaluate('''()=>{
      sessionStorage.setItem('gpu-lab:restart:'+location.pathname+location.search,JSON.stringify({schema:1,
        controls:[{id:'hello-factor-0',value:'3'},{id:'hello-launch-size',value:'8'},
          {id:'hello-launch-guess',value:'1'},{id:'hello-position-guess',value:'0:4'},
          {id:'hello-values-guess',value:'same'},{id:'hello-bounds-guess',value:'5'},
          {id:'hello-coverage-guess',value:'missing'},{id:'hello-repair-blocks',value:'3'},
          {id:'hello-skip-guess',value:'9'}],
        experiments:{'hello-0':{version:2,selected:0,ran:false},'hello-1':{version:2,selected:4,ran:true},
          'hello-2':{version:2,selected:7,ran:true},'hello-3':{},'hello-4':{version:2,selected:5,ran:true},
          'hello-launch':{version:2,revealed:true,selected:6},
          'hello-bounds':{revealed:true,fixed:true,selected:5},'hello-transfer':{version:2,revealed:true}},
        details:[true,true,true,true],messages:{},scroll:[0,0]}));
    }''')
    page.reload()
    expect(page.locator('.restore-notice')).to_have_count(0)
    expect(page.locator('#hello-factor-0')).to_have_value('3')
    expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['?']*5)
    expect(page.locator('#hello-map-0 [data-thread="4"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('#hello-map-2 [data-thread="7"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('#hello-launch-feedback')).to_contain_text('All three predictions match')
    expect(page.locator('#hello-map-3 [data-state=skip]')).to_have_count(3)
    expect(page.locator('#hello-transfer-result')).to_contain_text('All three predictions match')
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
    check_recent_hello_snapshot(browser,url)
    context=browser.new_context(java_script_enabled=False);page=context.new_page()
    page.goto(url+'lessons/hello.html')
    expect(page.locator('.hello-section')).to_have_count(5)
    expect(page.locator('#hello-map-2 .hello-thread')).to_have_count(8)
    expect(page.locator('#hello-map-0 .hello-result')).to_have_text(['?']*5)
    expect(page.locator('#hello-full-4')).to_contain_text('__global__')
    expect(page.locator('#hello-full-4')).to_be_visible()
    expect(page.locator('#hello-map-2 [data-thread="5"]')).to_contain_text('No input')
    expect(page.locator('#hello-bounds-check')).to_be_disabled()
    page.locator('#idea-4 details').filter(has=page.get_by_text('Compare a worked explanation',exact=True)).locator('summary').click()
    expect(page.locator('#idea-4')).to_contain_text('Threads 6 and 7 still fail')
    page.locator('.hello-section-end details').last.locator('summary').click()
    expect(page.locator('.hello-section-end details').last).to_contain_text('indices 0–8 write results')
    context.close()
    print('PASS: guided inspection, three reasoning challenges, feedback, downloads, keyboard, snapshots and no-JS comparisons')
