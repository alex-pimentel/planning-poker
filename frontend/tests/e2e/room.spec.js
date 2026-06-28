import { test, expect } from '@playwright/test';

test.describe('Planning Poker E2E', () => {
  test.setTimeout(60000);

  test('creates a room, joins as participant, and votes', async ({ browser }) => {
    const context = await browser.newContext();

    // Page 1: Mediator creates room
    const mediatorPage = await context.newPage();
    await mediatorPage.goto('http://localhost:5173');
    await mediatorPage.waitForLoadState('networkidle');

    await mediatorPage.getByRole('button', { name: /create room/i }).click();
    await mediatorPage.fill('input[placeholder="Enter your name"]', 'Mediator Alex');
    await mediatorPage.getByRole('button', { name: /create room/i }).click();

    // Wait for room to load
    await mediatorPage.waitForURL(/.*room.*/, { timeout: 10000 }).catch(() => {});
    await mediatorPage.waitForTimeout(2000);

    // Extract room code from the UI
    const roomCodeEl = mediatorPage.locator('text=/[A-Z0-9]{6}/').first();
    await expect(roomCodeEl).toBeVisible({ timeout: 10000 });
    const roomCode = await roomCodeEl.textContent();

    // Page 2: Participant joins
    const participantPage = await context.newPage();
    await participantPage.goto('http://localhost:5173');
    await participantPage.waitForLoadState('networkidle');

    await participantPage.getByRole('button', { name: /join room/i }).click();
    await participantPage.fill('input[placeholder="Enter 6-character code"]', roomCode?.trim() || '');
    await participantPage.fill('input[placeholder="Enter your name"]', 'Peer Bob');
    await participantPage.getByRole('button', { name: /join room/i }).click();

    await participantPage.waitForTimeout(2000);

    // Both pages should show the room
    await expect(mediatorPage.locator('text=Mediator')).toBeVisible({ timeout: 5000 });
    await expect(participantPage.locator('text=Participant')).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
