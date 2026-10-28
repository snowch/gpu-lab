# Copyright © 2026 Christopher Snow.
from pathlib import Path
from playwright.sync_api import expect
from version_check import mock_version

def hello_flow(page, url):
    page.goto(url + 'lessons/hello.html')
    expect(page.locator('.hello-section')).to_have_count(5)
    expect(page.locator('.hello-start-code')).to_have_text('import torch\nx = torch.tensor([1.0, 2.0, 3.0, 4.0, 5.0], device="cuda")\ny = x * 2')
    expect(page.locator('.hello-start-values')).to_contain_text('[2, 4, 6, 8, 10]')
    assert page.locator('.hello-start').evaluate('el=>el.getBoundingClientRect().top') < page.locator('#idea-1').evaluate('el=>el.getBoundingClientRect().top')
    for i in range(1,6):
        expect(page.locator(f'#idea-{i}')).to_be_visible()
    expect(page.locator('.hello-relationships')).to_have_count(0)
    for i in range(1,5):
        expect(page.locator(f'#idea-{i} [data-language="cuda"]')).to_have_count(0)
    expect(page.locator('#hello-launch-4')).to_have_text('runKernel<<<2, 4>>>(d_input, d_output, 5);')
    assert page.locator('#hello-full-4').evaluate('el=>el.getBoundingClientRect().top') < page.locator('#hello-launch-4').evaluate('el=>el.getBoundingClientRect().top')
    assert page.locator('#hello-next, #hello-back').count() == 0
    ys=page.locator('.hello-section').evaluate_all('(els)=>els.map(el=>el.getBoundingClientRect().top)')
    assert ys == sorted(ys) and len(set(ys)) == 5
    visible=page.locator('#idea-1').inner_text()
    assert '__global__' not in visible and 'blockIdx' not in visible and 'float*' not in visible
    expect(page.locator('#hello-map-0 .hello-thread')).to_have_count(5)
    for stage in range(5):
        outputs=page.locator(f'#hello-map-{stage} .hello-thread strong:last-child')
        expect(outputs).to_have_text(['?'] * outputs.count())
        page.locator(f'#hello-run-{stage}').click()
        expect(page.locator(f'#hello-output-{stage}')).to_have_text('Output: [2, 4, 6, 8, 10]')
        if stage:
            page.locator(f'#hello-map-{stage} [data-thread="1"]').click()
            expect(page.locator(f'#hello-output-{stage}')).to_have_text('Output: [2, 4, 6, 8, 10]')
        page.locator(f'#hello-factor-{stage}').fill('3')
        expect(outputs).to_have_text(['?'] * outputs.count())
        expect(page.locator(f'#hello-output-{stage}')).to_contain_text('Settings changed')
        page.locator(f'#hello-factor-{stage}').fill('2')

    page.locator('#hello-factor-0').fill('3')
    page.locator('#hello-run-0').click()
    expect(page.locator('#hello-output-0')).to_have_text('Output: [3, 6, 9, 12, 15]')
    expect(page.locator('#hello-factor-1')).to_have_value('2')
    expect(page.locator('#hello-output-1')).to_contain_text('press Run')
    page.locator('#hello-map-1 button').nth(2).focus()
    page.keyboard.press('Enter')
    expect(page.locator('#hello-index-1')).to_contain_text('i = 2')
    page.locator('#hello-map-1 button').nth(4).click()
    expect(page.locator('#hello-index-1')).to_contain_text('input at index 4')
    page.locator('#hello-factor-1').fill('3')
    page.locator('#hello-run-1').click()
    expect(page.locator('#hello-output-1')).to_have_text('Output: [3, 6, 9, 12, 15]')

    page.locator('#hello-map-2 button').nth(4).scroll_into_view_if_needed()
    before=page.evaluate('scrollY')
    page.locator('#hello-map-2 button').nth(4).click()
    expect(page.locator('#hello-index-2')).to_contain_text('block 1 × 4 threads per block + position 0 = index 4')
    assert abs(page.evaluate('scrollY')-before)<30, 'Thread selection jumps the page'
    skipped=page.locator('#hello-map-2 [data-thread="5"]')
    expect(skipped).to_contain_text('No calculation')
    expect(skipped).not_to_contain_text('× 2')
    skipped.focus()
    page.keyboard.press('Enter')
    expect(skipped).to_have_attribute('aria-pressed','true')
    expect(page.locator('#hello-index-2')).to_contain_text('skips the read, multiplication and write')
    assert skipped.evaluate('el=>getComputedStyle(el).backgroundColor') != page.locator('#hello-map-2 [data-thread="4"]').evaluate('el=>getComputedStyle(el).backgroundColor')
    expect(page.locator('#hello-map-3 [data-state="skip"]')).to_have_count(3)
    page.locator('#hello-guard-3').uncheck()
    expect(page.locator('#hello-map-3 [data-state="skip"]')).to_have_count(0)
    expect(page.locator('#hello-map-3 [data-thread="5"]')).to_contain_text('Run to check')
    page.locator('#hello-run-3').scroll_into_view_if_needed()
    before=page.evaluate('scrollY')
    page.locator('#hello-run-3').click()
    expect(page.locator('#hello-map-3 [data-state="invalid"]')).to_have_count(3)
    assert abs(page.evaluate('scrollY')-before)<30, 'Run jumps the page'
    expect(page.locator('#hello-map-3 [data-thread="5"]')).to_contain_text('Invalid read')
    expect(page.locator('#hello-map-3 [data-thread="5"]')).not_to_contain_text('No calculation')
    page.locator('#hello-guard-3').check()
    page.locator('#hello-run-3').click()
    expect(page.locator('#hello-map-3 [data-state="skip"]')).to_have_count(3)
    expect(page.locator('#hello-map-3 [data-thread="5"]')).to_contain_text('Skipped')
    page.locator('#hello-guard-3').uncheck()
    page.locator('#hello-run-3').click()
    expect(page.locator('#hello-output-0')).to_have_text('Output: [3, 6, 9, 12, 15]')
    expect(page.locator('#hello-map-4 [data-state="skip"]')).to_have_count(3)
    page.locator('#hello-factor-4').fill('')
    page.locator('#hello-run-4').click()
    expect(page.locator('#hello-output-4')).to_contain_text('Enter a multiplier')
    page.locator('#hello-factor-4').fill('4')
    page.locator('#hello-run-4').click()
    expect(page.locator('#hello-output-4')).to_have_text('Output: [4, 8, 12, 16, 20]')
    expect(page.locator('#hello-full-4')).to_contain_text('input[i] * 4.0f')
    expect(page.locator('#hello-operation-4')).to_contain_text('y = x * 4')
    page.get_by_text('Run the CUDA example on your computer',exact=True).click()
    with page.expect_download() as downloaded:
        page.locator('#hello-download-4').click()
    source=Path(downloaded.value.path()).read_text()
    assert 'input[i] * 4.0f' in source and 'cudaDeviceSynchronize' in source
    expect(page.locator('#hello-factor-0')).to_have_value('3')
    expect(page.locator('#hello-output-0')).to_have_text('Output: [3, 6, 9, 12, 15]')
    expect(page.locator('#hello-output-3')).to_contain_text('3 threads would access outside')
    page.locator('#hello-transfer-count').select_option('9')
    page.locator('#hello-transfer-run').click()
    expect(page.locator('#hello-transfer-result')).to_contain_text('3 blocks × 4 threads = 12 threads')
    expect(page.locator('#hello-transfer-result')).to_contain_text('9, 10, 11 skip')
    page.locator('#hello-transfer-count').select_option('8')
    expect(page.locator('#hello-transfer-result')).to_have_text('Predict first, then check.')
    page.locator('#hello-transfer-run').click()
    expect(page.locator('#hello-transfer-result')).to_contain_text('none skip')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')

