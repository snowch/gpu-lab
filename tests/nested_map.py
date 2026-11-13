# Copyright © 2026 Christopher Snow.
"""The reader's map snapshot wins over a stale independently restored iframe."""
from playwright.sync_api import expect
from version_check import mock_version

SAVE = """async () => {
 const script=[...document.scripts].find(s=>s.type==='module'&&s.src.includes('/src/'));
 const state=await import(new URL('./experiment-state.mjs',script.src));
 state.saveReadingState();
}"""


def check_nested_map(browser, url, root):
    context=browser.new_context(viewport={'width':390,'height':900},service_workers='block')
    mock_version(context)
    page=context.new_page();page.goto(url+'lessons/hello.html')
    page.locator('.gpu-map-link').click()
    frame=page.frame_locator('#gpu-map-frame')
    expect(frame.locator('.map-tools')).to_be_visible()
    for node in ['gpu','sm-0','block-a','a-warp-1','a-w1-lane-7']:
        frame.locator('#'+node+' > summary').click()
    expect(frame.locator('#a-w1-lane-7')).to_have_attribute('open','')
    child=next(f for f in page.frames if 'meet-gpu.html' in f.url)
    scroll=child.evaluate('() => {scrollTo(0,300);return scrollY}')
    assert scroll>0
    page.evaluate(SAVE);child.evaluate(SAVE)
    # A child can also be restarted by the worker. Its consumed or older snapshot
    # must not overwrite the map state owned by the parent reading window.
    child.evaluate("""() => {
      const key='gpu-lab:restart:'+location.pathname+location.search;
      const data=JSON.parse(sessionStorage.getItem(key));
      data.experiments['gpu-map'].open=[];data.experiments['gpu-map'].recent=[];
      data.scroll=[0,0];sessionStorage.setItem(key,JSON.stringify(data));
    }""")
    page.reload()
    expect(page.locator('#gpu-map-panel')).to_be_visible()
    expect(page.locator('#gpu-map-panel .map-loading')).to_be_hidden(timeout=20000)
    expect(frame.locator('#a-w1-lane-7')).to_have_attribute('open','')
    child=next(f for f in page.frames if 'meet-gpu.html' in f.url)
    child.wait_for_function('(y)=>scrollY===y',arg=scroll)
    page.locator('.gpu-map-link').click()
    expect(page.locator('#gpu-map-panel')).to_be_hidden()
    context.close()
    print('PASS: parent-owned map disclosures and scroll survive stale iframe restart state')
