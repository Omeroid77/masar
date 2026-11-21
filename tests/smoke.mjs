/* Smoke test: serve out/ (run `npm run build` first), visit every route, run the inspector flow,
   change filters, and compare KPI numbers with the static build in ../dist (same seed => same numbers).
   Uses system Chrome via playwright-core. Screenshots go to tests/out/. */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';

const OUT = resolve('out'), DIST = resolve('../dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
function serve(root, port) {
  return new Promise(ok => {
    const s = createServer(async (req, res) => {
      let p = join(root, decodeURIComponent(req.url.split('?')[0]));
      try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(await readFile(p)); }
      catch { res.writeHead(404); res.end('nf'); }
    }).listen(port, () => ok(s));
  });
}
const ROUTES = ['/', '/fuel/', '/food/', '/hum/', '/roads/', '/traffic/', '/borders/', '/app/', '/rewards/', '/integration/'];
await mkdir('tests/out', { recursive: true });
const srv = await serve(OUT, 8765), srv2 = await serve(DIST, 8766);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Africa/Khartoum' });
// keep the test offline: block Google Fonts / CDNs
await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
const base = 'http://localhost:8765';
const kpiText = () => page.$$eval('.kpi .v', els => els.map(e => e.textContent.trim()));
let fail = 0;
const check = (c, msg) => { if (!c) { fail++; console.log('FAIL', msg); } };

const kpis = {};
for (const r of ROUTES) {
  await page.goto(base + r);
  await page.waitForSelector('.page h2', { timeout: 10000 });
  await page.waitForTimeout(400);
  const n = await page.$$eval('canvas', c => c.length), svg = await page.$$eval('.map svg', c => c.length);
  kpis[r] = await kpiText();
  const name = r === '/' ? 'overview' : r.replaceAll('/', '');
  await page.screenshot({ path: `tests/out/${name}.png`, fullPage: true });
  console.log(r.padEnd(14), 'canvases', n, 'maps', svg, 'kpis', kpis[r].length);
}
// client-side navigation via the sidebar keeps filters
await page.goto(base + '/');
await page.waitForSelector('.page h2');
await page.selectOption('#fState', 'SDA'); await page.selectOption('#fPeriod', '3');
await page.waitForTimeout(200);
const ovFiltered = await kpiText();
await page.click('.nav a[href="/fuel/"]'); await page.waitForSelector('text=استهلاك الوقود في قطاع النقل');
check(await page.$eval('#fState', e => e.value) === 'SDA', 'state filter persists across navigation');
for (const r of ['/food/', '/hum/', '/roads/', '/traffic/', '/borders/']) { await page.click(`.nav a[href="${r}"]`); await page.waitForTimeout(250); }
// traffic slider + borders simulator
await page.click('.nav a[href="/traffic/"]'); await page.waitForSelector('input[type=range]');
await page.fill('input[type=range]', '60'); await page.waitForTimeout(150);
check((await page.textContent('.page')).includes('تحويل 60%'), 'traffic slider updates insight');
await page.click('.nav a[href="/borders/"]'); await page.waitForSelector('#bxSel');
await page.selectOption('#bxSel', 'ARG'); await page.waitForTimeout(150);
check((await page.textContent('.page')).includes('رحلات تُعاد توجيهها') || (await page.textContent('.page')).includes('لا توجد رحلات'), 'closure simulator reroutes');
// inspector flow
await page.click('.nav a[href="/app/"]'); await page.waitForSelector('text=تسجيل الدخول');
await page.click('text=تسجيل الدخول'); await page.waitForTimeout(150);
await page.screenshot({ path: 'tests/out/app_home.png' });
await page.click('.atab button:nth-child(2)'); await page.click('text=محاكاة مسح رمز QR'); await page.waitForSelector('text=بدء الفحص', { timeout: 3000 });
await page.screenshot({ path: 'tests/out/app_trip.png' });
await page.click('text=بدء الفحص');
const ok = await page.locator('.tg button.ok').count();
for (let k = 0; k < ok; k++) await page.locator('.tg button.ok').nth(k).click();
await page.click('text=قراءة الميزان');
await page.screenshot({ path: 'tests/out/app_check.png' });
await page.click('text=اعتماد نتيجة الفحص'); await page.waitForSelector('.pts.pop');
await page.screenshot({ path: 'tests/out/app_result.png' });
const evs = await page.$$eval('#__next, .card code', c => c.map(x => x.textContent));
check(evs.includes('inspection.completed') && evs.includes('points.awarded'), 'events emitted: ' + evs.join(','));
// rewards tabs
await page.click('.nav a[href="/rewards/"]'); await page.waitForSelector('.seg');
for (const l of ['شركات النقل', 'ملاك المركبات', 'مكاتب الشحن']) { await page.click(`.seg >> text=${l}`); await page.waitForTimeout(100); }
// legacy hash link
await page.goto(base + '/#roads'); await page.waitForURL('**/roads/'); check(true, '');

// same numbers as the static build
const p2 = await ctx.newPage();
p2.on('pageerror', e => errs.push('STATIC ' + e.message));
await p2.goto('http://localhost:8766/index.html'); await p2.waitForTimeout(800);
for (const [hash, r] of [['overview', '/'], ['fuel', '/fuel/'], ['food', '/food/'], ['roads', '/roads/'], ['borders', '/borders/']]) {
  await p2.evaluate(h => { location.hash = '#' + h; }, hash); await p2.waitForTimeout(300);
  const old = await p2.$$eval(`#pg-${hash} .kpis .kpi .v`, els => els.map(e => e.textContent.trim()));
  const same = JSON.stringify(old) === JSON.stringify(kpis[r]);
  check(same, `${r} KPIs differ\n  static: ${old}\n  next:   ${kpis[r]}`);
  if (same) console.log(`${r.padEnd(14)} KPIs match static build`);
}
console.log('overview (SDA, 3m):', ovFiltered.join(' | '));
console.log(errs.length ? 'console:\n' + [...new Set(errs)].join('\n') : 'no console errors');
await browser.close(); srv.close(); srv2.close();
if (fail) { console.log(fail, 'check(s) failed'); process.exit(1); }
console.log('all checks passed');
