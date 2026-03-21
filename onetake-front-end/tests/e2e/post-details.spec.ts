import { expect, test } from '@playwright/test';

test('post details supports like and comment flow with mocked API', async ({ page }) => {
  let liked = false;

  await page.route('**/api/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ accessToken: 'token-1' }),
    });
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'user-1',
        username: 'alan',
        email: 'alan@example.com',
      }),
    });
  });

  await page.route('**/api/posts/post-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'post-1',
        contentText: 'Raid clear with the guild',
        mediaUrl: '/media/sample.mp3',
        mediaType: 0,
        visibility: 0,
        authorName: 'Alan',
        authorDisplayName: 'Alan Wake',
        authorAvatarUrl: null,
        authorId: 'user-1',
        createdAt: '2026-03-20T20:00:00Z',
        likeCount: liked ? 5 : 4,
        isLikedByCurrentUser: liked,
        commentCount: 1,
        tags: ['raids', 'boss'],
        thumbnailUrl: null,
        durationSec: 67,
      }),
    });
  });

  await page.route('**/api/posts/post-1/comments', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'comment-2',
          userId: 'user-1',
          username: 'alan@example.com',
          text: 'Huge clutch at the end.',
          createdAt: '2026-03-21T03:40:00Z',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'comment-1',
          userId: 'user-2',
          username: 'party-member@example.com',
          text: 'Clean run.',
          createdAt: '2026-03-21T03:35:00Z',
        },
      ]),
    });
  });

  await page.route('**/api/posts/post-1/like', async (route) => {
    liked = route.request().method() === 'POST';
    await route.fulfill({ status: 200, body: '' });
  });

  await page.route('**/api/posts/feed/recommended**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.goto('/posts/post-1');

  await expect(page.getByText('Raid clear with the guild')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Like post' })).toBeVisible();

  await page.getByRole('button', { name: 'Like post' }).click();
  await expect(page.getByRole('button', { name: 'Unlike post' })).toBeVisible();

  await page.getByPlaceholder('Write something thoughtful about this post...').fill(
    'Huge clutch at the end.'
  );
  await page.getByRole('button', { name: 'Post comment' }).click();

  await expect(page.getByText('Huge clutch at the end.')).toBeVisible();
});
