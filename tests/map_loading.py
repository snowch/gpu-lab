# Copyright © 2026 Christopher Snow.
"""Measure map geometry after the document's stylesheets finish loading."""
from playwright.sync_api import expect


def assert_map_fits(page):
    # A navigation click can return while the next document is still interactive.
    # Its content may be visible before the base stylesheet's box-sizing applies.
    page.wait_for_load_state('load')
    geometry = page.evaluate('''() => ({
        viewport: innerWidth,
        page: document.documentElement.scrollWidth,
    })''')
    assert geometry['page'] <= geometry['viewport'], f'Concept map overflows: {geometry}'


def check_map_loading(browser, url):
    context = browser.new_context(
        viewport={'width': 390, 'height': 1000},
        color_scheme='dark', service_workers='block',
    )
    page = context.new_page()
    page.goto(url)
    pending = []
    # Delay only the base stylesheet. The map's width/padding rules then arrive
    # before the shared border-box rule, reproducing the failed deployment run.
    page.route('**/src/style.css', lambda route: pending.append(route))
    page.get_by_role('button', name='Course contents').click()
    page.locator('.sidebar nav').get_by_role('link', name='GPU map', exact=True).click()
    expect(page.locator('#hardware-panel h2')).to_have_text('Computer / system')
    page.wait_for_function("getComputedStyle(document.querySelector('main')).paddingLeft === '16px'")
    assert pending, 'The base stylesheet must still be held for this regression check'
    assert page.evaluate('document.readyState') != 'complete'
    assert page.evaluate('document.documentElement.scrollWidth > innerWidth')
    for route in pending:
        route.continue_()
    assert_map_fits(page)
    assert page.evaluate('document.readyState') == 'complete'
    assert page.locator('main').evaluate("el => getComputedStyle(el).boxSizing") == 'border-box'
    context.close()
    print('PASS: delayed map stylesheets reproduce the early geometry race; completed layout fits')
