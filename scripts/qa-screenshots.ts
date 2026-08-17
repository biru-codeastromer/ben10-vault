/**
 * Visual QA: capture screenshots of the running dev server at desktop / tablet / phone widths.
 *   npx tsx scripts/qa-screenshots.ts [baseUrl] [outDir]
 * Requires the dev server (npm run dev) and Playwright's Chromium (npx playwright install chromium).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:5173';
const out = process.argv[3] ?? path.resolve('research/qa/screens');
fs.mkdirSync(out, { recursive: true });

const shots: { name: string; url: string; vw: number; vh: number; full?: boolean; wait?: number; scroll?: number; click?: string; hover?: string }[] = [
  { name: 'home-desktop', url: '/', vw: 1440, vh: 900, wait: 1800 },
  { name: 'home-desktop-full', url: '/', vw: 1440, vh: 900, full: true, wait: 1800 },
  { name: 'home-hover-ua', url: '/', vw: 1440, vh: 900, wait: 1600, hover: '.omni-object[data-era="ua"]', scroll: 420 },
  { name: 'wall-os', url: '/era/os', vw: 1440, vh: 900, wait: 2200 },
  { name: 'wall-os-full', url: '/era/os', vw: 1440, vh: 900, full: true, wait: 2600 },
  { name: 'wall-af', url: '/era/af', vw: 1440, vh: 900, wait: 2200, scroll: 380 },
  { name: 'wall-ua', url: '/era/ua', vw: 1440, vh: 900, wait: 2200, scroll: 380 },
  { name: 'wall-ov', url: '/era/ov', vw: 1440, vh: 900, wait: 2200, scroll: 380 },
  { name: 'wall-ua-power', url: '/era/ua?sort=power-desc', vw: 1440, vh: 900, wait: 2200, scroll: 380 },
  { name: 'detail-alien-x', url: '/era/af/alien-x', vw: 1440, vh: 900, wait: 2200 },
  { name: 'detail-four-arms-os', url: '/era/os/four-arms', vw: 1440, vh: 900, wait: 2200 },
  { name: 'detail-ult-humungousaur', url: '/era/ua/ultimate-humungousaur', vw: 1440, vh: 900, wait: 2200 },
  { name: 'ben-archive', url: '/ben', vw: 1440, vh: 900, wait: 2200, full: true },
  { name: 'about', url: '/about', vw: 1440, vh: 900, wait: 1500, full: true },
  { name: 'home-tablet', url: '/', vw: 820, vh: 1180, wait: 1800, full: true },
  { name: 'wall-os-tablet', url: '/era/os', vw: 820, vh: 1180, wait: 2200, scroll: 300 },
  { name: 'home-phone', url: '/', vw: 390, vh: 844, wait: 1800, full: true },
  { name: 'wall-ov-phone', url: '/era/ov', vw: 390, vh: 844, wait: 2200, scroll: 520 },
  { name: 'detail-phone', url: '/era/os/heatblast', vw: 390, vh: 844, wait: 2200 },
];

const only = process.env.ONLY?.split(',');

async function main() {
  const browser = await chromium.launch();
  for (const s of shots) {
    if (only && !only.includes(s.name)) continue;
    const ctx = await browser.newContext({ viewport: { width: s.vw, height: s.vh }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base + s.url, { waitUntil: 'networkidle' });
    if (s.scroll) await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
    if (s.hover) await page.hover(s.hover);
    if (s.click) await page.click(s.click);
    await page.waitForTimeout(s.wait ?? 1000);
    const file = path.join(out, `${s.name}.png`);
    await page.screenshot({ path: file, fullPage: !!s.full });
    console.log(`${s.name}: ${file}${errors.length ? `  console errors: ${errors.length} → ${errors.slice(0, 3).join(' | ')}` : ''}`);
    await ctx.close();
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
