from version_check import mock_version, check_version
from navigation import check_navigation
from overview import check_overview
from kernel import check_kernel
from hello import check_hello
from book_opening import check_book_opening
from reference_practice import check_reference_practice
from desktop import check_desktop
# Copyright © 2026 Christopher Snow.
"""Browser checks against the built course, including the GitHub Pages subpath."""
import os
from pathlib import Path
import subprocess
import time
from urllib.request import urlopen

from playwright.sync_api import sync_playwright, expect
from new_lessons import check_lessons
from remaining_lessons import check_remaining

ROOT = Path(__file__).resolve().parents[1]
PORT = 5178
URL = f"http://127.0.0.1:{PORT}/gpu-lab/"
server = subprocess.Popen(
    ["node", "scripts/serve.mjs", "--dist"], cwd=ROOT,
    env={**os.environ, "PORT": str(PORT)}, stdout=subprocess.DEVNULL,
)
try:
    for attempt in range(60):
        try:
            with urlopen(URL, timeout=1) as response:
                assert response.status == 200
            break
        except OSError:
            if server.poll() is not None:
                raise RuntimeError("Preview server stopped")
            time.sleep(0.1)
    else:
        raise RuntimeError("Preview server did not start")

    with sync_playwright() as playwright:
        options = {"headless": True}
        if os.environ.get("CHROMIUM_PATH"):
            options["executable_path"] = os.environ["CHROMIUM_PATH"]
        browser = playwright.chromium.launch(**options)
        errors = []
        for width in [1440, 390]:
            for theme in ["light", "dark"]:
                context = browser.new_context(viewport={"width": width, "height": 1000}, color_scheme=theme)
                mock_version(context)
                page = context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
                page.goto(URL)
                expect(page.locator("#simulator")).to_have_count(0)
                expect(page.locator("#prediction")).to_have_count(0)
                expect(page.locator(".roadmap h3")).to_have_count(13)
                expect(page.locator("html")).to_have_attribute("data-theme", theme)
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Introduction overflows"
                expect(page.locator('.architecture-layer, #work-map')).to_have_count(0)
                toggle=page.get_by_role('button',name='Course contents')
                if toggle.is_visible():toggle.click()
                page.locator('.sidebar nav').get_by_role('link',name='GPU map',exact=True).click()
                expect(page).to_have_url(URL+'lessons/meet-gpu.html')
                expect(page.locator('#gpu-map')).to_be_visible()
                expect(page.locator('#hardware-panel h2')).to_have_text('Computer / system')
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Concept map overflows"
                page.screenshot(path=str(ROOT / f"test-results/intro-{width}-{theme}.png"), full_page=True)
                page.goto(URL + "lessons/memory.html")
                expect(page).to_have_url(URL + "lessons/memory.html")
                expect(page.locator("h1")).to_have_text("Reading a tensor")
                expect(page.locator("#curriculum")).to_have_count(0)
                # Storage means RAM/VRAM, and its mapping to a grid is visible before stride controls.
                expect(page.locator("#pytorch h2")).to_have_text("Where does a tensor keep its numbers?")
                expect(page.locator("#pytorch .prose").first).to_contain_text("system RAM")
                expect(page.locator("#pytorch .prose").first).to_contain_text("SSD or disk")
                expect(page.locator(".storage-primer")).to_be_visible()
                expect(page.locator(".storage-primer-grid .storage-primer-value")).to_have_count(8)
                expect(page.locator(".storage-primer-memory .storage-primer-value")).to_have_count(8)
                expect(page.locator(".storage-primer-memory")).to_contain_text("28 B")
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Storage primer overflows"
                # New vocabulary must be available without opening a tooltip or simulator.
                expect(page.locator("#lab .concepts")).to_be_visible()
                expect(page.locator("#lab .concepts dt")).to_have_text(["Kernel", "Thread", "Warp", "Lane"])
                expect(page.locator("#lab .concepts-lane")).to_have_count(32)
                expect(page.locator("#lab .concepts-warp")).to_contain_text("not a separate hardware group")
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "New concepts overflows"
                # Worked examples must be visible before any interaction.
                expect(page.locator(".stride-example")).to_have_count(2)
                expect(page.locator('.stride-example[data-direction="column"]')).to_be_visible()
                expect(page.locator('.stride-example[data-direction="row"]')).to_be_visible()
                expect(page.locator('.stride-example[data-direction="column"] .stride-summary')).to_contain_text("+4 bytes")
                expect(page.locator('.stride-example[data-direction="row"] .stride-summary')).to_contain_text("+32 bytes")
                expect(page.locator(".view-copy-comparison")).to_be_visible()
                expect(page.locator(".view-copy-comparison")).to_contain_text("x[:, 0]")
                expect(page.locator(".sector-comparison")).to_be_visible()
                expect(page.locator(".sector-comparison")).to_contain_text("4 sectors")
                expect(page.locator(".sector-comparison")).to_contain_text("32 sectors")
                # Advanced controls are progressively disclosed.
                expect(page.locator("details.more-settings")).to_have_count(2)
                page.locator("details.more-settings summary").first.click()
                expect(page.locator("#tensor-diagram")).to_have_attribute("data-ready", "true")
                expect(page.locator("#tensor-step-summary")).to_contain_text("8 elements × 4 bytes = 32 bytes")
                expect(page.locator("#tensor-diagram .tensor-cell.destination")).to_have_text("8")
                page.get_by_role("button", name="Column index +1 →").click()
                expect(page.locator("#tensor-step-summary")).to_contain_text("1 element × 4 bytes = 4 bytes")
                expect(page.locator("#tensor-diagram .tensor-cell.destination")).to_have_text("1")
                page.locator("#tensor-origin-row").select_option("1")
                page.locator("#tensor-origin-col").select_option("2")
                expect(page.locator("#tensor-diagram .tensor-cell.origin")).to_have_text("10")
                expect(page.locator("#tensor-diagram .storage-cell.destination strong")).to_have_text("11")
                page.get_by_role("button", name="Row index +1 ↓").click()
                expect(page.locator("#tensor-diagram .tensor-cell.destination")).to_have_text("18")
                expect(page.locator("#tensor-diagram .storage-cell.destination>span")).to_have_text("72 B")
                expect(page.locator("#tensor-slice-diagram")).to_have_attribute("data-ready", "true")
                page.locator("#tensor-slice-mode").select_option("packed")
                expect(page.locator("#tensor-slice-diagram .slice-storage")).to_have_count(2)
                expect(page.locator("#tensor-slice-diagram .tensor-summary")).to_contain_text("Storage is separate")
                expect(page.locator("#tensor-slice-diagram .slice-storage").nth(1).locator(".slice-slot strong")).to_have_text(["0", "8", "16", "24"])
                expect(page.locator("#tensor-slice-diagram .slice-storage").nth(1).locator(".slice-slot>span")).to_have_text(["slot 0", "slot 1", "slot 2", "slot 3"])
                page.locator("#tensor-slice-mode").select_option("row")
                expect(page.locator("#tensor-slice-diagram .tensor-summary")).to_contain_text("Storage is shared")
                expect(page.locator("html")).to_have_attribute("data-theme", theme)
                expect(page.locator("#results")).to_be_hidden()
                expect(page.locator("#lanes button")).to_have_count(32)
                page.get_by_role("button", name="Model x[0, :] · first row").click()
                expect(page.locator("#stride")).to_have_value("1")
                expect(page.locator("#active")).to_have_value("8")
                page.locator("#show-result").click()
                expect(page.locator("#sector-count")).to_have_text("1")
                page.get_by_role("button", name="Model x[:, 0] · first column").click()
                expect(page.locator("#stride")).to_have_value("8")
                expect(page.locator("#active")).to_have_value("32")
                expect(page.locator("#results")).to_be_hidden()
                page.locator("#show-result").click()
                expect(page.locator("#sector-count")).to_have_text("32")
                page.get_by_role("button", name="Contiguous", exact=True).click()
                page.locator("#guess").fill("4")
                page.get_by_role("button", name="Check prediction").click()
                expect(page.locator("#feedback")).to_contain_text("matches: 4")
                expect(page.locator("#sector-count")).to_have_text("4")
                expect(page.locator("#utilisation")).to_have_text("100%")
                page.get_by_role("button", name="Lane 9", exact=True).click()
                expect(page.locator("#lane-detail")).to_contain_text("byte address 36 → sector 1")
                expect(page.locator(".word.selected")).to_have_text("L9")

                page.get_by_role("button", name="Tensor column", exact=True).click()
                expect(page.locator("#results")).to_be_hidden()
                expect(page.locator("#guess")).to_have_value("")
                page.locator("#guess").fill("4")
                page.get_by_role("button", name="Check prediction").click()
                expect(page.locator("#feedback")).to_contain_text("model touches 32")
                expect(page.locator(".sector")).to_have_count(32)
                expect(page.locator("#kernel")).to_contain_text("x[0 + i * 8]")

                page.get_by_role("button", name="Shift by one", exact=True).click()
                page.get_by_role("button", name="Show result without guessing").click()
                expect(page.locator("#sector-count")).to_have_text("5")
                page.locator("#active").select_option("8")
                page.get_by_role("button", name="Show result without guessing").click()
                expect(page.locator("#sector-count")).to_have_text("2")
                expect(page.locator("#useful-bytes")).to_have_text("32")
                page.get_by_role("button", name="Lane 9, inactive", exact=True).click()
                expect(page.locator("#lane-detail")).to_contain_text("inactive")
                expect(page.locator(".word.selected")).to_have_count(0)
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Page overflows horizontally"
                assert page.locator("#sectors").evaluate("el => el.scrollWidth <= el.clientWidth"), "Sector figure overflows"

                page.locator("#theme").click()
                opposite = "dark" if theme == "light" else "light"
                page.reload()
                expect(page.locator("html")).to_have_attribute("data-theme", opposite)
                page.locator("#theme").click()
                page.locator("#show-result").click()
                page.screenshot(path=str(ROOT / f"test-results/{width}-{theme}.png"), full_page=True)
                response = context.request.get(URL + "examples/gather.cu")
                assert response.ok and "cudaGetLastError" in response.text()
                expect(page.get_by_role("link", name="Download runnable example ↓")).to_have_attribute("href", "../examples/gather.cu")
                page.get_by_role("link", name="Next lesson →").click()
                expect(page.locator("h1")).to_have_text("How can work continue during a wait?")
                page.locator(".book-pager a").first.click()
                expect(page.locator("h1")).to_have_text("How do threads read those values?")
                page.goto(URL)
                expect(page.locator(".roadmap h3")).to_have_count(13)
                page.goto(URL + "#lab")
                expect(page).to_have_url(URL + "lessons/memory.html#lab")
                expect(page.locator("#lanes button")).to_have_count(32)
                context.close()
                print(f"PASS: {width}px, {theme} theme; prediction, reset, lane selection, CUDA, no overflow")

        # Target the narrower phone width without changing the full browser regression matrix.
        narrow = browser.new_context(viewport={"width": 360, "height": 800})
        mock_version(narrow)
        narrow_page = narrow.new_page()
        narrow_page.goto(URL + "lessons/memory.html")
        expect(narrow_page.locator(".storage-primer")).to_be_visible()
        assert narrow_page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "360px storage primer overflows"
        narrow.close()

        context = browser.new_context(java_script_enabled=False)
        mock_version(context)
        page = context.new_page()
        page.goto(URL)
        expect(page.locator(".roadmap h3")).to_have_count(13)
        expect(page.locator("#simulator")).to_have_count(0)
        expect(page.locator('.architecture-layer')).to_have_count(0)
        page.locator('.sidebar nav').get_by_role('link',name='GPU map',exact=True).click()
        for component in ['gpu','sm-0','block-a']:
            page.locator('#'+component+' > summary').click()
        expect(page.locator('#block-a')).to_contain_text('stays on this SM')
        page.goto(URL + "lessons/memory.html")
        expect(page.locator("noscript .notice")).to_be_visible()
        expect(page.locator("noscript .notice")).to_contain_text("Enable JavaScript")
        expect(page.locator("h1")).to_have_text("Reading a tensor")
        expect(page.locator(".storage-primer")).to_be_visible()
        expect(page.locator(".storage-primer-memory .storage-primer-value")).to_have_count(8)
        expect(page.locator("#lab .concepts")).to_be_visible()
        expect(page.locator("#lab .concepts dt")).to_have_count(4)
        expect(page.locator("#lab .concepts-lane")).to_have_count(32)
        expect(page.locator(".stride-example")).to_have_count(2)
        expect(page.locator(".view-copy-comparison")).to_be_visible()
        expect(page.locator(".sector-comparison")).to_be_visible()
        expect(page.locator("#tensor-diagram .tensor-cell")).to_have_count(32)
        expect(page.locator("#tensor-slice-diagram .tensor-cell")).to_have_count(32)
        expect(page.locator("#tensor-step-summary")).to_contain_text("8 elements × 4 bytes = 32 bytes")
        context.close()
        check_lessons(browser, URL, ROOT, errors)
        check_remaining(browser, URL, ROOT, errors)
        check_version(browser, URL)
        check_navigation(browser, URL, ROOT, errors)
        check_overview(browser, URL, ROOT, errors)
        check_kernel(browser, URL, ROOT, errors)
        check_hello(browser, URL, ROOT, errors)
        check_book_opening(browser, URL, ROOT, errors)
        check_reference_practice(browser, URL, ROOT)
        check_desktop(browser, URL, ROOT)
        browser.close()
        assert not errors, errors
        print("PASS: no JavaScript errors; course content available without JavaScript")
finally:
    server.terminate()
    server.wait(timeout=5)
