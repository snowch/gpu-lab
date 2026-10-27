# Copyright © 2026 Christopher Snow.
"""Expandable GPU maps: native content, progressive controls and return to reading."""
from playwright.sync_api import expect

def open_nodes(page, ids):
    for node in ids:
        page.locator('#'+node+' > summary').click()

def check_overview(browser,base_url,root,errors):
    for width in [1440,820,360]:
        for theme in ['light','dark']:
            context=browser.new_context(viewport={'width':width,'height':1000},color_scheme=theme,service_workers='block')
            page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(base_url+'lessons/hello.html')
            page.locator('#hello-factor-0').fill('3');page.locator('#hello-run-0').click()
            page.evaluate('window.scrollTo({top:600,behavior:"instant"})');page.wait_for_timeout(100)
            reading_y=page.evaluate('scrollY')
            toggle_box=page.locator('.gpu-map-link').bounding_box()
            page.mouse.click(toggle_box['x']+toggle_box['width']/2,toggle_box['y']+toggle_box['height']/2)
            expect(page.locator('#gpu-map-frame')).to_be_visible()
            map_page=page.frame_locator('#gpu-map-frame')
            expect(page.locator('.sidebar')).to_be_hidden()
            assert page.locator('#gpu-map-frame').bounding_box()['width'] >= width-2
            expect(map_page.locator('.sidebar')).to_be_hidden()
            expect(map_page.locator('.topbar')).to_be_hidden()
            expect(map_page.locator('h1')).to_have_text('GPU map')
            expect(map_page.locator('.intro, .chapter-references, .documentation-exercises, .book-pager, #map-glossary, #map-return')).to_have_count(0)
            page.locator('#theme').click()
            expect(map_page.locator('html')).to_have_attribute('data-theme','dark' if theme=='light' else 'light')
            page.locator('#theme').click()
            expect(map_page.locator('html')).to_have_attribute('data-theme',theme)
            assert len(context.pages)==1
            expect(map_page.locator('#map-chapter')).to_have_value('hello')
            expect(map_page.locator('#gpu > summary')).to_contain_text('Related concepts inside')
            expect(map_page.locator('#operation-panel, [data-map-view]')).to_have_count(0)
            # All essential nodes are already in the document, not generated on expansion.
            expect(map_page.locator('#sm-0')).to_have_count(1)
            map_page.locator('#gpu > summary').focus();page.keyboard.press('Enter')
            expect(map_page.locator('#sm-0 > summary')).to_be_visible()
            expect(map_page.locator('#sm-1 > summary')).to_be_visible()
            map_page.locator('#hardware-panel').screenshot(path=str(root/f'test-results/map-sm-{width}-{theme}.png'))
            page.screenshot(path=str(root/f'test-results/map-toggle-{width}-{theme}.png'))
            open_nodes(map_page,['sm-0','block-a','a-warp-1','a-w1-lane-7'])
            left=map_page.locator('#sm-0').bounding_box()
            right=map_page.locator('#sm-1').bounding_box()
            if width>=820:
                assert abs(left['y']-right['y'])<2, 'SMs should remain side by side when expanded'
                assert right['x']>=left['x']+left['width'], 'SMs should occupy separate columns'
            else:
                assert right['y']>=left['y']+left['height'], 'SMs should stack on phones'
            expect(map_page.locator('#a-w1-lane-7')).to_contain_text('thread 39 within block A')
            expect(map_page.locator('#block-c > summary')).to_be_visible()
            expect(map_page.locator('#a-warp-0 > summary')).to_be_visible()
            assert map_page.locator('html').evaluate('el=>el.scrollWidth <= window.innerWidth')
            map_page.locator('#a-warp-1').screenshot(path=str(root/f'test-results/map-warp-{width}-{theme}.png'))
            page.locator('#gpu-map-frame').evaluate('el=>el.contentWindow.location.reload()')
            expect(map_page.locator('#a-w1-lane-7')).to_have_attribute('open','')
            map_page.locator('#map-back').click()
            expect(map_page.locator('#a-w1-lane-7')).not_to_have_attribute('open','')
            expect(map_page.locator('#a-warp-1')).to_have_attribute('open','')
            map_page.locator('#gpu > summary').click()
            expect(map_page.locator('#map-back')).to_be_disabled()
            expect(map_page.locator('#block-a')).not_to_have_attribute('open','')
            # Explore memory relationships without a second worked-example diagram.
            open_nodes(map_page,['vram','memory-tensor','tensor-strides'])
            expect(map_page.locator('#tensor-strides .map-chapter-links a').first).to_be_visible()
            map_page.locator('#map-reset').click()
            expect(map_page.locator('#vram')).not_to_have_attribute('open','')
            expect(map_page.locator('#map-back')).to_be_disabled()
            map_page.locator('#map-chapter').select_option('matmul')
            open_nodes(map_page,['gpu','sm-0','block-a','shared-a'])
            expect(map_page.locator('#shared-a a[href="matmul.html"]').first).to_be_visible()
            page.locator('#gpu-map-frame').evaluate('el=>el.contentWindow.location.reload()')
            expect(map_page.locator('#map-chapter')).to_have_value('matmul')
            expect(map_page.locator('#shared-a')).to_have_attribute('open','')
            page.locator('.gpu-map-link').click()
            expect(page.locator('#gpu-map-panel')).to_be_hidden()
            assert abs(page.evaluate('scrollY')-reading_y)<2
            page.locator('.gpu-map-link').click()
            expect(map_page.locator('#shared-a')).to_have_attribute('open','')
            map_page.locator('#shared-a > summary').focus();page.keyboard.press('Escape')
            expect(page.locator('#gpu-map-panel')).to_be_hidden()
            expect(page.locator('.gpu-map-link')).to_be_focused()
            expect(page.locator('#hello-output-0')).to_have_text('Output: [3, 6, 9, 12, 15]')
            page.goto(base_url+'lessons/meet-gpu.html?view=memory&concept=shared')
            expect(page.locator('#shared-a')).to_have_attribute('open','')
            expect(page.locator('#shared-a > summary')).to_be_visible()
            page.goto(base_url+'#meet-gpu')
            expect(page.locator('#gpu-map')).to_be_visible()
            context.close()
    # Choosing a chapter from the map navigates the reading window, not the frame.
    context=browser.new_context(service_workers='block')
    page=context.new_page();page.goto(base_url+'lessons/hello.html')
    page.locator('.gpu-map-link').click()
    frame=page.frame_locator('#gpu-map-frame')
    frame.locator('#gpu > summary').click()
    frame.locator('#gpu .map-chapter-links a[href="devices.html"]').last.click()
    expect(page).to_have_url(base_url+'lessons/devices.html')
    expect(page.locator('#gpu-map-panel')).to_be_hidden()
    page.locator('.gpu-map-link').click()
    expect(page.frame_locator('#gpu-map-frame').locator('#map-chapter')).to_have_value('devices')
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
    context=browser.new_context(service_workers='block')
    page=context.new_page();page.goto(base_url+'lessons/meet-gpu.html?view=operation&open=operation,launch,op-thread-4')
    expect(page.locator('#hardware-panel')).to_be_visible()
    expect(page.locator('#operation-panel, [data-map-view]')).to_have_count(0)
    page.goto(base_url+'lessons/meet-gpu.html?from=hello#concept-shared')
    expect(page.locator('#shared-a > summary')).to_be_visible()
    page.locator('.gpu-map-link').click()
    expect(page).to_have_url(base_url+'lessons/hello.html')
    context.close()
    # Reproduce the HTML preview: scripts disabled, all hardware relationships must still be usable.
    for width in [360,820,1440]:
        context=browser.new_context(java_script_enabled=False,viewport={'width':width,'height':900})
        page=context.new_page();page.goto(base_url+'lessons/meet-gpu.html')
        expect(page.locator('#gpu-map')).to_be_visible()
        expect(page.locator('.sidebar')).to_be_hidden()
        expect(page.locator('#map-reset')).to_be_hidden()
        open_nodes(page,['gpu','sm-0','block-a','a-warp-1','a-w1-lane-7'])
        expect(page.locator('#sm-1 > summary')).to_be_visible()
        expect(page.locator('#a-w1-lane-7 .map-inside')).to_contain_text('thread 39')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        open_nodes(page,['vram','memory-tensor','tensor-strides'])
        expect(page.locator('#tensor-strides .map-chapter-links a').first).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        context.close()
    print('PASS: full-width map toggle, restored scroll/results, Escape, theme sync, chapter navigation, expandable GPU maps, native SM/block/warp/lane content, traces, keyboard, themes, responsive layouts, URL state, chapter highlights, return preserving work and JavaScript-disabled preview')
