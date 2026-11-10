// node render.js <out.mp4> — кадрлап рендер (4 параллель процесс), саундтрек ҳәм MP4 жыйнаў
const { chromium } = require('playwright'); const serve = require('./serve'); const { spawn, execFileSync } = require('child_process');
const path = require('path'), fs = require('fs');
const out = path.resolve(process.argv[2] || 'bugraxan.mp4'), nosubs = process.argv.includes('--nosubs');
const FPS = 25, JOBS = 4, tmp = path.resolve(__dirname, 'build'); fs.mkdirSync(tmp, { recursive: true });
let url;
async function part(k, a, b) {
  const br = await chromium.launch(); const pg = await br.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto(url); await pg.waitForFunction(() => window.ready, null, { timeout: 300000 }); await pg.evaluate(() => window.ready);
  const f = `${tmp}/part${k}.mp4`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS), f], { stdio: ['pipe', 'inherit', 'inherit'] });
  const cvs = pg.locator('canvas');
  for (let i = a; i < b; i++) {
    await pg.evaluate(t => draw(t), i / FPS);
    const buf = await cvs.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 500 === 0) console.log(`part ${k}: ${i - a}/${b - a}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close(); return f;
}
(async () => {
  const srv = await serve(); url = srv.url + '/film3d.html?render';
  const br = await chromium.launch(); const pg = await br.newPage(); await pg.goto(url); await pg.waitForFunction(() => window.TIMELINE, null, { timeout: 300000 });
  const tl = await pg.evaluate(() => window.TIMELINE); await br.close();
  fs.writeFileSync(path.join(__dirname, 'timeline.json'), JSON.stringify(tl, null, 1));
  const audio = `${tmp}/soundtrack.wav`;
  const py = spawn('python3', [path.join(__dirname, 'soundtrack.py'), path.join(__dirname, 'timeline.json'), audio], { stdio: 'inherit' }); const pyDone = new Promise(r => py.on('close', r));
  const n = Math.round(tl.total * FPS), per = Math.ceil(n / JOBS);
  const parts = await Promise.all([...Array(JOBS)].map((_, k) => part(k, k * per, Math.min(n, (k + 1) * per))));
  await pyDone;
  fs.writeFileSync(`${tmp}/list.txt`, parts.map(f => `file '${f}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-i', audio, '-c:v', 'copy',
    '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  console.log('done', out); srv.close();
})();
