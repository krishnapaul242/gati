import { test, expect } from '@playwright/test';

test.describe('Debug Gates', () => {
  test('opens DebugGateControls', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="debug-tab"]');
    
    await expect(page.locator('[data-testid="gate-controls"]')).toBeVisible();
  });

  test('creates debug gate at specific stage', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="debug-tab"]');
    
    await page.selectOption('[data-testid="stage-select"]', 'handler');
    await page.click('[data-testid="create-gate"]');
    
    await expect(page.locator('[data-testid="gate-item"]')).toBeVisible();
  });

  test('triggers gate and shows notification', async ({ page, request }) => {
    await page.goto('/');
    await page.click('[data-testid="debug-tab"]');
    
    await page.selectOption('[data-testid="stage-select"]', 'handler');
    await page.click('[data-testid="create-gate"]');
    
    const notificationPromise = page.waitForSelector('[data-testid="gate-triggered"]');
    await request.get('http://localhost:3000/api/test');
    
    await expect(notificationPromise).resolves.toBeTruthy();
  });

  test('resumes execution after gate trigger', async ({ page, request }) => {
    await page.goto('/');
    await page.click('[data-testid="debug-tab"]');
    
    await page.selectOption('[data-testid="stage-select"]', 'handler');
    await page.click('[data-testid="create-gate"]');
    
    const requestPromise = request.get('http://localhost:3000/api/test');
    
    await page.waitForSelector('[data-testid="gate-triggered"]');
    await page.click('[data-testid="resume-gate"]');
    
    const response = await requestPromise;
    expect(response.status()).toBe(200);
  });

  test('creates conditional gate', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="debug-tab"]');
    
    await page.selectOption('[data-testid="stage-select"]', 'handler');
    await page.fill('[data-testid="condition-input"]', 'userId === "123"');
    await page.click('[data-testid="create-gate"]');
    
    const gateItem = page.locator('[data-testid="gate-item"]');
    await expect(gateItem).toContainText('userId === "123"');
  });

  test('evaluates conditional gate correctly', async ({ page, request }) => {
    await page.goto('/');
    await page.click('[data-testid="debug-tab"]');
    
    await page.selectOption('[data-testid="stage-select"]', 'handler');
    await page.fill('[data-testid="condition-input"]', 'userId === "123"');
    await page.click('[data-testid="create-gate"]');
    
    await request.get('http://localhost:3000/api/test?userId=456');
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="gate-triggered"]')).not.toBeVisible();
    
    await request.get('http://localhost:3000/api/test?userId=123');
    await expect(page.locator('[data-testid="gate-triggered"]')).toBeVisible();
  });

  test('deletes gate', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="debug-tab"]');
    
    await page.selectOption('[data-testid="stage-select"]', 'handler');
    await page.click('[data-testid="create-gate"]');
    
    await expect(page.locator('[data-testid="gate-item"]')).toBeVisible();
    
    await page.click('[data-testid="remove-gate"]');
    await expect(page.locator('[data-testid="gate-item"]')).not.toBeVisible();
  });
});
