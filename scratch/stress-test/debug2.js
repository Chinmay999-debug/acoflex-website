const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("https://chinmay999-debug.github.io/acoflex-website/");

  await page.waitForTimeout(2000);

  const menuBtn = page.locator('button[aria-label="Open navigation"]');
  console.log("Dispatching click event...");
  await menuBtn.dispatchEvent("click");
  console.log("Dispatched successfully");

  await page.waitForTimeout(2000);

  const domState = await page.evaluate(() => {
    const styles = window.getComputedStyle(document.body);
    return {
      pointerEvents: document.body.style.pointerEvents || styles.pointerEvents,
      overflow: document.body.style.overflow || styles.overflow,
    };
  });
  console.log("DOM state after click:", domState);

  await browser.close();
})();
