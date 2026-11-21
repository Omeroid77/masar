/* Phone / tablet screenshots + horizontal-overflow check. Run after `npm run build`. */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
const OUT = resolve('out');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = createServer(async (q, s) => { let p = join(OUT, decodeURIComponent(q.url.split('?')[0])); try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); s.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); s.end(await readFile(p)); } catch { s.writeHead(404); s.end(); } }).listen(8767);
await mkdir('tests/out', { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
let bad = 0;
for (const [w, h] of [[390, 844], [820, 1180]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, timezoneId: 'Africa/Khartoum' });
  await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const pg = await ctx.newPage();
  for (const r of ['/', '/traffic/', '/borders/', '/app/', '/rewards/']) {
    await pg.goto('http://localhost:8767' + r); await pg.waitForSelector('.page h2'); await pg.waitForTimeout(300);
    const over = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 0) { bad++; console.log(`overflow ${over}px at ${w} ${r}`); }
    await pg.screenshot({ path: `tests/out/r${w}${r.replaceAll('/', '_')}.png` });
  }
  if (w === 390) { await pg.click('.menubtn'); await pg.waitForTimeout(300); await pg.screenshot({ path: 'tests/out/r390_drawer.png' }); }
  await ctx.close();
}
await b.close(); srv.close();
console.log(bad ? `${bad} overflow issue(s)` : 'no horizontal overflow at 390 / 820');
process.exit(bad ? 1 : 0);
