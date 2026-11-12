# Copyright © 2026 Christopher Snow.
"""The promoted memory chapter and later CUDA references form one readable course."""
from playwright.sync_api import expect
from version_check import mock_version

SLUGS = ['hello', 'devices', 'launch-from-input', 'reading', 'layout', 'requests',
         'scheduling', 'divergence', 'reduction', 'matmul', 'tensor-cores',
         'attention', 'inference', 'putting-it-together']
CUDA = {'reading': '#cuda-row', 'layout': '#cuda-pack', 'requests': '#cuda-requests',
        'scheduling': '#cuda-scheduling', 'divergence': '#cuda-branch',
        'reduction': '#cuda-reduction', 'matmul': '#cuda-dot',
        'tensor-cores': '#cuda-precision', 'attention': '#cuda-attention-update',
        'inference': '#cuda-cache', 'putting-it-together': '#cuda-timing'}


def check_course_flow(browser, url, root):
    for width in [360, 820, 1440]:
        for theme in ['light', 'dark']:
            context = browser.new_context(viewport={'width': width, 'height': 1000},
                                          color_scheme=theme, service_workers='block')
            mock_version(context)
            context.add_init_script("localStorage.setItem('gpu-lab:v1:manual-completion:launch-from-input', 'true')")
            page = context.new_page()
            for number, slug in enumerate(SLUGS, 1):
                page.goto(url + 'lessons/' + slug + '.html')
                expect(page.locator('main > header .eyebrow')).to_have_text('CHAPTER ' + str(number))
                if number < len(SLUGS):
                    expect(page.locator('.lesson-forward a')).to_have_attribute('href', SLUGS[number] + '.html')
                if number > 1:
                    previous = page.locator('.book-pager > a').get_attribute('href').split('#')[0]
                    assert previous == SLUGS[number - 2] + '.html', (slug, previous)
                if slug == 'launch-from-input':
                    expect(page.locator('#lesson-complete')).to_be_checked()
                    expect(page.locator('.sidebar a[href="launch-from-input.html"]')).to_have_count(1)
                if slug in CUDA:
                    pre = page.locator(CUDA[slug])
                    expect(pre).to_be_visible()
                    listing = pre.locator('xpath=following-sibling::*[1]')
                    expect(listing).to_have_class('code-explanations')
                    source = pre.text_content()
                    for button in listing.locator('button').all():
                        assert button.get_attribute('data-code-fragment') in source
                        button.focus()
                        page.keyboard.press('Enter')
                        expect(button).to_have_attribute('aria-pressed', 'true')
                        assert pre.locator('.is-code-highlighted').count() > 0
                        assert pre.text_content() == source
                    pre.locator('xpath=..').screenshot(path=str(root / f'test-results/cuda-{slug}-{width}-{theme}.png'))
                if slug == 'matmul':
                    expect(page.locator('#cuda-tiled')).to_be_visible()
                if slug == 'tensor-cores':
                    page.locator('#cuda-wmma-connection > summary').click()
                    expect(page.locator('#cuda-wmma')).to_be_visible()
                    page.locator('#cuda-wmma-connection').screenshot(path=str(root / f'test-results/cuda-wmma-{width}-{theme}.png'))
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (slug, width, theme)
            page.goto(url)
            expect(page.locator('.roadmap h3')).to_have_count(14)
            expect(page.locator('.roadmap a[data-completion-lesson="launch-from-input"]')).to_have_attribute('data-done', 'true')
            context.close()
    context = browser.new_context(java_script_enabled=False, viewport={'width': 360, 'height': 900})
    page = context.new_page()
    for slug, selector in CUDA.items():
        page.goto(url + 'lessons/' + slug + '.html')
        expect(page.locator(selector)).to_be_visible()
        expect(page.locator(selector + ' + .code-explanations')).to_be_visible()
    response = context.request.get(url + 'examples/desktop/course-bridges.cu')
    assert response.ok and 'int main(' in response.text()
    response = context.request.get(url + 'examples/desktop/wmma.cu')
    assert response.ok and 'matrixTile<<<1,32>>>' in response.text()
    context.close()
    print('PASS: fourteen-chapter sequence, preserved completion mark, later CUDA explanations/highlighting, downloads and static reading on phone/tablet/desktop in both themes')
