// Renders rolik.html frame-by-frame and encodes MP4 (1920x1080, 30fps) with the soundtrack.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const [audio, out, fps = 30] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto('file://' + path.resolve(__dirname, 'rolik.html'));
  await pg.evaluate(() => window.assetsReady.then(() => document.fonts.ready));
  const tl = require('./timeline.json'); console.log(await pg.evaluate(tl => setTimeline(tl), tl));
  const total = await pg.evaluate(() => window.TOTAL);
  const n = Math.round(total * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', audio, '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-maxrate', '7000k', '-bufsize', '10000k', '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) {
    await pg.evaluate(async t => { await prepare(t); draw(t); }, i / fps);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${n}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done', out);
})();
