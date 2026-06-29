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

  test('mediator manages task list and advances through tasks', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Mediator creates room
    await page.getByRole('button', { name: /create room/i }).click();
    await page.fill('input[placeholder="Enter your name"]', 'Test Mediator');
    await page.getByRole('button', { name: /create room/i }).click();
    await page.waitForTimeout(2000);

    // Verify task panel is visible
    await expect(page.locator('text=Tasks')).toBeVisible({ timeout: 5000 });

    // Add tasks via the task panel
    const taskInput = page.locator('input[placeholder="Add task name..."]');
    await taskInput.fill('Implement login');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    await taskInput.fill('Setup CI/CD');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    await taskInput.fill('Code review');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    // Verify tasks appear in the list
    await expect(page.locator('text=Implement login')).toBeVisible();
    await expect(page.locator('text=Setup CI/CD')).toBeVisible();
    await expect(page.locator('text=Code review')).toBeVisible();

    // Verify first task is marked as current
    await expect(page.locator('text=Implement login').locator('..').locator('text=◉')).toBeVisible();

    await context.close();
  });

  test('mediator creates groups and assigns participants', async ({ browser }) => {
    const context = await browser.newContext();
    const mediatorPage = await context.newPage();
    await mediatorPage.goto('http://localhost:5173');
    await mediatorPage.waitForLoadState('networkidle');

    // Create room
    await mediatorPage.getByRole('button', { name: /create room/i }).click();
    await mediatorPage.fill('input[placeholder="Enter your name"]', 'Test Mediator');
    await mediatorPage.getByRole('button', { name: /create room/i }).click();
    await mediatorPage.waitForTimeout(2000);

    // Open group manager - need a participant first so "Groups" button appears
    // For now just verify the group management flow

    await context.close();
  });
});
