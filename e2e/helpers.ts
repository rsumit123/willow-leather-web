import { Page, expect } from '@playwright/test';

/**
 * Shared test utilities for E2E tests
 */

export const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Create a new career with the specified team and name
 */
export async function createCareer(
  page: Page,
  options: { teamIndex?: number; careerName?: string } = {}
): Promise<void> {
  const { teamIndex = 0, careerName = 'Test Career' } = options;

  // Start at home page
  await page.goto('/');

  // Click New Career button
  await page.getByRole('button', { name: /new career/i }).click();

  // Wait for team choices to load
  await expect(page.getByText(/choose your franchise/i)).toBeVisible();

  // Select a team (click the nth team card)
  const teamCards = page.locator('.glass-card').filter({ hasText: /players/i }).or(
    page.locator('button').filter({ hasText: /^[A-Z]{2,4}$/ })
  );

  // Alternative: select by team card component
  const teamButtons = page.locator('[class*="cursor-pointer"]').filter({
    has: page.locator('text=/[A-Z]{2,4}/')
  });

  // Click the first team card that's selectable
  await page.locator('button').filter({ hasText: /mumbai|chennai|bangalore|delhi|kolkata|hyderabad|punjab|rajasthan/i }).first().click();

  // Click Continue
  await page.getByRole('button', { name: /continue/i }).click();

  // Enter career name
  await page.getByPlaceholder(/championship/i).fill(careerName);

  // Click Start Career
  await page.getByRole('button', { name: /start career/i }).click();

  // Wait for redirect to auction page
  await expect(page).toHaveURL(/\/auction/, { timeout: 10000 });
}

/**
 * Complete the auction by auto-completing
 */
export async function autoCompleteAuction(page: Page): Promise<void> {
  // Should be on auction page
  await expect(page).toHaveURL(/\/auction/);

  // Wait for auction page to load
  await expect(page.getByText(/mega auction/i).or(page.getByText(/auction/i))).toBeVisible();

  // Click Auto-Complete button
  const autoCompleteBtn = page.getByRole('button', { name: /auto-complete|skip/i });
  await expect(autoCompleteBtn).toBeVisible({ timeout: 5000 });
  await autoCompleteBtn.click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
}

/**
 * Manually bid on a player in the auction
 */
export async function bidOnPlayer(page: Page): Promise<void> {
  // Start the auction if needed
  const startBtn = page.getByRole('button', { name: /start auction/i });
  if (await startBtn.isVisible()) {
    await startBtn.click();
  }

  // Wait for "Bring First Player" or "Next Player" button
  const nextPlayerBtn = page.getByRole('button', { name: /bring first player|next player/i });
  await expect(nextPlayerBtn).toBeVisible({ timeout: 5000 });
  await nextPlayerBtn.click();

  // Wait for player to appear
  await expect(page.getByText(/current bid/i)).toBeVisible({ timeout: 5000 });

  // Place a bid
  const bidBtn = page.getByRole('button', { name: /bid/i }).first();
  if (await bidBtn.isEnabled()) {
    await bidBtn.click();
  }
}

/**
 * Select a valid Playing XI
 */
export async function selectPlayingXI(page: Page): Promise<void> {
  // Navigate to Playing XI page
  await page.goto('/playing-xi');

  // Wait for squad to load
  await expect(page.getByText(/selected:/i)).toBeVisible({ timeout: 10000 });

  // Select players by role to form a valid XI
  // Strategy: Select 1 WK, 4 BAT, 2 AR, 4 BOWL

  // Get all player selection buttons
  const playerButtons = page.locator('button').filter({
    has: page.locator('[class*="rounded-full"]')
  });

  // Select first available wicket keeper
  const wkSection = page.locator('div').filter({ hasText: /wicket keepers/i }).first();
  const wkPlayers = wkSection.locator('button').filter({ hasText: /\d+/ });
  if (await wkPlayers.count() > 0) {
    await wkPlayers.first().click();
  }

  // Select batsmen
  const batSection = page.locator('div').filter({ hasText: /^batsmen/i });
  const batPlayers = batSection.locator('button').filter({ hasText: /\d+/ });
  for (let i = 0; i < Math.min(4, await batPlayers.count()); i++) {
    await batPlayers.nth(i).click();
  }

  // Select all-rounders
  const arSection = page.locator('div').filter({ hasText: /all-rounders/i });
  const arPlayers = arSection.locator('button').filter({ hasText: /\d+/ });
  for (let i = 0; i < Math.min(2, await arPlayers.count()); i++) {
    await arPlayers.nth(i).click();
  }

  // Select bowlers
  const bowlSection = page.locator('div').filter({ hasText: /^bowlers/i });
  const bowlPlayers = bowlSection.locator('button').filter({ hasText: /\d+/ });
  for (let i = 0; i < Math.min(4, await bowlPlayers.count()); i++) {
    await bowlPlayers.nth(i).click();
  }
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  await page.waitForResponse(
    response =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) &&
      response.status() === 200
  );
}

/**
 * Generate a unique test name
 */
export function generateTestName(prefix: string = 'Test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Clean up careers via API
 */
export async function cleanupCareersViaApi(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/career/list`);
    if (response.ok) {
      const careers = await response.json();
      for (const career of careers) {
        await fetch(`${API_BASE_URL}/career/${career.id}`, {
          method: 'DELETE',
        });
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Check if element contains text (case-insensitive)
 */
export async function hasText(page: Page, text: string): Promise<boolean> {
  const element = page.getByText(new RegExp(text, 'i'));
  return await element.isVisible();
}
