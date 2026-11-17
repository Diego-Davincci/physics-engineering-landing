import { expect, test } from '@playwright/test';

/** End-to-end checks for /prestamo-de-equipos: navbar, locker ↔ receipt link, tabs, layout. */

const FORM_URL = 'https://forms.gle/WAWMnGe2CJzrLA8e8';

test.beforeEach(async ({ page }) => {
  await page.goto('/prestamo-de-equipos');
});

test('navbar marks the page and the CTA opens the form in a new tab', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const nav = page.getByRole('navigation', { name: 'Principal' }).first();
  await expect(nav.getByRole('link', { name: 'Préstamo de equipos' })).toHaveAttribute('aria-current', 'page');

  const cta = page.getByRole('banner').getByRole('link', { name: /Pedir equipos/ });
  await expect(cta).toHaveAttribute('href', FORM_URL);
  await expect(cta).toHaveAttribute('target', '_blank');
});

test('hovering a locker badge lights its receipt line and dims the rest', async ({ page }) => {
  const badge = page.getByRole('button', { name: '1 · Osciloscopio digital' });
  await badge.hover();

  await expect(page.locator('li[data-item="oscilloscope"]')).toHaveAttribute('data-state', 'on');
  await expect(page.locator('g[data-item="dc-supply"]')).toHaveAttribute('data-state', 'dim');

  await page.mouse.move(0, 0);
  await expect(page.locator('li[data-item="oscilloscope"]')).not.toHaveAttribute('data-state');
});

test('hovering a receipt line lights its piece in the locker', async ({ page }) => {
  await page.locator('li[data-item="power-cables"]').hover();
  await expect(page.locator('g[data-item="power-cables"]')).toHaveAttribute('data-state', 'on');
  await expect(page.locator('g[data-item="oscilloscope"]')).toHaveAttribute('data-state', 'dim');
});

test('keyboard focus on a badge highlights, Escape clears', async ({ page }) => {
  const badge = page.getByRole('button', { name: '3 · Generador de señales' });
  await badge.focus();
  await expect(page.locator('g[data-item="signal-generator"]')).toHaveAttribute('data-state', 'on');

  await page.keyboard.press('Escape');
  await expect(page.locator('g[data-item="signal-generator"]')).not.toHaveAttribute('data-state');
});

test('tabs swap the papers by click and by keyboard', async ({ page }) => {
  const request = page.getByRole('tab', { name: /Pedir/ });
  const returning = page.getByRole('tab', { name: /Devolver/ });
  const requestPanel = page.locator('#loan-panel-request');
  const returnPanel = page.locator('#loan-panel-return');

  await expect(request).toHaveAttribute('aria-selected', 'true');
  await expect(returnPanel).toHaveAttribute('inert', '');

  await returning.click();
  await expect(returning).toHaveAttribute('aria-selected', 'true');
  await expect(returnPanel).toHaveAttribute('data-state', 'active');
  await expect(requestPanel).toHaveAttribute('inert', '');

  await returning.press('ArrowLeft');
  await expect(request).toBeFocused();
  await expect(request).toHaveAttribute('aria-selected', 'true');
  await expect(requestPanel).toHaveAttribute('data-state', 'active');
});

test('on a phone the locker stacks above the tickets, with no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const locker = await page.getByRole('img', { name: /Casillero abierto/ }).boundingBox();
  const tabs = await page.getByRole('tablist', { name: 'Proceso' }).boundingBox();
  expect(locker!.y + locker!.height).toBeLessThan(tabs!.y);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('tapping a receipt line highlights on touch screens', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/prestamo-de-equipos');

  await page.locator('li[data-item="bnc-clip-cable"]').tap();
  await expect(page.locator('g[data-item="bnc-clip-cable"]')).toHaveAttribute('data-state', 'on');
  await context.close();
});
