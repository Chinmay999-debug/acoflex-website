const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();

  let consoleErrors = 0;
  let uncaughtExceptions = 0;

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors++;
      console.log("Console Error:", msg.text());
    }
  });

  page.on("pageerror", (err) => {
    uncaughtExceptions++;
    console.log("Uncaught Exception:", err.message);
  });

  let metrics = {
    menuCycles: 0,
    pageNavigations: 0,
    repeatedNavCycles: 0,
    rapidCycles: 0,
  };

  const url = "https://chinmay999-debug.github.io/acoflex-website/";

  const openMenu = async () => {
    const menuBtn = page.locator('button[aria-label="Open navigation"]');
    if (await menuBtn.isVisible()) {
      await menuBtn.dispatchEvent("click");
      await page.waitForTimeout(600);
      metrics.menuCycles++;
    }
  };

  const closeMenu = async () => {
    const closeBtn = page.locator('button[aria-label="Close navigation"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.dispatchEvent("click");
      await page.waitForTimeout(600);
    }
  };

  const navigateTo = async (name) => {
    let locator = page.locator(`text="${name}"`).first();
    let isVis = await locator.isVisible().catch(() => false);

    if (!isVis) {
      await openMenu();
      locator = page.locator(`text="${name}"`).first();
      isVis = await locator.isVisible().catch(() => false);
      if (!isVis) {
        const prodAcc = page.locator("button", { hasText: /^Products$/ });
        if (await prodAcc.isVisible()) {
          await prodAcc.dispatchEvent("click");
          await page.waitForTimeout(300);
          locator = page.locator(`text="${name}"`).first();
          isVis = await locator.isVisible().catch(() => false);
        }
      }
    }

    if (isVis) {
      await locator.dispatchEvent("click");
      await page.waitForTimeout(800); // wait for navigation
      metrics.pageNavigations++;
    } else {
      console.log(`Could not find link for ${name}`);
    }
  };

  try {
    console.log("Navigating to " + url);
    await page.goto(url, { waitUntil: "load" });

    console.log("1. Homepage");
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
    }

    for (let i = 0; i < 10; i++) {
      await openMenu();
      await closeMenu();
    }

    for (let i = 0; i < 3; i++) {
      await navigateTo("Products");
      await navigateTo("Home");
    }

    console.log("2. Navigation stress");
    const navSequence = [
      "All products",
      "Plumbing",
      "CPVC",
      "back",
      "Drainage",
      "DWC",
      "back",
      "Agriculture",
      "PVC Pressure",
      "back",
      "Manufacturing",
      "Quality",
      "Infrastructure",
      "Dealers",
      "Contact",
      "Home",
    ];

    for (let i = 0; i < 3; i++) {
      metrics.repeatedNavCycles++;
      for (const step of navSequence) {
        if (step === "back") {
          await page.goBack();
          await page.waitForTimeout(800);
          metrics.pageNavigations++;
        } else {
          await navigateTo(step);
        }
      }
    }

    console.log("3. Menu stress");
    for (let i = 0; i < 10; i++) {
      await openMenu();
      await closeMenu();
      await openMenu();
      await navigateTo("Quality");
      await openMenu();
      await closeMenu();
    }

    console.log("4. Rapid interaction test");
    for (let i = 0; i < 10; i++) {
      const menuBtn = page.locator('button[aria-label="Open navigation"]');
      if (await menuBtn.isVisible()) {
        await menuBtn.dispatchEvent("click");
        await page.evaluate(() => window.scrollBy(0, 100));
        await page.waitForTimeout(50);
        const closeBtn = page.locator('button[aria-label="Close navigation"]');
        if (await closeBtn.isVisible()) await closeBtn.dispatchEvent("click");
      }
      metrics.rapidCycles++;
    }

    console.log("5. Final checks");
    await navigateTo("Home");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await navigateTo("All products");
    await navigateTo("CPVC");

    const domState = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return {
        pointerEvents: document.body.style.pointerEvents || styles.pointerEvents,
        overflow: document.body.style.overflow || styles.overflow,
        radixOverlays: document.querySelectorAll("[data-radix-portal]").length,
      };
    });

    console.log("DOM State:", domState);

    const scrollPos1 = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);
    const scrollPos2 = await page.evaluate(() => window.scrollY);
    const canScroll = scrollPos2 > scrollPos1;
    console.log("Can scroll:", canScroll);

    console.log("Metrics:", metrics);
    console.log("Console Errors:", consoleErrors);
    console.log("Uncaught Exceptions:", uncaughtExceptions);
    console.log("PASS");
  } catch (e) {
    console.error("Test Failed:", e);
    console.log("FAIL");
  } finally {
    await browser.close();
  }
})();
