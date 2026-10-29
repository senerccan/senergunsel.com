"""Render the social card and the PNG icons from their sources.

Run with the local dev server up (npx wrangler dev --port 8787):
    python3 scripts/render-images.py
Writes public/assets/img/og-card.png, the project cards (og-melbourne-site-tiering.png,
og-store-rollout-model.png, og-same-store-two-streets.png, og-web-catcher.png, og-vans-capstone.png,
og-under-armour-flagship.png), the Express lane and Director's Cut cards (og-express.png,
og-directors-cut.png), public/favicon-32.png, public/apple-touch-icon.png, public/icon-192.png and
public/icon-512.png.

Two cards carry drawings from the site itself: the isometric store from the Under Armour case study
and the ground floor plan from the home page. They are captured from the dev server first (light
theme, reduced motion, 2x) and served to the templates at /__og-src/<name>.png, so the cards always
match the pages.
"""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
BASE = "http://127.0.0.1:8787"


def serve(body):
    # One argument only: Playwright passes the request too if the handler takes two.
    async def handler(route):
        await route.fulfill(status=200, content_type="text/html", body=body)
    return handler


def serve_drawing(drawings):
    async def handler(route):
        name = route.request.url.rsplit("/", 1)[1]
        await route.fulfill(status=200, content_type="image/png", body=drawings[name])
    return handler


async def capture_drawings(browser):
    """The isometric store and the ground floor plan, as the pages draw them."""
    context = await browser.new_context(viewport={"width": 1440, "height": 1000}, device_scale_factor=2,
                                        reduced_motion="reduce", color_scheme="light")
    await context.add_init_script("try{localStorage.setItem('scg.theme','open')}catch(e){}")
    page = await context.new_page()

    await page.goto(BASE + "/projects/under-armour-flagship/", wait_until="networkidle")
    await page.wait_for_selector("[data-stage] svg")
    await page.wait_for_timeout(800)
    store = await (await page.query_selector("[data-stage] svg")).screenshot()

    # The plan without the heat map, the pointer or a dwell label half way through its fade.
    await page.goto(BASE + "/", wait_until="networkidle")
    await page.wait_for_selector("#floor-stage > *")
    heat = await page.query_selector("#heat-toggle")
    if heat and (await heat.get_attribute("aria-pressed")) == "true":
        await heat.click()
    await page.mouse.move(2, 2)
    await page.add_style_tag(content=".zl-dwell{display:none!important}")
    await page.wait_for_timeout(900)
    plan = await (await page.query_selector("#floor-stage")).screenshot()

    await context.close()
    return {"ua-store.png": store, "floor-plan.png": plan}


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        drawings = await capture_drawings(browser)

        # Social cards: the store's own, then one per project that has a template, then the
        # Express lane and the Director's Cut.
        for template_name, out_name in [("og-card.html", "og-card.png"), ("og-melbourne-site-tiering.html", "og-melbourne-site-tiering.png"),
                                        ("og-store-rollout-model.html", "og-store-rollout-model.png"),
                                        ("og-same-store-two-streets.html", "og-same-store-two-streets.png"),
                                        ("og-web-catcher.html", "og-web-catcher.png"),
                                        ("og-vans-capstone.html", "og-vans-capstone.png"),
                                        ("og-under-armour-flagship.html", "og-under-armour-flagship.png"),
                                        ("og-express.html", "og-express.png"),
                                        ("og-directors-cut.html", "og-directors-cut.png")]:
            page = await browser.new_page(viewport={"width": 1200, "height": 630})
            template = (ROOT / "scripts" / template_name).read_text()
            await page.route("**/__og-card", serve(template))
            await page.route("**/__og-src/*", serve_drawing(drawings))
            await page.goto(BASE + "/__og-card", wait_until="networkidle")
            await page.evaluate("document.fonts.ready")
            await page.wait_for_timeout(300)
            await page.screenshot(path=str(PUBLIC / "assets" / "img" / out_name))
            await page.close()

        svg = (PUBLIC / "favicon.svg").read_text()
        for name, size, pad in [("favicon-32.png", 32, 0), ("apple-touch-icon.png", 180, 0), ("icon-192.png", 192, 0), ("icon-512.png", 512, 0)]:
            page = await browser.new_page(viewport={"width": size, "height": size})
            html = f"<html><body style='margin:0;background:#121211'><div style='width:{size}px;height:{size}px'>{svg.replace('<svg ', f'<svg width={size} height={size} ', 1)}</div></body></html>"
            await page.set_content(html)
            await page.screenshot(path=str(PUBLIC / name), omit_background=False)
            await page.close()

        await browser.close()
    print("rendered the social cards and icons")


asyncio.run(main())
