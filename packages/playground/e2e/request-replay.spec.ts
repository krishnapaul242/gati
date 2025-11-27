import { test, expect } from '@playwright/test';

test.describe('Request Replay', () => {
  test('selects trace from list', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    
    const traceItem = page.locator('[data-testid="trace-item"]').first();
    await traceItem.click();
    
    await expect(page.locator('[data-testid="trace-details"]')).toBeVisible();
  });

  test('replays request', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="replay-button"]');
    
    await expect(page.locator('[data-testid="replay-result"]')).toBeVisible({ timeout: 5000 });
  });

  test('displays replay results', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="replay-button"]');
    
    await expect(page.locator('[data-testid="replay-status"]')).toContainText('success');
    await expect(page.locator('[data-testid="replay-duration"]')).toContainText('ms');
  });

  test('compares replay vs original', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="replay-button"]');
    
    await page.click('[data-testid="compare-results"]');
    await expect(page.locator('[data-testid="comparison-view"]')).toBeVisible();
  });

  test('modifies input and replays', async ({ page, request }) => {
    await request.post('http://localhost:3000/api/test', { data: { value: 100 } });
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    
    await page.click('[data-testid="modify-input"]');
    await page.fill('[data-testid="input-editor"]', '{"value": 200}');
    await page.click('[data-testid="replay-button"]');
    
    await expect(page.locator('[data-testid="replay-result"]')).toContainText('200');
  });

  test('verifies modified results differ', async ({ page, request }) => {
    await request.post('http://localhost:3000/api/test', { data: { value: 100 } });
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    
    await page.click('[data-testid="modify-input"]');
    await page.fill('[data-testid="input-editor"]', '{"value": 200}');
    await page.click('[data-testid="replay-button"]');
    
    await page.click('[data-testid="compare-results"]');
    await expect(page.locator('.diff-modified')).toBeVisible();
  });

  test('replays from specific stage', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    
    await page.selectOption('[data-testid="replay-from-stage"]', 'handler');
    await page.click('[data-testid="replay-button"]');
    
    await expect(page.locator('[data-testid="replay-result"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-from"]')).toContainText('handler');
  });

  test('verifies partial replay works', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    
    await page.selectOption('[data-testid="replay-from-stage"]', 'lcc');
    await page.click('[data-testid="replay-button"]');
    
    const result = page.locator('[data-testid="replay-result"]');
    await expect(result).toBeVisible();
    await expect(result).toContainText('success');
  });
});
