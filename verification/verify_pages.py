import os
from playwright.sync_api import sync_playwright

def verify_pages():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        url = "http://localhost:8080/index.html"

        print(f"Navigating to {url}")
        page.goto(url)

        # 1. Landing Page
        print("Taking Landing Page screenshot...")
        try:
            page.wait_for_selector("h1", timeout=10000)
        except Exception as e:
            print("Timeout waiting for h1. Dumping page content:")
            print(page.content())
            raise e

        page.screenshot(path="verification/landing_page.png", full_page=True)

        # 2. Sign In Page
        print("Navigating to Sign In...")
        page.evaluate("window.location.hash = '/signin'")
        page.wait_for_selector("h2:text('Sign In')")
        page.screenshot(path="verification/signin_page.png", full_page=True)

        # 3. Dashboard (Simulate Login)
        print("Simulating Login to Dashboard...")
        page.evaluate("window.authLogin()")
        page.wait_for_selector("h1:text('Good morning')")
        page.screenshot(path="verification/dashboard_page.png", full_page=True)

        # 4. Sign Up Page (Logout first)
        print("Logging out...")
        page.evaluate("window.authLogout()")
        print("Navigating to Sign Up...")
        page.evaluate("window.location.hash = '/signup'")
        page.wait_for_selector("h2:text('Create Account')")
        page.screenshot(path="verification/signup_page.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_pages()
