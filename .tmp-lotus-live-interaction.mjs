import { chromium } from 'playwright';
console.time('live-builder');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/user/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const logs = [];
page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: err.message }));
await page.goto('https://lotus-builder-studio.vercel.app', { waitUntil: 'networkidle' });
await page.getByLabel('Build prompt').fill('Build a simple finance dashboard app with cards and a chart.');
await page.locator('form.chatbar button[aria-label="Send"]').click();
await page.waitForTimeout(12000);
const text = await page.locator('body').textContent();
const result = {
  url: page.url(),
  bodyHasKeepBuilding: text?.includes('Keep Building in Preview') ?? false,
  bodyHasPreviewError: text?.includes('could not finish') ?? false,
  bodyHasPaused: text?.includes('paused') ?? false,
  logs: logs.filter((entry) => ['error', 'warn', 'pageerror'].includes(entry.type)),
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
console.timeEnd('live-builder');
