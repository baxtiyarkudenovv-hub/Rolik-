// node preview.js <outdir> t1 t2 ...   — saves single frames for checking
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2], times = process.argv.slice(3).map(Number);
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto('file://' + path.resolve(__dirname, 'film.html') + '?render'); await pg.evaluate(() => window.ready);
  if (!times.length) { console.log(JSON.stringify(await pg.evaluate(() => window.TIMELINE.scenes))); }
  for (const t of times) { await pg.evaluate(t => draw(t), t); await pg.locator('canvas').screenshot({ path: `${out}/f_${t}.jpg`, type: 'jpeg', quality: 70 }); }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
