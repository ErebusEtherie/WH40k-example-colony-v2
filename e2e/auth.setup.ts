import { test as base, expect } from '@playwright/test';

/**
 * Extended test fixture that provides authenticated context for E2E tests.
 * 
 * This fixture handles login before each test and saves the authentication
 * state to be reused across tests in the same session.
 */
export const test = base.extend<{ authenticatedPage: any }>({
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto('/login');
    
    // Use default test credentials
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for successful login (redirect to dashboard or similar)
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Save authentication state
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
    
    await use(page);
  },
});

export { expect };