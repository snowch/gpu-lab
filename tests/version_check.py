# Copyright © 2026 Christopher Snow.
"""Deterministic GitHub responses for footer checks; no live API dependency."""
import json
import subprocess
from pathlib import Path
from playwright.sync_api import expect

ENDPOINT = 'https://api.github.com/repos/snowch/gpu-lab/git/ref/heads/main'
SHA = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=Path(__file__).resolve().parents[1], text=True).strip()


def mock_version(context):
    context.route(ENDPOINT, lambda route: route.fulfill(json={'object': {'sha': SHA}}))


def check_version(browser, base_url):
    context = browser.new_context(service_workers='block', viewport={'width': 360, 'height': 800})
    state = {'sha': SHA, 'status': 200}

    def respond(route):
        route.fulfill(status=state['status'], content_type='application/json', body=json.dumps({'object': {'sha': state['sha']}}))

    context.route(ENDPOINT, respond)
    page = context.new_page()
    page.goto(base_url)
    indicator = page.locator('.version-status')
    expect(indicator).to_have_text('✓ Latest')
    context.set_offline(True)
    expect(indicator).to_have_text('Offline · latest unverified')
    state['sha'] = '0' * 40
    context.set_offline(False)
    expect(indicator).to_have_text('Different from latest on main')
    state['status'] = 503
    page.reload()
    expect(indicator).to_have_text('Latest version unavailable')
    state.update(status=200, sha='invalid')
    page.reload()
    expect(indicator).to_have_text('Latest version unavailable')
    state['sha'] = SHA
    page.reload()
    expect(indicator).to_have_text('✓ Latest')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Footer overflows'
    context.close()

    context = browser.new_context(java_script_enabled=False)
    page = context.new_page()
    page.goto(base_url)
    expect(page.locator('.version-status')).to_have_text('Latest version unchecked')
    context.close()
    print('PASS: latest commit match, mismatch, offline/reconnect, API failure, invalid response, no JavaScript')
