import { test, expect } from '@playwright/test';

test.describe('Trace Visualization', () => {
  test('loads playground UI', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Gati Playground');
  });

  test('captures and displays trace', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    
    const traceItem = page.locator('[data-testid="trace-item"]').first();
    await expect(traceItem).toBeVisible({ timeout: 5000 });
  });

  test('displays RequestFlowDiagram with all stages', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    
    const canvas = page.locator('canvas[data-testid="flow-diagram"]');
    await expect(canvas).toBeVisible();
    
    await expect(page.locator('text=ingress')).toBeVisible();
    await expect(page.locator('text=route-manager')).toBeVisible();
    await expect(page.locator('text=handler')).toBeVisible();
  });

  test('shows timing information', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    
    await expect(page.locator('[data-testid="duration"]')).toContainText('ms');
  });

  test('highlights errors in red', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/error');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"].error');
    
    const errorIndicator = page.locator('[data-testid="error-indicator"]');
    await expect(errorIndicator).toHaveCSS('color', /rgb\(255, 0, 0\)/);
  });
});
