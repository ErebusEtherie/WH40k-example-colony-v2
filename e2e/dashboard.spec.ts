import { test, expect } from './auth.setup';

/**
 * Example E2E test for colony dashboard.
 * 
 * This test demonstrates:
 * - Using the authenticatedPage fixture for logged-in tests
 * - Basic page navigation and assertion
 * - Testing cookie-based authentication flow
 */
test.describe('Colony Dashboard', () => {
  test('should load dashboard with authenticated user', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    await authenticatedPage.goto('/dashboard');
    
    // Verify we're on the dashboard page
    await expect(authenticatedPage).toHaveURL(/.*dashboard.*/);
    
    // Verify colony stats are displayed (adjust selectors based on actual UI)
    await expect(authenticatedPage.locator('h1')).toContainText('Colony');
  });

  test('should display colony statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');
    
    // Check that key colony stats are visible
    // Adjust selectors based on actual implementation
    const statsContainer = authenticatedPage.locator('[data-testid="colony-stats"]');
    await expect(statsContainer).toBeVisible();
  });
});