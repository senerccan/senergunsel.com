"""Render the social card and the PNG icons from their sources.

Run with the local dev server up (npx wrangler dev --port 8787):
    python3 scripts/render-images.py
Writes public/assets/img/og-card.png, the project cards (og-melbourne-site-tiering.png,
og-store-rollout-model.png, og-same-store-two-streets.png),
public/favicon-32.png, public/apple-touch-icon.png, public/icon-192.png and public/icon-512.png.
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


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()

        # Social cards: the store's own, then one per project that has a template.
        for template_name, out_name in [("og-card.html", "og-card.png"), ("og-melbourne-site-tiering.html", "og-melbourne-site-tiering.png"),
                                        ("og-store-rollout-model.html", "og-store-rollout-model.png"),
                                        ("og-same-store-two-streets.html", "og-same-store-two-streets.png")]:
            page = await browser.new_page(viewport={"width": 1200, "height": 630})
            template = (ROOT / "scripts" / template_name).read_text()
            await page.route("**/__og-card", serve(template))
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
    print("rendered og-card and icons")


asyncio.run(main())
