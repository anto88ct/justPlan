const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createContext({
    colorScheme: 'dark'
  });
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
    console.log('✅ App loaded');

    // Wait for the app to render
    await page.waitForSelector('app-root', { timeout: 10000 });

    // Try to find and click settings button
    // Looking for the impostazioni menu item
    const settingsBtn = await page.locator('text=Impostazioni').first();

    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      console.log('✅ Clicked settings button');

      // Wait for settings view to render
      await page.waitForTimeout(1000);

      // Get information about the settings section
      const heading = await page.locator('h1:has-text("Impostazioni")').first();
      const headingColor = await heading.evaluate((el) => window.getComputedStyle(el).color);
      console.log(`📊 Heading color: ${headingColor}`);

      // Check section cards
      const cards = await page.locator('[class*="bg-white"][class*="dark:bg-zinc-900"]').all();
      console.log(`📊 Found ${cards.length} section cards`);

      // Check a card's computed style
      if (cards.length > 0) {
        const firstCard = cards[0];
        const cardBg = await firstCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        const cardBorder = await firstCard.evaluate((el) => window.getComputedStyle(el).borderColor);
        console.log(`📊 Card background: ${cardBg}`);
        console.log(`📊 Card border: ${cardBorder}`);
      }

      // Check toggle buttons
      const toggles = await page.locator('button[class*="rounded-full"]').all();
      console.log(`📊 Found ${toggles.length} toggle buttons`);

      if (toggles.length > 0) {
        const firstToggle = toggles[0];
        const toggleBg = await firstToggle.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        console.log(`📊 Toggle background: ${toggleBg}`);
      }

      // Take screenshots in dark mode
      await page.screenshot({ path: 'dark-mode-settings.png', fullPage: true });
      console.log('📸 Screenshot saved: dark-mode-settings.png');

    } else {
      console.log('❌ Could not find settings button');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
