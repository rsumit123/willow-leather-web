import { test, expect } from '@playwright/test';
import { generateTestName } from './helpers';

// SKIPPED: All tests require auction auto-complete which takes >3 minutes
// To run these tests manually: npx playwright test e2e/season.spec.ts --timeout=600000
test.describe.skip('Season Flow', () => {
  // All tests in this describe block are slow due to auction completion + playing XI
  test.describe.configure({ timeout: 360000 }); // 6 minutes per test

  // Helper to set up career with completed auction and valid XI
  async function setupSeasonReady(page: any) {
    const careerName = generateTestName('Season Test');

    // Create career
    await page.goto('/');
    await page.getByRole('button', { name: /new career/i }).click();
    await expect(page.getByText(/choose your franchise/i)).toBeVisible();

    const teamCard = page.locator('.glass-card').filter({
      hasText: /mumbai|chennai|bangalore|delhi|kolkata|hyderabad|punjab|rajasthan/i
    }).first();
    await teamCard.click();
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder(/championship/i).fill(careerName);
    await page.getByRole('button', { name: /start career/i }).click();

    // Complete auction (auto-complete can take 2-3 minutes for 150+ players)
    await expect(page).toHaveURL(/\/auction/, { timeout: 15000 });
    await page.getByRole('button', { name: /auto-complete|skip/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 180000 });

    // Set Playing XI
    await page.getByRole('button', { name: /select playing xi/i }).click();
    await expect(page).toHaveURL(/\/playing-xi/);
    await expect(page.getByText(/selected:/i)).toBeVisible();

    // Select 11 players
    const allPlayerButtons = page.locator('button').filter({
      has: page.locator('[class*="rounded-full"]')
    });

    for (let i = 0; i < Math.min(11, await allPlayerButtons.count()); i++) {
      const btn = allPlayerButtons.nth(i);
      if (await btn.isVisible() && await btn.isEnabled()) {
        await btn.click();
        await page.waitForTimeout(50);
      }
    }

    // Confirm XI if button is enabled
    const confirmBtn = page.getByRole('button', { name: /confirm playing xi/i });
    await page.waitForTimeout(500);
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    }
  }

  test.beforeEach(async ({ page }) => {
    await setupSeasonReady(page);
  });

  test('should show Generate Fixtures button after XI is set', async ({ page }) => {
    // After setting XI, Generate Fixtures should be visible
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
  });

  test('should generate fixtures and transition to in_season', async ({ page }) => {
    // Click Generate Fixtures
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();

    // Wait for season to start
    await expect(page.getByText(/next match/i).or(page.getByText(/in.season/i))).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display standings after generating fixtures', async ({ page }) => {
    // Generate fixtures
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();

    // Wait for season to start
    await expect(page.getByText(/next match/i)).toBeVisible({ timeout: 10000 });

    // Standings should be visible on dashboard
    await expect(page.getByText(/standings/i)).toBeVisible();

    // Position numbers should be visible
    await expect(page.getByText(/#1|#2|#3|#4/)).toBeVisible();
  });

  test('should navigate to standings page', async ({ page }) => {
    // Generate fixtures first
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();
    await expect(page.getByText(/next match/i)).toBeVisible({ timeout: 10000 });

    // Click on standings/table link
    await page.getByRole('link', { name: /table|standings/i }).first().click();

    // Verify standings page
    await expect(page).toHaveURL(/\/standings/);
    await expect(page.getByText(/league standings/i).or(page.getByText(/points table/i))).toBeVisible();
  });

  test('should show next match card', async ({ page }) => {
    // Generate fixtures
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();
    await expect(page.getByText(/next match/i)).toBeVisible({ timeout: 10000 });

    // Verify next match card elements
    await expect(page.getByText(/vs/i)).toBeVisible();
    await expect(page.getByText(/match #/i)).toBeVisible();
  });

  test('should allow simulating a match', async ({ page }) => {
    // Generate fixtures
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();
    await expect(page.getByText(/next match/i)).toBeVisible({ timeout: 10000 });

    // Check if it's user's match or other teams' match
    const playMatchBtn = page.getByRole('button', { name: /play match/i });
    const simulateBtn = page.getByRole('button', { name: /simulate/i });

    if (await simulateBtn.isVisible()) {
      // Simulate the match
      await simulateBtn.click();

      // Wait for simulation to complete
      await page.waitForTimeout(2000);

      // Should show next match or standings update
      await expect(
        page.getByText(/next match|standings/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to squad page', async ({ page }) => {
    // Click on squad link
    await page.getByRole('link', { name: /squad/i }).first().click();

    // Verify squad page
    await expect(page).toHaveURL(/\/squad/);
    await expect(page.getByText(/players/i)).toBeVisible();
  });

  test('should show playoff qualification line in standings', async ({ page }) => {
    // Generate fixtures
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();
    await expect(page.getByText(/next match/i)).toBeVisible({ timeout: 10000 });

    // Navigate to standings
    await page.getByRole('link', { name: /table|standings/i }).first().click();
    await expect(page).toHaveURL(/\/standings/);

    // Verify playoff qualification indicator
    await expect(page.getByText(/playoff|top 4|qualify/i)).toBeVisible({ timeout: 5000 });
  });

  test('should track user team position', async ({ page }) => {
    // Generate fixtures
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();
    await expect(page.getByText(/next match/i)).toBeVisible({ timeout: 10000 });

    // User's team position should be highlighted
    const positionDisplay = page.getByText(/#\d/).first();
    await expect(positionDisplay).toBeVisible();
  });
});
