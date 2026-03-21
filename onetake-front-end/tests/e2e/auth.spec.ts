import { expect, test } from '@playwright/test';

test('register flow redirects to home with authenticated chrome', async ({ page }) => {
  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({ status: 401, body: '{}' });
  });

  await page.route('**/api/posts/feed/recommended**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });

  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        accessToken: 'token-1',
        user: {
          id: 'user-1',
          username: 'alan',
          email: 'alan@example.com',
        },
      }),
    });
  });

  await page.goto('/auth/register');

  await page.getByLabel('Email').fill('alan@example.com');
  await page.getByLabel('Username').fill('alan');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('alan@example.com')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});
