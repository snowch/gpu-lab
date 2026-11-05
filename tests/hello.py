# Copyright © 2026 Christopher Snow.
from pathlib import Path
from playwright.sync_api import expect
from version_check import mock_version

def hello_flow(page, url):
    page.goto(url + 'lessons/hello.html')
    expect(page.locator('.hello-section')).to_have_count(5)
    expect(page.locator('.hello-start-code')).to_have_text('import torch\nx = torch.tensor(\n    [1.0, 2.0, 3.0, 4.0, 5.0],\n    device="cuda",\n)\ny = x * 2')
    expect(page.locator('.hello-start-values')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    assert page.locator('.hello-start').evaluate('el=>el.getBoundingClientRect().top') < page.locator('#idea-1').evaluate('el=>el.getBoundingClientRect().top')
    for i in range(1,6):
        expect(page.locator(f'#idea-{i}')).to_be_visible()
    expect(page.locator('.hello-relationships')).to_have_count(0)
    for i in range(1,3):
        expect(page.locator(f'#idea-{i} [data-language="cuda"]')).to_have_count(0)
    expect(page.locator('#hello-bridge-launch-2')).to_be_visible()
    expect(page.locator('#hello-bridge-complete-2')).not_to_have_attribute('open','')
    expect(page.locator('#hello-bridge-launch-2 + .code-explanations')).to_have_count(0)
    page.locator('#hello-bridge-complete-2 summary').click()
    expect(page.locator('#hello-bridge-full-2')).to_contain_text('__global__ void runKernel')
    page.locator('#hello-factor-2').fill('3')
    expect(page.locator('#hello-bridge-full-2')).to_contain_text('input[i] * 3.0f')
    with page.expect_download() as bridge_download:
        page.locator('#hello-bridge-download-2').click()
    assert 'input[i] * 3.0f' in Path(bridge_download.value.path()).read_text()
    page.locator('#hello-factor-2').fill('2')
    page.locator('#hello-bridge-complete-2 summary').click()
    expect(page.locator('#hello-bounds-code-3')).to_contain_text('if (i < n)')
    expect(page.locator('[role=tablist]')).to_have_count(0)
    for stage in [2,3]:
        visual=page.locator(f'#idea-{stage+1} .hello-bridge-visual').bounding_box()
        code=page.locator(f'#idea-{stage+1} .hello-code-bridge').bounding_box()
        if page.viewport_size['width']>=1440:
            assert code['x']>visual['x']+visual['width']-1
            assert abs(code['y']-visual['y'])<2
        else:
            assert code['y']>=visual['y']+visual['height']-1
    expect(page.locator('#hello-launch-4')).to_have_text('int threadsPerBlock = 4;\nint blocks = 2;\n\nrunKernel<<<blocks, threadsPerBlock>>>(\n    d_input, d_output, 5\n);')
    assert page.locator('#hello-full-4').evaluate('el=>el.getBoundingClientRect().top') < page.locator('#hello-launch-4').evaluate('el=>el.getBoundingClientRect().top')
    assert page.locator('#hello-next, #hello-back').count() == 0
    ys=page.locator('.hello-section').evaluate_all('(els)=>els.map(el=>el.getBoundingClientRect().top)')
    assert ys == sorted(ys) and len(set(ys)) == 5
    visible=page.locator('#idea-1').inner_text()
    assert '__global__' not in visible and 'blockIdx' not in visible and 'float*' not in visible
    expect(page.locator('#hello-map-0 .hello-thread')).to_have_count(5)
    expect(page.locator('#hello-factor-0')).to_have_value('3')
    expect(page.locator('#hello-operation-0')).to_have_text('y = x * 3')
    expect(page.locator('#hello-output-1')).to_have_text('Run to follow each thread’s input and output.')
    for stage in range(5):
        outputs=page.locator(f'#hello-map-{stage} .hello-thread strong:last-child')
        expect(outputs).to_have_text(['?'] * outputs.count())
        page.locator(f'#hello-run-{stage}').click()
        expect(page.locator(f'#hello-output-{stage}')).to_have_text('Output: [3.0, 6.0, 9.0, 12.0, 15.0]' if stage==0 else 'Output: [2.0, 4.0, 6.0, 8.0, 10.0]')
        if stage:
            page.locator(f'#hello-map-{stage} [data-thread="1"]').click()
            expect(page.locator(f'#hello-output-{stage}')).to_have_text('Output: [2.0, 4.0, 6.0, 8.0, 10.0]')
        page.locator(f'#hello-factor-{stage}').fill('4' if stage==0 else '3')
        expect(outputs).to_have_text(['?'] * outputs.count())
        expect(page.locator(f'#hello-output-{stage}')).to_contain_text('Settings changed')
        page.locator(f'#hello-factor-{stage}').fill('2')

    page.locator('#hello-factor-0').fill('3')
    page.locator('#hello-run-0').click()
    expect(page.locator('#hello-output-0')).to_have_text('Output: [3.0, 6.0, 9.0, 12.0, 15.0]')
    expect(page.locator('#hello-factor-1')).to_have_value('2')
    expect(page.locator('#hello-output-1')).to_contain_text('press Run')
    page.locator('#hello-map-1 button').nth(2).focus()
    page.keyboard.press('Enter')
    expect(page.locator('#hello-index-1')).to_contain_text('i = 2')
    page.locator('#hello-map-1 button').nth(4).click()
    expect(page.locator('#hello-index-1')).to_contain_text('input at index 4')
    page.locator('#hello-factor-1').fill('3')
    page.locator('#hello-run-1').click()
    expect(page.locator('#hello-output-1')).to_have_text('Output: [3.0, 6.0, 9.0, 12.0, 15.0]')

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
    expect(page.locator('#hello-bounds-code-3')).not_to_contain_text('if (i < n)')
    expect(page.locator('#hello-bounds-code-3-label')).to_contain_text('disabled (diagnostic)')
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
    expect(page.locator('#hello-bounds-code-3')).to_contain_text('if (i < n)')
    page.locator('#hello-run-3').click()
    expect(page.locator('#hello-map-3 [data-state="skip"]')).to_have_count(3)
    expect(page.locator('#hello-map-3 [data-thread="5"]')).to_contain_text('Skipped')
    page.locator('#hello-guard-3').uncheck()
    page.locator('#hello-run-3').click()
    expect(page.locator('#hello-output-0')).to_have_text('Output: [3.0, 6.0, 9.0, 12.0, 15.0]')
    expect(page.locator('#hello-map-4 [data-state="skip"]')).to_have_count(3)
    page.locator('#hello-factor-4').fill('')
    page.locator('#hello-run-4').click()
    expect(page.locator('#hello-output-4')).to_contain_text('Enter a multiplier')
    page.locator('#hello-factor-4').fill('4')
    page.locator('#hello-run-4').click()
    expect(page.locator('#hello-output-4')).to_have_text('Output: [4.0, 8.0, 12.0, 16.0, 20.0]')
    expect(page.locator('#hello-full-4')).to_contain_text('input[i] * 4.0f')
    expect(page.locator('#hello-operation-4')).to_contain_text('y = x * 4')
    page.locator('#hello-map-4 [data-thread="4"]').click()
    expect(page.locator('#hello-cuda-trace')).to_contain_text('i = 1 × 4 + 0 = 4')
    expect(page.locator('#hello-cuda-trace')).to_contain_text('Input 5.0 → output 20.0')
    expect(page.locator('.hello-cuda-variables dd')).to_have_text(['1','4','0'])
    page.locator('#hello-map-4 [data-thread="5"]').focus()
    page.keyboard.press('Enter')
    expect(page.locator('#hello-cuda-trace')).to_contain_text('No calculation · no output written')
    page.locator('#hello-factor-4').fill('3')
    expect(page.locator('#hello-cuda-trace')).to_contain_text('Output: ?')
    expect(page.locator('#hello-launch-answer')).to_be_hidden()
    page.locator('#hello-launch-run').click()
    expect(page.locator('#hello-launch-feedback')).to_contain_text('Choose your predicted block count')
    page.locator('#hello-launch-guess').select_option('2')
    page.locator('#hello-launch-run').click()
    expect(page.locator('#hello-launch-feedback')).to_contain_text('You need 1 block.')
    expect(page.locator('#hello-launch-map .hello-group')).to_have_count(1)
    expect(page.locator('#hello-launch-map [data-state="skip"]')).to_have_count(3)
    page.locator('#hello-launch-map [data-thread="4"]').click()
    expect(page.locator('#hello-launch-index')).to_contain_text('block 0 × 8 + position 4 = index 4')
    expect(page.locator('#hello-launch-output')).to_contain_text('[2.0, 4.0, 6.0, 8.0, 10.0]')
    expect(page.locator('#hello-full-4')).to_contain_text('input[i] * 3.0f')
    with page.expect_download() as grouping_download:
        page.locator('#hello-launch-download').click()
    grouping_source=Path(grouping_download.value.path()).read_text()
    assert 'runKernel<<<(n + 8 - 1) / 8, 8>>>' in grouping_source
    assert 'input[i] * 2.0f' in grouping_source
    page.locator('#hello-launch-size').select_option('4')
    expect(page.locator('#hello-launch-answer')).to_be_hidden()
    expect(page.locator('#hello-launch-guess')).to_have_value('')
    page.locator('#hello-launch-guess').select_option('2')
    page.locator('#hello-launch-run').click()
    expect(page.locator('#hello-launch-feedback')).to_contain_text('Correct.')
    expect(page.locator('#hello-launch-map .hello-group')).to_have_count(2)
    expect(page.locator('#hello-launch-example')).to_contain_text('threadsPerBlock = 4')
    page.locator('#hello-factor-4').fill('4')
    page.locator('#hello-run-4').click()
    page.get_by_text('Run the CUDA example on your computer',exact=True).click()
    with page.expect_download() as downloaded:
        page.locator('#hello-download-4').click()
    source=Path(downloaded.value.path()).read_text()
    assert 'input[i] * 4.0f' in source and 'cudaDeviceSynchronize' in source
    expect(page.locator('#hello-factor-0')).to_have_value('3')
    expect(page.locator('#hello-output-0')).to_have_text('Output: [3.0, 6.0, 9.0, 12.0, 15.0]')
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
    expect(page.locator('#hello-output-1')).to_have_text('Output: [7.0, 14.0, 21.0, 28.0, 35.0]')
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
        expect(page.locator('#hello-output-1')).to_have_text('Run to follow each thread’s input and output.')
    # A completed ×2 experiment from an older release must keep its input and result.
    page.locator('#hello-factor-0').fill('2');page.locator('#hello-run-0').click()
    page.evaluate("""() => {
      const controls=[...document.querySelectorAll('main input,main select,main textarea')].map(el=>({id:el.id,name:el.name,value:el.value,checked:el.checked}));
      sessionStorage.setItem('gpu-lab:restart:'+location.pathname+location.search,JSON.stringify({schema:1,controls,experiments:{'hello-0':{selected:0,ran:true,length:5}},details:[],messages:{},scroll:[0,0]}));
    }""")
    page.reload()
    expect(page.locator('#hello-factor-0')).to_have_value('2')
    expect(page.locator('#hello-operation-0')).to_have_text('y = x * 2')
    expect(page.locator('#hello-output-0')).to_have_text('Output: [2.0, 4.0, 6.0, 8.0, 10.0]')
    page.locator('#hello-launch-guess').select_option('1')
    page.locator('#hello-launch-run').click()
    page.locator('#hello-launch-map [data-thread="6"]').click()
    def save_launch(revealed):
        page.evaluate("""revealed=>{
          const controls=[...document.querySelectorAll('main input:not([data-lesson-completion]),main select,main textarea')].map(el=>({id:el.id,name:el.name,value:el.value,checked:el.checked}));
          sessionStorage.setItem('gpu-lab:restart:'+location.pathname+location.search,JSON.stringify({schema:1,controls,experiments:{'hello-launch':{revealed,selected:6}},details:[],messages:{},scroll:[0,0]}));
        }""",revealed)
        page.reload()
    save_launch(True)
    expect(page.locator('#hello-launch-answer')).to_be_visible()
    expect(page.locator('#hello-launch-map [data-thread="6"]')).to_have_attribute('aria-pressed','true')
    expect(page.locator('#hello-launch-index')).to_contain_text('skips the calculation')
    page.locator('#hello-launch-size').select_option('4')
    save_launch(False)
    expect(page.locator('#hello-launch-answer')).to_be_hidden()
    expect(page.locator('#hello-launch-size')).to_have_value('4')
    expect(page.locator('.restore-notice')).to_have_count(0)
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
            for i in [1,2,3,4,5]:
                page.locator(f'#idea-{i}').screenshot(path=str(root/f'test-results/hello-idea-{i}-{width}-{theme}.png'),style='.topbar {position:static!important}')
            context.close()
    check_old_hello_snapshot(browser,url)
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page();page.goto(url+'lessons/hello.html')
    expect(page.locator('.hello-section')).to_have_count(5)
    expect(page.locator('.hello-thread')).to_have_count(34)
    expect(page.locator('#hello-output-4')).to_have_text('Run to compare the kernel’s result with the PyTorch example.')
    expect(page.locator('#hello-full-4')).to_contain_text('__global__')
    page.locator('#hello-bridge-complete-2 summary').click()
    expect(page.locator('#hello-bridge-full-2')).to_be_visible()
    expect(page.locator('#hello-bounds-code-3')).to_contain_text('if (i < n)')
    expect(page.locator('#hello-map-2 [data-thread="5"]')).to_contain_text('No calculation')
    expect(page.locator('.hello-section-end noscript p')).to_contain_text('Indices 6 and 7 skip')
    page.locator('#idea-5 noscript summary').click()
    expect(page.locator('#idea-5 noscript p')).to_have_text('Output: [2.0, 4.0, 6.0, 8.0, 10.0].')
    context.close()
    print('PASS: continuous intro, independent state, no scroll jumps, keyboard selection, CUDA download and static diagrams')
