# Copyright © 2026 Christopher Snow.
"""Expandable GPU maps: native content, progressive controls and return to reading."""
from playwright.sync_api import expect, Error

def open_nodes(page, ids):
    for node in ids:
        page.locator('#'+node+' > summary').click()

def return_to_reader(page):
    with page.expect_event('close'):
        try:
            page.locator('#map-return').click(no_wait_after=True)
        except Error:
            # The click deliberately closes its own window; some Chromium builds
            # deliver that close before acknowledging the input action.
            assert page.is_closed()

def check_overview(browser,base_url,root,errors):
    for width in [1440,820,360]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
            page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(base_url+'lessons/hello.html')
            page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
            with page.expect_popup() as popup:page.locator('.gpu-map-link').click()
            map_page=popup.value;map_page.on('pageerror',lambda error:errors.append(str(error)))
            expect(map_page.locator('#map-chapter')).to_have_value('hello')
            expect(map_page.locator('#gpu > summary')).to_contain_text('Related concepts inside')
            expect(map_page.locator('#operation-panel')).to_be_hidden()
            # All essential nodes are already in the document, not generated on expansion.
            expect(map_page.locator('#sm-0')).to_have_count(1)
            map_page.locator('#gpu > summary').focus();map_page.keyboard.press('Enter')
            expect(map_page.locator('#sm-0 > summary')).to_be_visible()
            expect(map_page.locator('#sm-1 > summary')).to_be_visible()
            map_page.locator('#hardware-panel').screenshot(path=str(root/f'test-results/map-sm-{width}-{theme}.png'))
            open_nodes(map_page,['sm-0','block-a','a-warp-1','a-w1-lane-7'])
            expect(map_page.locator('#a-w1-lane-7')).to_contain_text('thread 39 within block A')
            expect(map_page.locator('#block-c > summary')).to_be_visible()
            expect(map_page.locator('#a-warp-0 > summary')).to_be_visible()
            assert map_page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            map_page.locator('#a-warp-1').screenshot(path=str(root/f'test-results/map-warp-{width}-{theme}.png'))
            map_page.reload()
            expect(map_page.locator('#a-w1-lane-7')).to_have_attribute('open','')
            map_page.locator('#map-back').click()
            expect(map_page.locator('#a-w1-lane-7')).not_to_have_attribute('open','')
            expect(map_page.locator('#a-warp-1')).to_have_attribute('open','')
            map_page.locator('#gpu > summary').click()
            expect(map_page.locator('#map-back')).to_be_disabled()
            expect(map_page.locator('#block-a')).not_to_have_attribute('open','')
            # The second diagram and its traces use ordinary HTML disclosures too.
            map_page.locator('[data-map-view=operation]').click()
            open_nodes(map_page,['operation','launch','op-grid','op-thread-4','op-thread-7'])
            expect(map_page.locator('#op-thread-4')).to_contain_text('write output[4] = 10')
            expect(map_page.locator('#op-thread-7')).to_contain_text('skips the read and write')
            assert map_page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            map_page.locator('#operation-panel').screenshot(path=str(root/f'test-results/map-operation-{width}-{theme}.png'))
            map_page.locator('#map-reset').click()
            expect(map_page.locator('#operation')).not_to_have_attribute('open','')
            expect(map_page.locator('#map-back')).to_be_disabled()
            map_page.locator('#map-chapter').select_option('attention')
            expect(map_page.locator('#ai-operations > summary')).to_contain_text('Related concepts inside')
            open_nodes(map_page,['ai-operations','ai-attention'])
            expect(map_page.locator('#ai-attention a[href="attention.html"]').first).to_be_visible()
            map_page.reload()
            expect(map_page.locator('[data-map-view=operation]')).to_have_attribute('aria-current','true')
            expect(map_page.locator('#map-chapter')).to_have_value('attention')
            expect(map_page.locator('#ai-attention')).to_have_attribute('open','')
            return_to_reader(map_page)
            expect(page.locator('#hello-output-0')).to_have_text('Output: [3, 6, 9, 12, 15]')
            page.goto(base_url+'lessons/meet-gpu.html?view=memory&concept=shared')
            expect(page.locator('#shared-a')).to_have_attribute('open','')
            expect(page.locator('#shared-a > summary')).to_be_visible()
            page.goto(base_url+'#meet-gpu')
            expect(page.locator('#gpu-map')).to_be_visible()
            context.close()
    # Each source tab retains its own return destination.
    context=browser.new_context(service_workers='block')
    first=context.new_page();first.goto(base_url+'lessons/hello.html')
    second=context.new_page();second.goto(base_url+'lessons/devices.html')
    with first.expect_popup() as opened:first.locator('.gpu-map-link').click()
    first_map=opened.value
    with second.expect_popup() as opened:second.locator('.gpu-map-link').click()
    second_map=opened.value
    expect(second_map.locator('#map-chapter')).to_have_value('devices')
    assert second_map.evaluate('window.opener.location.pathname.endsWith("devices.html")')
    return_to_reader(second_map)
    assert not first_map.is_closed()
    context.close()
    # A release update from the previous map keeps its saved concept, even though
    # the new map rewrites the URL and has a different disclosure structure.
    context=browser.new_context(service_workers='block')
    page=context.new_page()
    page.add_init_script("""if(location.pathname.endsWith('/meet-gpu.html')) {
      const key='gpu-lab:restart:'+location.pathname+location.search;
      sessionStorage.setItem(key,JSON.stringify({schema:1,controls:[],
        experiments:{'gpu-map':{view:'memory',concept:'shared',chapter:'matmul'}},
        details:[false,false,false],messages:{},scroll:[0,0]}));
      window.oldSnapshotKey=key;
    }""")
    page.goto(base_url+'lessons/meet-gpu.html?view=memory&concept=shared&chapter=matmul')
    expect(page.locator('#shared-a')).to_have_attribute('open','')
    expect(page.locator('#shared-a > summary')).to_be_visible()
    expect(page.locator('.restore-notice')).to_have_count(0)
    assert page.evaluate('sessionStorage.getItem(window.oldSnapshotKey) === null')
    context.close()
    # Reproduce the HTML preview: scripts disabled, both maps must still be usable.
    for width in [360,820,1440]:
        context=browser.new_context(java_script_enabled=False,viewport={'width':width,'height':900})
        page=context.new_page();page.goto(base_url+'lessons/meet-gpu.html')
        expect(page.locator('#gpu-map')).to_be_visible()
        expect(page.locator('#map-reset')).to_be_hidden()
        open_nodes(page,['gpu','sm-0','block-a','a-warp-1','a-w1-lane-7'])
        expect(page.locator('#sm-1 > summary')).to_be_visible()
        expect(page.locator('#a-w1-lane-7 .map-inside')).to_contain_text('thread 39')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('[data-map-view=operation]').click()
        open_nodes(page,['operation','launch','op-grid','op-thread-7'])
        expect(page.locator('#op-thread-7 .map-inside')).to_contain_text('skips the read and write')
        page.locator('#map-glossary > summary').click()
        for concept in ['block','shared','attention']:
            item=page.locator('#concept-'+concept);item.locator('summary').click()
            expect(item.locator('p').first).to_be_visible()
            expect(item.locator('.map-chapter-links a').first).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        context.close()
    print('PASS: expandable GPU maps, native SM/block/warp/lane content, traces, keyboard, themes, responsive layouts, URL state, chapter highlights, return preserving work and JavaScript-disabled preview')
