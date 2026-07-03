import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const outDir = 'C:/Users/user/AppData/Local/Temp/lotus-live-qa-artifacts';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/user/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const publicLogs = [];
page.on('console', (msg) => publicLogs.push({ type: msg.type(), text: msg.text() }));
page.on('pageerror', (err) => publicLogs.push({ type: 'pageerror', text: err.message }));
const result = {};

await page.goto('https://lotus-landing-three.vercel.app', { waitUntil: 'networkidle' });
result.public = { url: page.url(), title: await page.title(), menuVisible: await page.getByRole('button', { name: 'Menu' }).isVisible() };
await page.screenshot({ path: `${outDir}/live-public-desktop.png`, fullPage: false });
await page.getByRole('button', { name: 'Menu' }).click();
await page.getByRole('button', { name: 'App Builder' }).click();
await page.waitForURL('https://lotus-builder-studio.vercel.app/**', { timeout: 20000, waitUntil: 'networkidle' });
result.publicToBuilder = { url: page.url(), title: await page.title() };
result.publicConsole = publicLogs.filter((entry) => ['error', 'warn', 'pageerror'].includes(entry.type));

const builder = await context.newPage();
const builderLogs = [];
builder.on('console', (msg) => builderLogs.push({ type: msg.type(), text: msg.text() }));
builder.on('pageerror', (err) => builderLogs.push({ type: 'pageerror', text: err.message }));
await builder.goto('https://lotus-builder-studio.vercel.app', { waitUntil: 'networkidle' });
result.builderLoad = {
  url: builder.url(),
  title: await builder.title(),
  promptVisible: await builder.getByLabel('Build prompt').isVisible(),
  exportVisible: await builder.getByRole('button', { name: 'Preview' }).count() > 0,
};
await builder.screenshot({ path: `${outDir}/live-builder-desktop.png`, fullPage: false });
result.builderConsoleOnLoad = builderLogs.filter((entry) => ['error', 'warn', 'pageerror'].includes(entry.type));

writeFileSync(`${outDir}/lotus-live-qa.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
