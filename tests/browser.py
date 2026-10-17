# Copyright © 2026 Christopher Snow.
"""Browser checks against the built course, including the GitHub Pages subpath."""
import os
from pathlib import Path
import subprocess
import time
from urllib.request import urlopen

from playwright.sync_api import sync_playwright, expect
from new_lessons import check_lessons

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
                page = context.new_page()
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
                page.goto(URL)
                expect(page.locator("html")).to_have_attribute("data-theme", theme)
                expect(page.locator("#results")).to_be_hidden()
                expect(page.locator("#lanes button")).to_have_count(32)
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
                page.get_by_role("button", name="Inspect without guessing").click()
                expect(page.locator("#sector-count")).to_have_text("5")
                page.locator("#active").select_option("8")
                page.get_by_role("button", name="Inspect without guessing").click()
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
                page.locator("#inspect").click()
                page.screenshot(path=str(ROOT / f"test-results/{width}-{theme}.png"), full_page=True)
                response = context.request.get(URL + "examples/gather.cu")
                assert response.ok and "cudaGetLastError" in response.text()
                context.close()
                print(f"PASS: {width}px, {theme} theme; prediction, reset, lane selection, CUDA, no overflow")

        context = browser.new_context(java_script_enabled=False)
        page = context.new_page()
        page.goto(URL)
        expect(page.locator("noscript .notice")).to_be_visible()
        expect(page.locator("noscript .notice")).to_contain_text("Enable JavaScript")
        expect(page.locator(".roadmap h3")).to_have_count(8)
        context.close()
        check_lessons(browser, URL, ROOT, errors)
        browser.close()
        assert not errors, errors
        print("PASS: no JavaScript errors; course content available without JavaScript")
finally:
    server.terminate()
    server.wait(timeout=5)
