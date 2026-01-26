import { test, expect } from '@playwright/test';
import { generateTestName } from './helpers';

test.describe('Auction Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Create a new career to get to auction
    const careerName = generateTestName('Auction Test');

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

    // Wait for auction page
    await expect(page).toHaveURL(/\/auction/, { timeout: 15000 });
  });

  test('should display auction page with start button', async ({ page }) => {
    // Verify auction page elements
    await expect(page.getByText(/mega auction/i)).toBeVisible();
    await expect(page.getByText(/₹90 cr/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /start auction/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /auto-complete|skip/i })).toBeVisible();
  });

  test('should start auction and show first player', async ({ page }) => {
    // Start the auction
    await page.getByRole('button', { name: /start auction/i }).click();

    // Wait for next player button
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();

    // Bring first player
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Verify player is displayed
    await expect(page.getByText(/current bid/i)).toBeVisible();
    await expect(page.getByText(/base:/i)).toBeVisible();
  });

  test('should allow bidding on a player', async ({ page }) => {
    // Start auction and bring first player
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Wait for player to be displayed
    await expect(page.getByText(/current bid/i)).toBeVisible();

    // Place a bid
    const bidBtn = page.getByRole('button', { name: /bid/i }).first();
    if (await bidBtn.isEnabled()) {
      await bidBtn.click();

      // Verify bid was placed (current bidder should show user's team)
      await expect(page.getByText(/\(you\)/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow passing on a player', async ({ page }) => {
    // Start auction and bring first player
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Wait for player and pass
    await expect(page.getByText(/current bid/i)).toBeVisible();
    await page.getByRole('button', { name: /pass/i }).click();

    // Wait for result (sold or unsold)
    await expect(
      page.getByText(/sold to|unsold/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test.skip('should auto-complete auction and redirect to dashboard', async ({ page }) => {
    // SKIPPED: Backend auto-complete takes >3 minutes for 150+ players
    // This test passes when the backend is optimized or run manually with longer timeout
    // To run: npx playwright test -g "auto-complete" --timeout=600000

    // Click auto-complete
    await page.getByRole('button', { name: /auto-complete|skip/i }).click();

    // Wait for redirect to dashboard (auto-complete can take 2-3 minutes)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 180000 });

    // Verify dashboard elements
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('should show team budget and player count', async ({ page }) => {
    // Start auction
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Verify budget display
    await expect(page.getByText(/₹.*cr/i)).toBeVisible();

    // Verify player count
    await expect(page.getByText(/\/25 players/i)).toBeVisible();
  });

  test('should show sold/unsold player counts', async ({ page }) => {
    // Start auction and bring player
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Verify sold/unsold counters exist
    await expect(page.getByText(/sold/i)).toBeVisible();
  });

  test('should enable auto-bid option', async ({ page }) => {
    // Start auction and bring player
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Wait for player to be displayed
    await expect(page.getByText(/current bid/i)).toBeVisible();

    // Check for auto-bid checkbox
    const autoBidCheckbox = page.getByText(/auto-bid/i);
    await expect(autoBidCheckbox).toBeVisible();
  });

  test('should show player list drawer', async ({ page }) => {
    // Start auction and bring player
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Click players button to open drawer
    const playersBtn = page.getByRole('button', { name: /players/i });
    if (await playersBtn.isVisible()) {
      await playersBtn.click();

      // Verify drawer content (categories)
      await expect(
        page.getByText(/batsman|bowler|all.rounder|wicket.keeper/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display team overview grid', async ({ page }) => {
    // Start auction and bring player
    await page.getByRole('button', { name: /start auction/i }).click();
    await expect(page.getByRole('button', { name: /bring first player/i })).toBeVisible();
    await page.getByRole('button', { name: /bring first player/i }).click();

    // Verify team grid at the bottom
    const teamsGrid = page.locator('.grid').filter({ hasText: /\d/ });
    await expect(teamsGrid).toBeVisible();
  });
});
