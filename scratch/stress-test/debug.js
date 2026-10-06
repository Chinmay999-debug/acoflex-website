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

  const domState = await page.evaluate(() => {
    const styles = window.getComputedStyle(document.body);
    return {
      pointerEvents: document.body.style.pointerEvents || styles.pointerEvents,
      overflow: document.body.style.overflow || styles.overflow,
    };
  });
  console.log("Initial DOM state:", domState);

  const menuBtn = page.locator('button[aria-label="Open navigation"]');
  console.log("Menu button visible?", await menuBtn.isVisible());

  try {
    await menuBtn.click({ timeout: 5000 });
    console.log("Clicked successfully");
  } catch (e) {
    console.log("Failed to click:", e.message);
  }

  await browser.close();
})();
