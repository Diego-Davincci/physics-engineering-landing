import { expect, test } from '@playwright/test';

/** End-to-end checks for /nuestro-equipo: navbar, the four ID cards, the swing-in, layout. */

const PEOPLE = [
  { name: 'Prof. Nerio Montoya', title: 'Director del Área Curricular de Física' },
  { name: 'Prof. Jairo Humberto Marín Cadavid', title: 'Director del Departamento de Física' },
  { name: 'Mónica', title: 'Secretaria Jefe' },
  { name: 'Diego Alejandro Londoño Jiménez', title: 'Jefe del Laboratorio de Física' },
];

/** Rotation the browser is currently rendering for each card, in degrees. */
async function tilts(page: import('@playwright/test').Page): Promise<number[]> {
  return page.locator('section li > div').evaluateAll((cards) => cards.map((card) => parseFloat(getComputedStyle(card).rotate)));
}

test('the navbar links to the page and marks it as current', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Principal' }).first();
  await nav.getByRole('link', { name: 'Nuestro equipo' }).click();

  await expect(page).toHaveURL(/\/nuestro-equipo$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Nuestro equipo' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Nuestro equipo' })).toHaveAttribute('aria-current', 'page');
});

test('shows the four people in order, each with title and what to come for', async ({ page }) => {
  await page.goto('/nuestro-equipo');
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(PEOPLE.length);

  for (const [i, person] of PEOPLE.entries()) {
    const card = cards.nth(i);
    await expect(card).toHaveAccessibleName(person.name);
    await expect(card).toContainText(person.title);
    await expect(card.getByRole('list', { name: 'Acude para' }).getByRole('listitem').first()).toBeVisible();
  }
  await expect(page.getByText('[FOTO]')).toHaveCount(0);
});

test('the cards swing in and settle at their resting tilt', async ({ page }) => {
  await page.goto('/nuestro-equipo');
  const settled = [-1.5, 1.2, -0.8, 1.6];

  // Mid-swing at least one card is away from rest…
  await page.waitForTimeout(400);
  const moving = await tilts(page);
  expect(moving.some((tilt, i) => Math.abs(tilt - settled[i]) > 0.3)).toBe(true);

  // …and after the swing (3s + stagger) every card hangs at rest.
  await page.waitForTimeout(3300);
  const resting = await tilts(page);
  resting.forEach((tilt, i) => expect(tilt).toBeCloseTo(settled[i], 1));
});

test('with reduced motion the cards hang still at rest from the start', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/nuestro-equipo');

  const resting = await tilts(page);
  [-1.5, 1.2, -0.8, 1.6].forEach((tilt, i) => expect(resting[i]).toBeCloseTo(tilt, 1));
  await context.close();
});

for (const { width, columns } of [
  { width: 375, columns: 1 },
  { width: 768, columns: 2 },
  { width: 1280, columns: 4 },
  { width: 1920, columns: 4 },
]) {
  test(`at ${width}px the cards sit ${columns} per row, with no horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/nuestro-equipo');

    const tops = await page.locator('section li').evaluateAll((items) => items.map((li) => Math.round(li.getBoundingClientRect().top)));
    expect(tops.filter((top) => top === tops[0])).toHaveLength(columns);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
