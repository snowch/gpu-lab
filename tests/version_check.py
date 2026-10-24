# Copyright © 2026 Christopher Snow.
"""App status checks deployed metadata, never a source branch."""
import json
from pathlib import Path
from playwright.sync_api import expect

RELEASE = json.loads((Path(__file__).resolve().parents[1] / 'dist/release.json').read_text())

def mock_version(context):
    # All version requests are local. The normal static server supplies metadata.
    context.route('https://api.github.com/**', lambda route: route.abort())

def check_version(browser, base_url):
    context = browser.new_context(service_workers='block', viewport={'width': 360, 'height': 800})
    state = {'release': RELEASE, 'status': 200, 'age': '0'}
    context.route('**/release.json?*', lambda route: route.fulfill(status=state['status'], json=state['release'], headers={'Age':state['age']}))
    page = context.new_page(); page.goto(base_url); page.locator('#app-status-open').click()
    indicator = page.locator('#version-status')
    expect(indicator).to_have_text('Up to date')
    original = page.locator('#running-version').inner_text()
    context.set_offline(True); expect(indicator).to_have_text('Cannot check for updates')
    state['release'] = {**RELEASE, 'id':'0'*64}
    context.set_offline(False); expect(indicator).to_have_text('Update available')
    expect(page.locator('#running-version')).to_have_text(original)
    for bad in ['http', 'malformed', 'cached']:
        state.update(status=503 if bad=='http' else 200, release={} if bad=='malformed' else RELEASE, age='10' if bad=='cached' else '0')
        page.locator('#check-update').click(); expect(indicator).to_have_text('Couldn’t check for updates')
    state.update(status=200, release=RELEASE, age='0')
    # Hold a real fetch beyond the page's deadline, then deliver a stale success.
    held=[]
    context.unroute('**/release.json?*')
    context.route('**/release.json?*', lambda route: held.append(route))
    page.locator('#check-update').click()
    expect(indicator).to_have_text('Couldn’t check for updates',timeout=12000)
    for route in held:
        try: route.fulfill(json=RELEASE)
        except Exception: pass  # Chromium may already have disposed the aborted request.
    expect(indicator).to_have_text('Couldn’t check for updates')
    context.unroute('**/release.json?*')
    context.route('**/release.json?*', lambda route:route.fulfill(json=RELEASE))
    page.locator('#check-update').click(); expect(indicator).to_have_text('Up to date')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    page.keyboard.press('Escape'); expect(page.locator('#app-status-open')).to_be_focused()
    context.close()
    print('PASS: deployed identity, mismatch, offline/reconnect, failure, malformed/cached metadata, immutable running identity, keyboard focus')
