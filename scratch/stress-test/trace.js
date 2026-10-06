const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();

  await page.goto("https://chinmay999-debug.github.io/acoflex-website/", { waitUntil: "load" });
  const menuBtn = page.locator('button[aria-label="Open navigation"]');
  await menuBtn.dispatchEvent("click");

  await page.waitForTimeout(2000);

  await context.tracing.stop({ path: "scratch/stress-test/trace.zip" });
  await browser.close();
})();
