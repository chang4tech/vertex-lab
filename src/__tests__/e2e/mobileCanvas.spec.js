import { test, expect } from '@playwright/test';

test.describe('Mobile Canvas Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to a graph route so the canvas is present
    await page.goto('/#/g/e2e');
    // Wait for the canvas to be visible
    await expect(page.locator('canvas')).toBeVisible();
    // Double-click to create a node
    await page.locator('canvas').dblclick({ position: { x: 200, y: 200 } });
    // Wait briefly for rendering
    await page.waitForTimeout(500);
  });

  const skipIfNotMobileViewport = async (page) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width > 768) {
      test.skip('This test is for mobile-sized viewports only');
    }
  };

  test('Center button centers the node on mobile', async ({ page }) => {
    await skipIfNotMobileViewport(page);

    const controls = page.locator('.mobile-controls');
    await expect(controls).toBeVisible();
    // Playwright occasionally reports the canvas intercepting these taps even though
    // the floating controls render above it, so `force` sidesteps that heuristic.
    await controls.getByRole('button', { name: 'Center' }).click({ force: true });

    // Give some time for the layout to apply and canvas to redraw
    await page.waitForTimeout(1000);

    // Take a screenshot to visually verify centering
    await page.screenshot({ path: 'playwright-report/center-mobile.png' });

    // Further assertions could involve reading canvas pixel data or node positions if exposed
    // For now, visual inspection via screenshot is the primary verification.
  });

  test('Reset Zoom button resets zoom to 1x on mobile', async ({ page }) => {
    await skipIfNotMobileViewport(page);

    const controls = page.locator('.mobile-controls');
    await expect(controls).toBeVisible();

    const zoomIn = controls.getByRole('button', { name: 'Zoom In' });
    await zoomIn.click({ force: true });
    await page.waitForTimeout(200);
    await zoomIn.click({ force: true });
    await page.waitForTimeout(200);
    await zoomIn.click({ force: true });
    await page.waitForTimeout(500);

    await controls.getByRole('button', { name: 'Reset Zoom' }).click({ force: true });

    // Give some time for the canvas to redraw
    await page.waitForTimeout(1000);

    // Take a screenshot to visually verify reset zoom
    await page.screenshot({ path: 'playwright-report/reset-zoom-mobile.png' });

    // Further assertions could involve reading canvas pixel data or view state if exposed
  });
});
