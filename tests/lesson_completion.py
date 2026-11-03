# Copyright © 2026 Christopher Snow.
"""Manual completion stays independent of exercise state, navigation and other tabs."""
from playwright.sync_api import expect
from version_check import mock_version


def check_lesson_completion(browser, base_url, root, errors):
    for width in [360, 820, 1440]:
        for theme in ['light', 'dark']:
            context=browser.new_context(viewport={'width':width,'height':900},color_scheme=theme)
            mock_version(context)
            page=context.new_page()
            page.on('pageerror',lambda error:errors.append(str(error)))
            page.goto(base_url+'lessons/hello.html')
            mark=page.get_by_role('checkbox',name='Mark lesson as done',exact=True)
            expect(mark).not_to_be_checked()
            page.locator('#hello-factor-1').fill('1.5')
            page.locator('#hello-run-1').click()
            result=page.locator('#hello-output-1').inner_text()
            expect(mark).not_to_be_checked()
            mark.scroll_into_view_if_needed();mark.focus()
            scroll=page.evaluate('scrollY')
            page.keyboard.press('Space')
            expect(mark).to_be_checked()
            assert abs(page.evaluate('scrollY')-scroll)<5,'Marking a lesson must not move the page'
            expect(page.locator('#hello-output-1')).to_have_text(result)
            expect(page.locator('#hello-factor-1')).to_have_value('1.5')
            expect(page.locator('.sidebar a[data-completion-lesson=hello]')).to_have_attribute('data-done','true')
            assert page.locator('.lesson-forward').locator('a').last.get_attribute('href')=='devices.html'
            page.locator('.lesson-forward').screenshot(path=str(root/f'test-results/completion-{width}-{theme}.png'))
            page.reload();expect(mark).to_be_checked()
            page.locator('.lesson-forward a').last.click()
            expect(page.locator('h1')).to_have_text('Where are tensor values stored?')
            page.locator('#lesson-complete').check()
            overview=context.new_page();overview.goto(base_url)
            for slug in ['hello','devices']:
                expect(overview.locator(f'.roadmap a[data-completion-lesson={slug}] .lesson-done-tick')).to_be_visible()
            # A second tab can undo the same mark; stale tabs also keep other lessons.
            other=context.new_page();other.goto(base_url+'lessons/hello.html')
            other.locator('#lesson-complete').uncheck()
            expect(overview.locator('.roadmap a[data-completion-lesson=hello]')).to_have_attribute('data-done','false')
            expect(page.locator('.sidebar a[data-completion-lesson=hello]')).to_have_attribute('data-done','false')
            expect(page.locator('#lesson-complete')).to_be_checked()
            other.locator('#lesson-complete').check()
            expect(overview.locator('.roadmap a[data-completion-lesson=hello]')).to_have_attribute('data-done','true')
            expect(overview.locator('.roadmap a[data-completion-lesson=devices]')).to_have_attribute('data-done','true')
            if width==360:
                other.get_by_role('button',name='Course contents').click()
            completed=other.get_by_role('link',name='1. How does a GPU double five values? — done',exact=True)
            expect(completed).to_be_visible()
            expect(completed).to_have_attribute('aria-current','page')
            assert other.evaluate('document.documentElement.scrollWidth<=innerWidth')
            for slug in ['putting-it-together','kernel','shared-memory','memory']:
                other.goto(base_url+'lessons/'+slug+'.html')
                expect(other.locator('#lesson-complete')).to_be_visible()
                other.locator('#lesson-complete').check()
                other.reload();expect(other.locator('#lesson-complete')).to_be_checked()
            for slug in ['desktop','meet-gpu']:
                other.goto(base_url+'lessons/'+slug+'.html')
                expect(other.locator('#lesson-complete')).to_have_count(0)
            overview.add_style_tag(content='.topbar {position:static!important}')
            overview.locator('.roadmap').screenshot(path=str(root/f'test-results/completion-contents-{width}-{theme}.png'))
            context.close()
    context=browser.new_context()
    mock_version(context)
    context.add_init_script("""const save=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){
        if(key.startsWith('gpu-lab:v1:manual-completion:'))throw new DOMException('Denied','QuotaExceededError');
        return save.call(this,key,value);
    };""")
    page=context.new_page();page.goto(base_url+'lessons/hello.html')
    page.locator('#lesson-complete').check()
    expect(page.locator('#lesson-completion-note')).to_contain_text('could not be saved')
    expect(page.locator('.sidebar a[data-completion-lesson=hello]')).to_have_attribute('data-done','true')
    assert page.evaluate("localStorage.getItem('gpu-lab:v1:manual-completion:hello')") is None
    reason=page.evaluate("() => {const detail={reason:''};dispatchEvent(new CustomEvent('gpu-lab:before-restart',{detail}));return detail.reason;}")
    assert 'unsaved lesson mark' in reason
    page.locator('#lesson-complete').uncheck()
    reason=page.evaluate("() => {const detail={reason:''};dispatchEvent(new CustomEvent('gpu-lab:before-restart',{detail}));return detail.reason;}")
    assert reason==''
    context.close()
    # A restart snapshot must not undo a newer durable completion mark.
    context=browser.new_context();mock_version(context)
    page=context.new_page();page.goto(base_url+'lessons/hello.html')
    page.locator('#lesson-complete').check()
    page.evaluate("""() => sessionStorage.setItem('gpu-lab:restart:'+location.pathname+location.search,JSON.stringify({
        schema:1,controls:[{id:'lesson-complete',value:'on',checked:false}],experiments:{},details:[],messages:{},scroll:[0,0]
    }))""")
    page.reload();expect(page.locator('#lesson-complete')).to_be_checked()
    expect(page.locator('.sidebar a[data-completion-lesson=hello]')).to_have_attribute('data-done','true')
    context.close()
    context=browser.new_context(java_script_enabled=False)
    page=context.new_page();page.goto(base_url+'lessons/hello.html')
    expect(page.locator('.lesson-completion')).to_be_hidden()
    expect(page.locator('.lesson-forward a')).to_be_visible()
    context.close()
    print('PASS: manual completion, undo, persistence, cross-tab marks, independent exercises, keyboard, layouts/themes, unavailable storage and static navigation')
