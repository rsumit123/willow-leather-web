import { test, expect } from '@playwright/test';
import { generateTestName } from './helpers';

test.describe('Career Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should display home page with New Career button', async ({ page }) => {
    // Verify the title/branding is visible
    await expect(page.getByText(/willow/i)).toBeVisible();
    await expect(page.getByText(/leather/i)).toBeVisible();

    // Verify New Career button exists
    await expect(page.getByRole('button', { name: /new career/i })).toBeVisible();
  });

  test('should navigate to new career page and show team choices', async ({ page }) => {
    // Click New Career
    await page.getByRole('button', { name: /new career/i }).click();

    // Verify we're on the new career page
    await expect(page.getByText(/choose your franchise/i)).toBeVisible();

    // Verify team choices are displayed
    await expect(page.getByText(/select the team/i)).toBeVisible();
  });

  test('should allow selecting a team and proceeding to name entry', async ({ page }) => {
    // Navigate to new career
    await page.getByRole('button', { name: /new career/i }).click();

    // Wait for teams to load
    await expect(page.getByText(/choose your franchise/i)).toBeVisible();

    // Click on a team card (TeamCard is a div with cursor-pointer, contains team name)
    const teamCard = page.locator('.glass-card').filter({
      hasText: /mumbai|chennai|bangalore|delhi|kolkata|hyderabad|punjab|rajasthan/i
    }).first();
    await teamCard.click();

    // Click Continue
    await page.getByRole('button', { name: /continue/i }).click();

    // Verify we're on the name entry step
    await expect(page.getByText(/name your career/i)).toBeVisible();
    await expect(page.getByPlaceholder(/championship/i)).toBeVisible();
  });

  test('should create career and redirect to auction', async ({ page }) => {
    const careerName = generateTestName('E2E Career');

    // Navigate to new career
    await page.getByRole('button', { name: /new career/i }).click();
    await expect(page.getByText(/choose your franchise/i)).toBeVisible();

    // Select a team card
    const teamCard = page.locator('.glass-card').filter({
      hasText: /mumbai|chennai|bangalore|delhi|kolkata|hyderabad|punjab|rajasthan/i
    }).first();
    await teamCard.click();

    // Continue to name entry
    await page.getByRole('button', { name: /continue/i }).click();

    // Enter career name
    await page.getByPlaceholder(/championship/i).fill(careerName);

    // Create career
    await page.getByRole('button', { name: /start career/i }).click();

    // Wait for redirect to auction
    await expect(page).toHaveURL(/\/auction/, { timeout: 15000 });

    // Verify auction page loaded (use .first() since multiple elements match)
    await expect(page.getByRole('heading', { name: /mega auction/i })).toBeVisible();
  });

  test.skip('should show continue option when career exists', async ({ page }) => {
    // SKIPPED: Backend auto-complete takes >3 minutes for 150+ players
    // This test passes when the backend is optimized or run manually with longer timeout

    const careerName = generateTestName('Continue Test');

    // Create a career first
    await page.getByRole('button', { name: /new career/i }).click();
    await expect(page.getByText(/choose your franchise/i)).toBeVisible();

    const teamCard = page.locator('.glass-card').filter({
      hasText: /mumbai|chennai|bangalore|delhi|kolkata|hyderabad|punjab|rajasthan/i
    }).first();
    await teamCard.click();
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByPlaceholder(/championship/i).fill(careerName);
    await page.getByRole('button', { name: /start career/i }).click();

    // Complete auction to save career state (auto-complete can take 2-3 minutes)
    await expect(page).toHaveURL(/\/auction/, { timeout: 15000 });
    await page.getByRole('button', { name: /auto-complete|skip/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 180000 });

    // Go back to home
    await page.goto('/');

    // Wait for careers to load and verify the career appears
    await page.waitForTimeout(1000); // Give API time to respond

    // Check for either "Continue from" text or just verify the career name appears
    const continueSection = page.getByText(/continue from/i);
    const careerNameElement = page.getByText(new RegExp(careerName.slice(0, 15), 'i'));

    // Either the section header or the career name should be visible
    await expect(continueSection.or(careerNameElement)).toBeVisible({ timeout: 10000 });
  });

  test('should require team selection before continuing', async ({ page }) => {
    // Navigate to new career
    await page.getByRole('button', { name: /new career/i }).click();
    await expect(page.getByText(/choose your franchise/i)).toBeVisible();

    // Try to click continue without selecting a team
    const continueBtn = page.getByRole('button', { name: /continue/i });

    // Button should be disabled
    await expect(continueBtn).toBeDisabled();
  });

  test('should require career name before starting', async ({ page }) => {
    // Navigate through to name entry
    await page.getByRole('button', { name: /new career/i }).click();
    await expect(page.getByText(/choose your franchise/i)).toBeVisible();

    const teamCard = page.locator('.glass-card').filter({
      hasText: /mumbai|chennai|bangalore|delhi|kolkata|hyderabad|punjab|rajasthan/i
    }).first();
    await teamCard.click();
    await page.getByRole('button', { name: /continue/i }).click();

    // Start Career button should be disabled without name
    const startBtn = page.getByRole('button', { name: /start career/i });
    await expect(startBtn).toBeDisabled();

    // Enter a name
    await page.getByPlaceholder(/championship/i).fill('Test');

    // Now button should be enabled
    await expect(startBtn).toBeEnabled();
  });
});
