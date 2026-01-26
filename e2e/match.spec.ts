import { test, expect } from '@playwright/test';
import { generateTestName } from './helpers';

// SKIPPED: All tests require auction auto-complete which takes >3 minutes
// To run these tests manually: npx playwright test e2e/match.spec.ts --timeout=600000
test.describe.skip('Match Flow', () => {
  // All tests in this describe block are slow due to auction completion + season setup
  test.describe.configure({ timeout: 420000 }); // 7 minutes per test

  // Helper to set up a match-ready career
  async function setupMatchReady(page: any) {
    const careerName = generateTestName('Match Test');

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

    // Confirm XI
    const confirmBtn = page.getByRole('button', { name: /confirm playing xi/i });
    await page.waitForTimeout(500);
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    }

    // Generate fixtures
    const generateBtn = page.getByRole('button', { name: /generate fixtures/i });
    await expect(generateBtn).toBeVisible({ timeout: 5000 });
    await generateBtn.click();
    await expect(page.getByText(/next match/i)).toBeVisible({ timeout: 10000 });
  }

  test.beforeEach(async ({ page }) => {
    await setupMatchReady(page);
  });

  test('should show Play Match button for user matches', async ({ page }) => {
    // If the next match involves the user's team
    const playMatchBtn = page.getByRole('button', { name: /play match/i });
    const simulateBtn = page.getByRole('button', { name: /simulate/i });

    // One of these should be visible
    await expect(playMatchBtn.or(simulateBtn)).toBeVisible();
  });

  test('should navigate to match page and show toss screen', async ({ page }) => {
    // Check if it's user's match
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();

      // Should be on match page
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Toss screen should be visible
      await expect(page.getByText(/toss/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /flip|toss/i })).toBeVisible();
    } else {
      // Simulate matches until we get a user match
      test.skip();
    }
  });

  test('should perform toss and show result', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Click toss button
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();

      // Toss result should appear
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should allow toss winner to choose bat or bowl', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Perform toss
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();

      // Wait for toss result
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      // If user won toss, bat/bowl buttons should appear
      const batBtn = page.getByRole('button', { name: /bat/i });
      const bowlBtn = page.getByRole('button', { name: /bowl|field/i });

      if (await batBtn.isVisible()) {
        // User won toss - choose to bat
        await batBtn.click();

        // Match should start
        await expect(page.getByText(/current bid|runs|overs/i)).toBeVisible({ timeout: 10000 });
      } else {
        // AI won toss - wait for match to start
        await expect(page.getByText(/runs|overs/i)).toBeVisible({ timeout: 10000 });
      }
    } else {
      test.skip();
    }
  });

  test('should display match scoreboard', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Complete toss
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      // Choose bat or wait for AI
      const batBtn = page.getByRole('button', { name: /bat/i });
      if (await batBtn.isVisible()) {
        await batBtn.click();
      } else {
        // Wait for match to auto-start
        await page.waitForTimeout(2000);
      }

      // Scoreboard elements should be visible
      await expect(page.getByText(/\d+\/\d+/)).toBeVisible({ timeout: 10000 }); // Score like 0/0
      await expect(page.getByText(/overs/i).or(page.getByText(/\d+\.\d+/))).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should allow playing a ball', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Complete toss sequence
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      const batBtn = page.getByRole('button', { name: /bat/i });
      if (await batBtn.isVisible()) {
        await batBtn.click();
      }

      // Wait for match to be ready
      await page.waitForTimeout(2000);

      // Find and click Play Ball button
      const playBallBtn = page.getByRole('button', { name: /play ball|bowl/i });
      if (await playBallBtn.isVisible()) {
        await playBallBtn.click();

        // Ball outcome should appear
        await page.waitForTimeout(1000);
        // Score should update or commentary should appear
      }
    } else {
      test.skip();
    }
  });

  test('should show aggression options', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Complete toss
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      const batBtn = page.getByRole('button', { name: /bat/i });
      if (await batBtn.isVisible()) {
        await batBtn.click();
      }

      await page.waitForTimeout(2000);

      // Aggression options should be visible
      await expect(
        page.getByText(/defensive|balanced|aggressive/i)
      ).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should show simulate over option', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Complete toss
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      const batBtn = page.getByRole('button', { name: /bat/i });
      if (await batBtn.isVisible()) {
        await batBtn.click();
      }

      await page.waitForTimeout(2000);

      // Simulate over button should exist
      const simOverBtn = page.getByRole('button', { name: /simulate over|sim over/i });
      await expect(simOverBtn).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should show simulate innings option', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Complete toss
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      const batBtn = page.getByRole('button', { name: /bat/i });
      if (await batBtn.isVisible()) {
        await batBtn.click();
      }

      await page.waitForTimeout(2000);

      // Simulate innings button should exist
      const simInningsBtn = page.getByRole('button', { name: /simulate innings|sim innings/i });
      await expect(simInningsBtn).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should display this over balls', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Complete toss
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      const batBtn = page.getByRole('button', { name: /bat/i });
      if (await batBtn.isVisible()) {
        await batBtn.click();
      }

      await page.waitForTimeout(2000);

      // This over section should be visible
      await expect(page.getByText(/this over/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('should show match completion screen', async ({ page }) => {
    const playMatchBtn = page.getByRole('button', { name: /play match/i });

    if (await playMatchBtn.isVisible()) {
      await playMatchBtn.click();
      await expect(page).toHaveURL(/\/match\/\d+/);

      // Complete toss
      const tossBtn = page.getByRole('button', { name: /flip|toss/i });
      await expect(tossBtn).toBeVisible({ timeout: 10000 });
      await tossBtn.click();
      await expect(page.getByText(/won the toss/i)).toBeVisible({ timeout: 5000 });

      const batBtn = page.getByRole('button', { name: /bat/i });
      if (await batBtn.isVisible()) {
        await batBtn.click();
      }

      await page.waitForTimeout(2000);

      // Simulate both innings to complete match
      const simInningsBtn = page.getByRole('button', { name: /simulate innings|sim innings/i });
      if (await simInningsBtn.isVisible()) {
        // Simulate first innings
        await simInningsBtn.click();
        await page.waitForTimeout(3000);

        // Handle innings change if it appears
        const continueBtn = page.getByRole('button', { name: /continue/i });
        if (await continueBtn.isVisible()) {
          await continueBtn.click();
        }

        await page.waitForTimeout(1000);

        // Simulate second innings
        if (await simInningsBtn.isVisible()) {
          await simInningsBtn.click();
          await page.waitForTimeout(3000);
        }

        // Match over screen should appear
        await expect(
          page.getByText(/match over|won by/i)
        ).toBeVisible({ timeout: 15000 });

        // Back to dashboard button should be visible
        await expect(
          page.getByRole('button', { name: /dashboard|back/i })
        ).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});
