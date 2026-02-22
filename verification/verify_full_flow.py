from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        # Log browser console messages
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            # 1. Start at Landing
            print("1. Navigating to Landing Page...")
            # Use relative path if possible, but the original script used localhost:8080
            # I should verify if a server is running. The previous agent likely started one?
            # If not, I should use file:// or start one.
            # Assuming server is running on 8080 from previous steps or context.
            # But wait, I don't see any `python -m http.server` in my memory or recent history.
            # I should probably start one to be safe, or just use file:// path.
            # The original script used localhost:8080.

            # Let's try to just open index.html directly using file protocol to be safe and robust.
            import os
            cwd = os.getcwd()
            index_path = f"file://{cwd}/index.html"

            page.goto(index_path)
            page.wait_for_selector("text=CodeSphere")
            page.screenshot(path="verification/1_landing.png")

            # 2. Login
            print("2. Logging in...")
            # Click Sign In link
            page.click("text=Sign In")

            # Wait for Sign In form
            page.wait_for_selector("text=Welcome back")

            # Fill form (mock login doesn't check credentials, just submit)
            page.fill("input[type=email]", "test@example.com")
            page.fill("input[type=password]", "password")
            page.click("button:has-text('Sign In →')")

            # Wait for Dashboard
            page.wait_for_selector("text=Good morning")
            page.screenshot(path="verification/2_dashboard.png")

            # 3. Roadmap
            print("3. Navigating to Roadmap...")
            # Ensure the link is visible and clickable
            page.wait_for_selector("a[href='#/roadmap']")
            page.click("a[href='#/roadmap']")

            # Wait for Roadmap View
            page.wait_for_selector("text=Python Roadmap")
            page.screenshot(path="verification/3_roadmap.png")

            # 4. Topic
            print("4. Navigating to Topic...")
            # Click the first available topic
            page.click("text=What is Python?")
            page.wait_for_selector("text=In this lesson")
            page.screenshot(path="verification/4_topic.png")

            # 5. Challenges
            print("5. Navigating to Challenges...")
            page.goto(f"{index_path}#/challenges")
            page.wait_for_selector("text=Python Challenges")
            page.screenshot(path="verification/5_challenges.png")

            # 6. Single Challenge
            print("6. Navigating to Single Challenge...")
            # Click the button for the first challenge (c1)
            # Since user has solved c1, the text is 'Solve Again'
            # We can use the href selector to be specific
            page.click("a[href='#/challenge/c1']")
            page.wait_for_selector("text=Problem Description")
            page.screenshot(path="verification/6_single_challenge.png")

            # 7. Battles
            print("7. Navigating to Battles...")
            page.goto(f"{index_path}#/battles")
            page.wait_for_selector("text=Battle Arena")
            page.screenshot(path="verification/7_battles.png")

            # 8. Games (Type Race)
            print("8. Navigating to Type Race...")
            page.goto(f"{index_path}#/game/type-race")
            page.wait_for_selector("text=Type Race")
            page.screenshot(path="verification/8_type_race.png")

            # 9. Store
            print("9. Navigating to Store...")
            page.goto(f"{index_path}#/store")
            page.wait_for_selector("text=CodeCoin Store")
            page.screenshot(path="verification/9_store.png")

            # 10. Profile
            print("10. Navigating to Profile...")
            page.goto(f"{index_path}#/profile")
            page.wait_for_selector("text=XP Earned")
            page.screenshot(path="verification/10_profile.png")

            # 11. Leaderboard
            print("11. Navigating to Leaderboard...")
            page.goto(f"{index_path}#/leaderboard")
            page.wait_for_selector("text=Global Leaderboard")
            page.screenshot(path="verification/11_leaderboard.png")

            print("✅ All checks passed!")

        except Exception as e:
            print(f"❌ Verification failed: {e}")
            print(f"Current URL: {page.url}")
            page.screenshot(path="verification/failure.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
