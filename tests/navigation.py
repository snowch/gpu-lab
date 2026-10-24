# Copyright © 2026 Christopher Snow.
"""Responsive, keyboard-accessible course navigation."""
from playwright.sync_api import expect
from version_check import mock_version


def check_navigation(browser, base_url, root, errors):
    for width in [360, 390]:
        for theme in ['light', 'dark']:
            context = browser.new_context(viewport={'width': width, 'height': 850}, color_scheme=theme)
            mock_version(context)
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(base_url)
            toggle = page.get_by_role('button', name='Course contents')
            navigation = page.locator('.sidebar nav')
            expect(toggle).to_be_visible()
            expect(toggle).to_have_attribute('aria-expanded', 'false')
            expect(navigation).to_be_hidden()
            assert page.locator('.sidebar').bounding_box()['height'] < 100
            page.screenshot(path=str(root / f'test-results/contents-closed-{width}-{theme}.png'))
            toggle.focus()
            page.keyboard.press('Enter')
            expect(toggle).to_have_attribute('aria-expanded', 'true')
            expect(navigation).to_be_visible()
            boxes = []
            for link in navigation.locator('a').all():
                expect(link).to_be_visible()
                boxes.append(link.bounding_box())
            assert all(abs(box['x'] - boxes[0]['x']) < 1 for box in boxes)
            assert all(abs(box['width'] - boxes[0]['width']) < 1 for box in boxes)
            assert all(box['height'] >= 44 for box in boxes)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.screenshot(path=str(root / f'test-results/contents-open-{width}-{theme}.png'))
            navigation.locator('a').last.focus()
            page.keyboard.press('Escape')
            expect(navigation).to_be_hidden()
            expect(toggle).to_be_focused()
            # Desktop resizing must never leave the sidebar hidden.
            page.set_viewport_size({'width': 1440, 'height': 900})
            expect(navigation).to_be_visible()
            expect(toggle).to_be_hidden()
            page.set_viewport_size({'width': width, 'height': 850})
            expect(navigation).to_be_hidden()
            toggle.click()
            navigation.get_by_role('link', name='Meet the GPU', exact=True).click()
            expect(page).to_have_url(base_url + 'index.html#meet-gpu')
            expect(navigation).to_be_hidden()
            toggle.click()
            navigation.get_by_role('link', name='Memory access lab', exact=True).click()
            expect(page.locator('h1')).to_have_text('Reading a tensor')
            expect(page.locator('.sidebar nav')).to_be_hidden()
            # Generated lessons use the same navigation enhancement.
            page.goto(base_url + 'lessons/scheduling.html')
            page.get_by_role('button', name='Course contents').click()
            for link in page.locator('.sidebar nav a').all():
                expect(link).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            context.close()

    context = browser.new_context(viewport={'width': 360, 'height': 800}, java_script_enabled=False)
    page = context.new_page()
    for path in ['', 'lessons/memory.html', 'lessons/scheduling.html']:
        page.goto(base_url + path)
        expect(page.locator('.sidebar nav')).to_be_visible()
        for link in page.locator('.sidebar nav a').all():
            expect(link).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    context.close()
    print('PASS: mobile contents collapse, keyboard access, aligned links, resizing, navigation and no-JavaScript fallback')
