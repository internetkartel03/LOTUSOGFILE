import { test, expect } from '@playwright/test';

test('landing routes into builder deploy', async ({ page }) => {
  await page.goto('https://lotus-landing-three.vercel.app', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /menu/i }).click();
  await page.getByRole('button', { name: 'App Builder' }).click();
  await page.waitForURL('https://lotus-builder-studio.vercel.app/**', { timeout: 20000 });
  console.log('LANDING_URL=' + page.url());
});

test('local builder generates preview and exports html', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://127.0.0.1:4173/builder', { waitUntil: 'networkidle' });

  const promptInput = page.getByLabel('Build prompt');
  const homeTab = page.getByRole('button', { name: 'Home' });
  if (!(await promptInput.isVisible())) {
    await homeTab.click();
    await expect(promptInput).toBeVisible();
  }

  await promptInput.fill('Build a luxury skincare mobile app with a glowing product hero, featured products, testimonials, and an inline SVG image treatment.');
  await page.locator('form.chatbar button[aria-label="Send"]').click();
  await page.getByText('Keep Building in Preview', { exact: true }).waitFor({ timeout: 90000 });

  const buildUpdate = await page.locator('.result-card p').textContent();
  const suggestions = await page.locator('.followup-chip').count();
  const iframe = page.locator('iframe[title="App preview"]');
  await iframe.waitFor({ timeout: 20000 });
  const srcdoc = await iframe.evaluate((el) => el.getAttribute('srcdoc') || '');

  console.log('BUILD_UPDATE=' + buildUpdate);
  console.log('SUGGESTIONS=' + suggestions);
  console.log('HAS_HTML=' + /<html/i.test(srcdoc));
  console.log('HAS_SVG=' + /<svg/i.test(srcdoc));
  console.log('HAS_FENCE=' + /```/.test(srcdoc));

  const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.getByRole('button', { name: 'Export HTML' }).click();
  const download = await downloadPromise;
  console.log('EXPORT_NAME=' + download.suggestedFilename());
  console.log('PREVIEW_INPUT_VISIBLE=' + await promptInput.isVisible());

  expect(/<html/i.test(srcdoc)).toBeTruthy();
  expect(/```/.test(srcdoc)).toBeFalsy();
  expect(suggestions).toBeGreaterThan(0);
});
