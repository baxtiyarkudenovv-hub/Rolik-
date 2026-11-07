const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2]; const times = process.argv.slice(3).map(Number);
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.resolve(__dirname, 'rolik.html'));
  await pg.evaluate(() => document.fonts.ready);
  console.log('TOTAL', await pg.evaluate(() => window.TOTAL), await pg.evaluate(() => window.SCENE_STARTS));
  for (const t of times) { await pg.evaluate(t => draw(t), t); await pg.screenshot({ path: `${out}/f_${t}.jpg`, type: 'jpeg', quality: 70 }); }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
