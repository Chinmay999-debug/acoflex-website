const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  await page.goto("https://chinmay999-debug.github.io/acoflex-website/", { waitUntil: "load" });
  console.log("Loaded");

  const menuBtn = page.locator('button[aria-label="Open navigation"]');
  console.log("Clicking menu...");
  await menuBtn.dispatchEvent("click");
  console.log("Clicked open");

  await page.waitForTimeout(600);

  console.log("Evaluating JS...");
  const res = await Promise.race([
    page.evaluate(() => 1 + 1),
    new Promise((r) => setTimeout(() => r("TIMEOUT"), 5000)),
  ]);

  console.log("Eval result:", res);

  const closeBtn = page.locator('button[aria-label="Close navigation"]');
  console.log("Clicking close...");
  await closeBtn.dispatchEvent("click");
  console.log("Clicked close");

  await page.waitForTimeout(600);

  console.log("Evaluating JS again...");
  const res2 = await Promise.race([
    page.evaluate(() => 1 + 1),
    new Promise((r) => setTimeout(() => r("TIMEOUT"), 5000)),
  ]);

  console.log("Eval result 2:", res2);

  await browser.close();
})();
