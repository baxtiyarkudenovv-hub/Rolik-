// node render_build.js [t...] — 3D qurılıs sahnasın footage/build/ ga kadrlap shıǵarıw (yamasa tek berilgen t kadrları)
const { chromium } = require('playwright'); const serve = require('./serve'); const fs = require('fs'), path = require('path');
(async () => {
  const s = await serve(); const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 804 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(s.url + '/build3d.html'); await pg.waitForFunction(() => window.ready, null, { timeout: 300000 });
  const ts = process.argv.slice(2).map(Number), out = path.join(__dirname, 'footage/build'); fs.mkdirSync(out, { recursive: true });
  const list = ts.length ? ts.map(t => [t, `/tmp/claude-0/pv/b_${t}.jpg`]) : [...Array(12 * 25).keys()].map(i => [i / 25, `${out}/f_${String(i).padStart(4, '0')}.jpg`]);
  for (const [t, f] of list) { await pg.evaluate(t => draw(t), t); await pg.locator('canvas').screenshot({ path: f, type: 'jpeg', quality: 90 }); }
  console.log(errs.join('\n') || 'ok'); await b.close(); s.close();
})();
