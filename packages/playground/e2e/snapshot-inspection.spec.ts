import { test, expect } from '@playwright/test';

test.describe('Snapshot Inspection', () => {
  test('opens SnapshotViewer for a stage', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="stage-handler"]');
    
    await expect(page.locator('[data-testid="snapshot-viewer"]')).toBeVisible();
  });

  test('displays LocalContext state', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="stage-handler"]');
    
    await expect(page.locator('text=LocalContext')).toBeVisible();
    await expect(page.locator('[data-testid="snapshot-data"]')).toContainText('{');
  });

  test('exports snapshot as JSON', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="stage-handler"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-json"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('searches within snapshot', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="stage-handler"]');
    
    await page.fill('[data-testid="search-input"]', 'request');
    await expect(page.locator('.highlight')).toBeVisible();
  });

  test('displays SnapshotDiff for two snapshots', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="compare-snapshots"]');
    
    await expect(page.locator('[data-testid="snapshot-diff"]')).toBeVisible();
  });

  test('highlights diff changes correctly', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="compare-snapshots"]');
    
    await expect(page.locator('.diff-added')).toHaveCSS('background-color', /rgb\(0, 255, 0\)/);
    await expect(page.locator('.diff-removed')).toHaveCSS('background-color', /rgb\(255, 0, 0\)/);
  });

  test('toggles unified/split view', async ({ page, request }) => {
    await request.get('http://localhost:3000/api/test');
    
    await page.goto('/');
    await page.click('[data-testid="traces-tab"]');
    await page.click('[data-testid="trace-item"]');
    await page.click('[data-testid="compare-snapshots"]');
    
    await page.click('[data-testid="view-toggle"]');
    await expect(page.locator('[data-testid="unified-view"]')).toBeVisible();
    
    await page.click('[data-testid="view-toggle"]');
    await expect(page.locator('[data-testid="split-view"]')).toBeVisible();
  });
});
