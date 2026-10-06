const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  await page.goto("http://localhost:4173/acoflex-website/", { waitUntil: "load" });

  await page.evaluate(() => {
    window.tickCount = 0;
    setInterval(() => window.tickCount++, 100);
  });

  const menuBtn = page.locator('button[aria-label="Open navigation"]');
  await menuBtn.dispatchEvent("click");

  await page.waitForTimeout(1000);

  const ticks = await page.evaluate(() => window.tickCount).catch((e) => e.message);
  console.log("Ticks after open:", ticks);

  const closeBtn = page.locator('button[aria-label="Close navigation"]');
  await closeBtn.dispatchEvent("click");

  await page.waitForTimeout(1000);

  const ticks2 = await page.evaluate(() => window.tickCount).catch((e) => e.message);
  console.log("Ticks after close:", ticks2);

  await browser.close();
})();