def check_old_hello_snapshot(browser,url):
    context=browser.new_context(service_workers='block')
    page=context.new_page();page.goto(url+'lessons/hello.html')
    page.locator('#hello-factor-1').fill('7')
    page.evaluate("""() => {
      const controls=[...document.querySelectorAll('main input,main select,main textarea')].map(el=>({id:el.id,name:el.name,value:el.value,checked:el.checked}));
      sessionStorage.setItem('gpu-lab:restart:'+location.pathname+location.search,JSON.stringify({
        schema:1,controls,experiments:{'hello-1':{selected:2,ran:true}},details:[],
        messages:{'hello-output-1':'Output: [7, 14, 21, 28]'},scroll:[0,0]
      }));
    }""")
    page.reload()
    expect(page.locator('#hello-factor-1')).to_have_value('7')
    expect(page.locator('#hello-output-1')).to_have_text('Output: [7, 14, 21, 28, 35]')
    expect(page.locator('#hello-map-1 .hello-thread')).to_have_count(5)
    expect(page.locator('#hello-map-1 [data-thread="2"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('.restore-notice')).to_have_count(0)
    for ran,message in [(True,'Example output: [2, 4, 6, 8, 10]'),(False,'Settings changed—predict again, then press Run.')]:
        page.evaluate('''([ran,message]) => {
          const controls=[...document.querySelectorAll('main input,main select,main textarea')].map(el=>({id:el.id,name:el.name,value:el.value,checked:el.checked}));
          sessionStorage.setItem('gpu-lab:restart:'+location.pathname+location.search,JSON.stringify({schema:1,controls,experiments:{'hello-1':{selected:2,ran,message}},details:[],messages:{},scroll:[0,0]}));
        }''',[ran,message])
        page.reload()
        expect(page.locator('#hello-map-1 .hello-thread strong:last-child')).to_have_text(['?']*5)
        expect(page.locator('#hello-output-1')).to_have_text('Predict the outputs, then press Run.')
    context.close()

def check_hello(browser,url,root,errors):
    for width in [360,820,1440]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':900},color_scheme=theme)
            mock_version(context)
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            hello_flow(page,url)
            page.locator('.hello-start').screenshot(path=str(root/f'test-results/hello-pytorch-{width}-{theme}.png'),style='.topbar {position:static!important}')
            for i in [1,2,3,4]:
                page.locator(f'#idea-{i}').screenshot(path=str(root/f'test-results/hello-idea-{i}-{width}-{theme}.png'),style='.topbar {position:static!important}')
            context.close()
    check_old_hello_snapshot(browser,url)
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page();page.goto(url+'lessons/hello.html')
    expect(page.locator('.hello-section')).to_have_count(5)
    expect(page.locator('.hello-thread')).to_have_count(34)
    expect(page.locator('#hello-output-4')).to_have_text('Predict the outputs, then press Run.')
    expect(page.locator('#hello-full-4')).to_contain_text('__global__')
    expect(page.locator('#hello-map-2 [data-thread="5"]')).to_contain_text('No calculation')
    expect(page.locator('.hello-section-end noscript p')).to_contain_text('Indices 6 and 7 skip')
    page.locator('#idea-5 noscript summary').click()
    expect(page.locator('#idea-5 noscript p')).to_have_text('Output: [2, 4, 6, 8, 10].')
    context.close()
    print('PASS: continuous intro, independent state, no scroll jumps, keyboard selection, CUDA download and static diagrams')
