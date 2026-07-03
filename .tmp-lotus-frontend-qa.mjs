import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const outDir = 'C:/Users/user/AppData/Local/Temp/lotus-qa-artifacts';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/user/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const logs = [];
page.on('console', (msg) => logs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => logs.push({ type: 'pageerror', text: err.message }));

const result = { browserFallbackReason: 'Browser plugin invocation failed: TypeError: incrementalAriaSnapshot is not a function' };

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
result.public = {
  url: page.url(),
  title: await page.title(),
  hasLotus: await page.locator('body').textContent().then(t => t?.includes('LOTUS') ?? false),
  hasMenu: await page.getByRole('button', { name: 'Menu' }).count(),
};
await page.screenshot({ path: `${outDir}/lotus-public-desktop.png`, fullPage: false });

await page.getByRole('button', { name: 'Menu' }).click();
await page.getByRole('button', { name: 'App Builder' }).click();
await page.waitForURL('https://lotus-builder-studio.vercel.app/**', { timeout: 20000, waitUntil: 'networkidle' });
result.publicToBuilderDeploy = {
  url: page.url(),
  title: await page.title(),
};

const builderPage = await context.newPage();
const builderLogs = [];
builderPage.on('console', (msg) => builderLogs.push({ type: msg.type(), text: msg.text() }));
builderPage.on('pageerror', (err) => builderLogs.push({ type: 'pageerror', text: err.message }));
await builderPage.goto('http://127.0.0.1:4173/builder', { waitUntil: 'networkidle' });
result.builderEntry = {
  url: builderPage.url(),
  title: await builderPage.title(),
  promptVisible: await builderPage.getByLabel('Build prompt').isVisible(),
};
await builderPage.screenshot({ path: `${outDir}/lotus-builder-desktop.png`, fullPage: false });

await builderPage.getByLabel('Build prompt').fill('Build a modern travel itinerary mobile app with a hero, day planner cards, and a premium visual style.');
await builderPage.locator('form.chatbar button[aria-label="Send"]').click();
await builderPage.getByText('Keep Building in Preview', { exact: true }).waitFor({ timeout: 120000 });
const iframe = builderPage.locator('iframe[title="App preview"]');
await iframe.waitFor({ timeout: 20000 });
const srcdoc = await iframe.evaluate((el) => el.getAttribute('srcdoc') || '');
result.builderGeneration = {
  buildUpdate: await builderPage.locator('.result-card p').textContent(),
  suggestionCount: await builderPage.locator('.followup-chip').count(),
  hasHtml: /<html/i.test(srcdoc),
  hasFence: /```/.test(srcdoc),
  hasSvg: /<svg/i.test(srcdoc),
  exportButtonVisible: await builderPage.getByRole('button', { name: 'Export HTML' }).isVisible(),
};
await builderPage.screenshot({ path: `${outDir}/lotus-builder-preview-desktop.png`, fullPage: false });

const mobile = await context.newPage();
await mobile.setViewportSize({ width: 390, height: 844 });
const mobileLogs = [];
mobile.on('console', (msg) => mobileLogs.push({ type: msg.type(), text: msg.text() }));
mobile.on('pageerror', (err) => mobileLogs.push({ type: 'pageerror', text: err.message }));
await mobile.goto('http://127.0.0.1:4173/university', { waitUntil: 'networkidle' });
result.universityMobile = {
  url: mobile.url(),
  title: await mobile.title(),
  bodyHasUniversity: await mobile.locator('body').textContent().then(t => t?.includes('Lotus University') || t?.includes('LOTUS UNIVERSITY') || false),
};
await mobile.screenshot({ path: `${outDir}/lotus-university-mobile.png`, fullPage: false });

result.publicConsole = logs.filter((entry) => ['error', 'warn', 'pageerror'].includes(entry.type));
result.builderConsole = builderLogs.filter((entry) => ['error', 'warn', 'pageerror'].includes(entry.type));
result.mobileConsole = mobileLogs.filter((entry) => ['error', 'warn', 'pageerror'].includes(entry.type));

writeFileSync(`${outDir}/lotus-frontend-qa.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

await mobile.close();
await builderPage.close();
await browser.close();
