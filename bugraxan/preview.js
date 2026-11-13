// node preview.js <outdir> t1 t2 ... — айырым кадрлар (3D)
const { chromium } = require('playwright'); const serve = require('./serve');
(async () => {
  const out = process.argv[2], times = process.argv.slice(3).map(Number); const s = await serve();
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(s.url + '/' + (process.env.PAGE || 'film3d') + '.html?render'); await pg.waitForFunction(() => window.ready, null, { timeout: 180000 }); await pg.evaluate(() => window.ready);
  if (!times.length) console.log(JSON.stringify(await pg.evaluate(() => window.TIMELINE.scenes.map(e => [e.id, e.t0, e.segs]))));
  for (const t of times) { const a = Date.now(); await pg.evaluate(t => draw(t), t); await pg.locator('canvas').screenshot({ path: `${out}/f_${t}.jpg`, type: 'jpeg', quality: 75 }); console.log(t, (Date.now() - a) + 'ms'); }
  console.log(errs.join('\n') || 'no errors'); await b.close(); s.close();
})();
