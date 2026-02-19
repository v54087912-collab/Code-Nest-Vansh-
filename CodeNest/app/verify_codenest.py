import sys
from playwright.sync_api import sync_playwright
import time
import os

SCREENSHOT_DIR = "CodeNest/app/verification_screenshots_v3"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def run():
    print("Starting CodeNest Verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"JS ERROR: {err}"))

        # Mock prompt
        page.add_init_script("""
            window.prompt = (msg) => {
                if (msg && msg.includes('Project Name')) return 'TestProject';
                return 'file.py';
            };
            window.alert = (msg) => console.log('ALERT:', msg);
        """)

        print("1. Loading App...")
        page.goto("http://localhost:8080")

        # Verify Home Screen
        try:
            page.wait_for_selector("#view-home", state="visible", timeout=5000)
            title = page.inner_text("h1")
            print(f"Found Title: {title}")
            if "CodeNest" not in title:
                print("FAIL: Title mismatch")
                sys.exit(1)
        except Exception as e:
            print(f"FAIL: Home screen not visible. {e}")
            sys.exit(1)

        print("2. Creating New Project...")
        page.click("#btn-new-project")

        # Verify Editor Screen
        try:
            page.wait_for_selector("#view-editor", state="visible", timeout=10000)
            # Wait for transition
            time.sleep(1)
            filename = page.inner_text("#current-filename")
            print(f"Editor Open. File: {filename}")
            if "main.py" not in filename:
                print("FAIL: Filename mismatch")

            # Check for Monaco
            if page.is_visible(".monaco-editor"):
                print("PASS: Monaco Editor detected")
            else:
                print("FAIL: Monaco Editor not found (might still be loading)")

        except Exception as e:
            print(f"FAIL: Editor screen not visible. {e}")
            sys.exit(1)

        print("3. Checking UI Elements...")
        # Check FAB
        if page.is_visible("#btn-run-floating"):
            print("PASS: Run Button Visible")
        else:
            print("FAIL: Run Button Missing")

        # Open Sidebar
        print("4. Opening Sidebar...")
        page.click("#btn-toggle-files")
        time.sleep(1) # Wait for animation

        # Check class to confirm it's not hidden (off-canvas logic: remove -translate-x-full)
        classes = page.get_attribute("#panel-files", "class")
        if "-translate-x-full" not in classes:
             print("PASS: Sidebar Opened")
        else:
             print(f"FAIL: Sidebar did not open. Classes: {classes}")

        # Close sidebar to avoid overlapping (click on the right side)
        page.click("#overlay-files", position={"x": 350, "y": 200})
        time.sleep(0.5)

        print("5. Checking Toolbar and Settings...")
        if page.is_visible("#toolbar-keyboard"):
             print("PASS: Toolbar Visible")
        else:
             print("FAIL: Toolbar Missing")

        # Open Settings
        page.click("#btn-settings")
        time.sleep(1)
        if page.is_visible("#modal-settings"):
             print("PASS: Settings Modal Opened")
        else:
             print("FAIL: Settings Modal Missing")

        # Screenshot
        path = f"{SCREENSHOT_DIR}/codenest_verification.png"
        page.screenshot(path=path)
        print(f"Screenshot saved: {path}")

        browser.close()

if __name__ == "__main__":
    run()
