"""Scheme Connect browser smoke tests.

Run with the dev server up:  python3 tests/smoke_test.py [base_url]
"""
import asyncio, re, sys
from playwright.async_api import async_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
results = []


async def check(name, fn, page):
    try:
        await fn(page)
        results.append((name, True, ""))
    except Exception as e:  # noqa: BLE001
        results.append((name, False, str(e).splitlines()[0] + " @ " + page.url + " " + " ".join(str(e).splitlines()[1:4])))


async def go(page, path):
    await page.goto(BASE + path, wait_until="networkidle")


async def navigation(page):
    await go(page, "/")
    await page.wait_for_url("**/dashboard")
    nav = page.get_by_role("navigation", name="Main navigation")
    for label, path in [("Find Schemes", "/schemes"), ("Eligibility Checker", "/eligibility"),
                        ("Recommended for You", "/recommended"), ("Saved Schemes", "/saved"),
                        ("Notifications", "/notifications"), ("My Profile", "/profile"),
                        ("Help & Support", "/help"), ("AI Assistant", "/assistant"), ("Dashboard", "/dashboard")]:
        await nav.get_by_role("link", name=re.compile("^" + re.escape(label))).click(timeout=8000)
        await page.wait_for_url("**" + path + "*")
        await expect(page.locator("main")).to_have_count(1)


async def search_filters(page):
    await go(page, "/schemes")
    count = page.get_by_text("schemes found")
    await expect(count).to_contain_text("100")
    search = page.get_by_placeholder("Search schemes, benefits or departments...")
    await search.fill("kisan credit")
    await expect(count).to_contain_text("1")
    await expect(page.get_by_role("heading", name="Kisan Credit Card").first).to_be_visible()
    await page.get_by_role("button", name="Clear search").click()
    await search.fill("zzzz-nothing")
    await expect(page.get_by_text("No schemes found")).to_be_visible()
    await page.get_by_role("button", name="Clear all").click()
    await expect(count).to_contain_text("100")


async def saving(page):
    await go(page, "/schemes")
    await page.evaluate("localStorage.setItem('km-saved','[]')")
    await page.reload(wait_until="networkidle")
    await page.get_by_role("button", name="Save scheme").first.click()
    await expect(page.get_by_role("button", name="Remove saved scheme")).to_have_count(1)
    await go(page, "/saved")
    await expect(page.get_by_role("button", name="Remove saved scheme")).to_have_count(1)
    await page.get_by_role("button", name="Remove saved scheme").click()
    await expect(page.get_by_role("button", name="Remove saved scheme")).to_have_count(0)


async def language(page):
    await go(page, "/dashboard")
    await page.get_by_role("button", name="Change language").last.click()
    await page.get_by_role("menuitem", name="हिन्दी").click()
    await expect(page.get_by_role("navigation", name="Main navigation").get_by_role("link", name="योजनाएँ खोजें")).to_be_visible()
    await page.reload(wait_until="networkidle")
    await expect(page.locator("html")).to_have_attribute("lang", "hi")
    await page.get_by_role("button", name="Change language").last.click()
    await page.get_by_role("menuitem", name="English").click()
    await expect(page.get_by_role("navigation", name="Main navigation").get_by_role("link", name="Find Schemes")).to_be_visible()


async def eligibility(page):
    await go(page, "/eligibility")
    for _ in range(3):
        await page.get_by_role("button", name="Continue").click()
    await page.get_by_role("button", name="Analyze Eligibility").click()
    await expect(page.get_by_role("heading", name="Eligibility Analysis Complete")).to_be_visible()
    for status in ["Eligible", "Potentially Eligible", "Not Eligible"]:
        await expect(page.get_by_text(status, exact=True).first).to_be_visible()
    await page.get_by_role("link", name="View Scheme").first.click()
    await page.wait_for_url("**/schemes/*")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, fn in [("navigation", navigation), ("search & filters", search_filters),
                         ("saving schemes", saving), ("language switching", language),
                         ("eligibility wizard", eligibility)]:
            ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
            await check(name, fn, await ctx.new_page())
            await ctx.close()
        await browser.close()
    for name, ok, err in results:
        print(("PASS " if ok else "FAIL ") + name + ("" if ok else " — " + err))
    sys.exit(0 if all(r[1] for r in results) else 1)


asyncio.run(main())
