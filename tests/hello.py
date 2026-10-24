# Copyright © 2026 Christopher Snow.
from playwright.sync_api import expect
from version_check import mock_version

def hello_flow(page, url, backend):
    page.goto(url + 'lessons/hello.html')
    expect(page.locator('h1')).to_have_text('Hello, GPU')
    expect(page.locator('#hello-next')).to_be_hidden()
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_have_text('Output: 42',timeout=30000)
    expect(page.locator('#hello-backend')).to_contain_text(backend)
    page.locator('#hello-code').fill('output[0] = 7.0;')
    expect(page.locator('#hello-next')).to_be_hidden()
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_have_text('Output: 7')
    page.get_by_text('Run this on an NVIDIA GPU', exact=True).click()
    with page.expect_download() as downloaded:
        page.locator('#hello-download').click()
    from pathlib import Path
    source=Path(downloaded.value.path()).read_text()
    assert 'output[0] = 7.0;' in source and 'cudaDeviceSynchronize' in source
    assert downloaded.value.suggested_filename == 'hello.cu'
    page.locator('#hello-next').click()
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_have_text('Output: [0, 1, 2, 3]')
    page.locator('#hello-next').click()
    page.locator('#hello-code').fill('output[i] = input[i] * 3.0;')
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_have_text('Output: [3, 6, 9, 12]')
    page.locator('#hello-next').click()
    original=page.locator('#hello-code').input_value()
    page.locator('#hello-code').fill(original.replace('5','4'))
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_contain_text('[2, 4, 6, 8, unwritten]')
    expect(page.locator('#hello-repair')).to_be_hidden()
    page.locator('#hello-code').fill(original.replace('5','6'))
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_contain_text('past the five-element buffer')
    page.locator('#hello-code').fill(original.replace('5','0'))
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_contain_text('[unwritten, unwritten, unwritten, unwritten, unwritten]')
    page.locator('#hello-code').fill(original)
    page.locator('#hello-run').click()
    expect(page.locator('#hello-output')).to_contain_text('[2, 4, 6, 8, 10]')
    expect(page.locator('#hello-output')).to_contain_text('8 threads launched; 3 skipped')
    expect(page.locator('#hello-repair')).to_be_visible()
    page.locator('#hello-back').click()
    expect(page.locator('#hello-code')).to_have_value('output[i] = input[i] * 3.0;')

def check_hello(browser,url,root,errors):
    for width in [360,820,1440]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':900},color_scheme=theme)
            mock_version(context)
            context.add_init_script("Object.defineProperty(navigator, 'gpu', {value: undefined, configurable: true})")
            page=context.new_page()
            page.on('pageerror',lambda e:errors.append(str(e)))
            hello_flow(page,url,'Browser simulation')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.goto(url+'lessons/hello.html')
            page.locator('#hello-run').click()
            expect(page.locator('#hello-output')).to_have_text('Output: 42')
            page.screenshot(path=str(root/f'test-results/hello-{width}-{theme}.png'),full_page=True,style='.topbar {position:static!important}')
            context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page();page.goto(url+'lessons/hello.html')
    expect(page.locator('noscript .notice')).to_contain_text('writes 42')
    context.close()
    print('PASS: Hello GPU edits, progression, labelled CUDA simulation, unsafe guard, mobile, keyboard-native editor and no-JavaScript content')
