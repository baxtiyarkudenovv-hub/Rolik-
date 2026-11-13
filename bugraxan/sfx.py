"""Buǵraxan esteligi — muzıkasız kino ses dizaynı: ambientler + ótiw effektleri (numpy).
Qollanıw: python3 sfx.py timeline.json out.wav"""
import numpy as np, json, sys, wave
SR = 44100
TL = json.load(open(sys.argv[1])); OUT = sys.argv[2]
T = TL['total'] + 1; N = int(T * SR)
rng = np.random.default_rng(5)
amb = np.zeros((N, 2)); fx = np.zeros((N, 2))

def add(bus, sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i < 0 and -i >= len(sig): return
    if i < 0: sig = sig[-i:]; i = 0
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt((1 - pan) / 2), sig * np.sqrt((1 + pan) / 2)], 1) * 1.414
    j = min(N, i + len(sig)); bus[i:j] += sig[:j - i] * g
def env(n, a, r, c=1.0):
    e = np.ones(n); ai, ri = min(n, int(a * SR)), min(n, int(r * SR))
    if ai: e[:ai] = np.linspace(0, 1, ai) ** c
    if ri: e[-ri:] *= np.linspace(1, 0, ri) ** c
    return e
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4), len(x))
def noise(n): return rng.standard_normal(n)
def st(n, lo, hi): return np.stack([bp(noise(n), lo, hi), bp(noise(n), lo, hi)], 1)

# ---------- ambiences ----------
def wind(t0, d, g=.07):
    n = int(d * SR); tt = np.arange(n) / SR; s = st(n, 90, 900)
    lfo = (.55 + .45 * np.sin(2 * np.pi * .08 * tt + rng.random() * 6) * np.sin(2 * np.pi * .027 * tt + 1))[:, None]
    gust = bp(noise(n), 900, 3500)[:, None] * (np.clip(np.sin(2 * np.pi * .05 * tt + 2), 0, 1) ** 3)[:, None] * .25
    add(amb, (s * lfo + gust) * env(n, 1.2, 1.2)[:, None], t0, g)
def water(t0, d, g=.12):
    n = int(d * SR); tt = np.arange(n) / SR; s = st(n, 80, 1400) * (.7 + .3 * np.sin(2 * np.pi * .4 * tt))[:, None]
    gur = st(n, 1500, 6000) * .35; add(amb, (s + gur) * env(n, 1, 1)[:, None], t0, g)
def rain(t0, d, g=.07):
    n = int(d * SR); s = st(n, 2500, 11000)
    for _ in range(int(d * 30)):  # droplets
        i = int(rng.random() * (n - 800)); k = np.exp(-np.arange(800) / 90) * np.sin(np.arange(800) * 2 * np.pi * (2000 + rng.random() * 3000) / SR); s[i:i + 800, rng.integers(2)] += k * 2.5
    add(amb, s * env(n, 1, 1)[:, None], t0, g)
def murmur(t0, d, g=.05):  # distant crowd: many formant-like band noises with syllabic modulation
    n = int(d * SR); tt = np.arange(n) / SR; s = np.zeros((n, 2))
    for v in range(10):
        f = 300 + rng.random() * 900; m = np.clip(np.sin(2 * np.pi * (2.5 + rng.random() * 3) * tt + rng.random() * 6), 0, 1) ** 2 * np.clip(np.sin(2 * np.pi * (.15 + rng.random() * .2) * tt + rng.random() * 6), 0, 1)
        b = bp(noise(n), f * .7, f * 1.4) * m; pan = rng.uniform(-.8, .8); s[:, 0] += b * np.sqrt((1 - pan) / 2); s[:, 1] += b * np.sqrt((1 + pan) / 2)
    add(amb, s * env(n, 1, 1)[:, None], t0, g)
def projector(t0, d, g=.06):
    n = int(d * SR); s = np.zeros(n); per = int(SR / 24)
    for i in range(0, n - 400, per): s[i:i + 400] += np.exp(-np.arange(400) / 40) * noise(400) * (.6 + .4 * rng.random())
    s = bp(s, 300, 6000) + bp(noise(n), 2000, 9000) * .15
    add(amb, s * env(n, .8, .8), t0, g)
def room(t0, d, g=.04): n = int(d * SR); add(amb, st(n, 40, 300) * env(n, 1, 1)[:, None], t0, g)
def build_site(t0, d, g=.25):  # bricks placed, trowel scrapes
    for k in range(int(d * 3.2)):
        t = t0 + .6 + k / 3.2 + rng.random() * .15
        n = int(.18 * SR); e = np.exp(-np.arange(n) / (SR * .02))
        clack = bp(noise(n), 500, 4000) * e + np.sin(2 * np.pi * (180 + rng.random() * 80) * np.arange(n) / SR) * e * .8
        add(fx, clack, t, g * (.5 + .5 * rng.random()), rng.uniform(-.6, .6))

# ---------- transitions & accents ----------
def whoosh(c, d=1.4, g=.22):
    n = int(d * SR); tt = np.linspace(0, 1, n); shape = np.sin(np.pi * tt ** .8) ** 2
    s = bp(noise(n), 250, 5000) * shape; pan = np.linspace(-.8, .8, n)
    add(fx, np.stack([s * np.sqrt((1 - pan) / 2), s * np.sqrt((1 + pan) / 2)], 1) * 1.4, c - d * .55, g)
def boom(t, g=.6, f0=34):
    n = int(4 * SR); tt = np.arange(n) / SR
    s = np.sin(2 * np.pi * np.cumsum(f0 + 46 * np.exp(-tt * 7)) / SR) * np.exp(-tt * 1.4) + bp(noise(n), 40, 500) * np.exp(-tt * 3) * .5
    add(fx, s, t, g)
def riser(end, d=2.5, g=.15):
    n = int(d * SR); tt = np.linspace(0, 1, n); s = bp(noise(n), 600, 9000) * tt ** 3 + np.sin(2 * np.pi * np.cumsum(220 * 4 ** tt) / SR) * tt ** 3 * .25
    add(fx, s, end - d, g)
def shimmer(t, g=.09):
    n = int(2.2 * SR); tt = np.arange(n) / SR; s = np.zeros(n)
    for k, f in enumerate((1568, 2093, 2637, 3136, 4186)):
        s += np.sin(2 * np.pi * f * tt + k) * np.exp(-tt * (2.2 + k * .4)) * np.clip((tt - k * .05) * 40, 0, 1) / (1 + k * .4)
    s += bp(noise(n), 6000, 14000) * np.exp(-tt * 4) * .3
    add(fx, s, t, g, rng.uniform(-.3, .3))
def tick(t, g=.08): n = int(.05 * SR); add(fx, bp(noise(n), 2000, 8000) * np.exp(-np.arange(n) / (SR * .004)), t, g, rng.uniform(-.2, .2))
def thud(t, g=.35): n = int(.6 * SR); tt = np.arange(n) / SR; add(fx, np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 9) + bp(noise(n), 200, 2500) * np.exp(-tt * 40) * .4, t, g)
def flash(t, g=.18):  # bright swell for golden flash transitions
    n = int(1.6 * SR); tt = np.linspace(0, 1, n); s = bp(noise(n), 1500, 12000) * np.sin(np.pi * tt) ** 3
    add(fx, s, t - .8, g); shimmer(t - .1, .05)
def scan(t, g=.18):
    n = int(2.2 * SR); tt = np.linspace(0, 1, n); f = 300 * 8 ** tt
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt) ** 2 * .3 + bp(noise(n), 2000, 9000) * np.sin(np.pi * tt) ** 2 * .6
    pan = np.linspace(-.9, .9, n); add(fx, np.stack([s * np.sqrt((1 - pan) / 2), s * np.sqrt((1 + pan) / 2)], 1) * 1.4, t, g)

# ambiences by shot image
MARKET = {'01', '04', '06', '07', '09', '23', '30', '26', '24', '28'}
for s in TL['shots']:
    a, b, img = s['a'], s['b'], s['img']; d = b - a + .6
    if s['scene'] == 'exped': projector(a, d); wind(a, d, .04)
    elif img in ('10', '11'): water(a, d, .13); rain(a, d, .07)
    elif img == '12': water(a, d, .03); wind(a, d, .05)
    elif img == 'BUILD': wind(a, d, .05); build_site(a + 2, d - 4)
    elif img in MARKET: murmur(a, d, .045); wind(a, d, .035)
    elif img in ('16', '17', '18', '13', '20', '29', '27'): room(a, d, .05); wind(a, d, .03)
    else: wind(a, d, .07)
for sc in TL['scenes']:
    if sc['id'] == 'intro': wind(0, sc['d'] + 1, .08); riser(2.4, 2.4, .12); boom(2.4, .7); shimmer(2.6, .1)
    if sc['id'] == 'finale': boom(sc['segs'][1] - .3, .45)
    if sc['id'] == 'end': boom(sc['t0'] + .8, .65); shimmer(sc['t0'] + 1, .1); wind(sc['t0'], sc['d'], .04)
for e in TL['events']:
    t, k = e['t'], e['k']
    if k == 'chapter': boom(t + .05, .4); whoosh(t + .2, 1.6, .16)
    elif k == 'tr':
        tr = e.get('tr', 'luma')
        if tr == 'flash': flash(t + .55)
        elif tr == 'scan': scan(t)
        elif tr == 'depth': whoosh(t + .55, 1.5, .2); boom(t + .6, .18, 50)
        else: whoosh(t + .5, 1.3, .14)
    elif k == 'gold': shimmer(t, .07)
    elif k == 'info':
        ty = e.get('ty')
        shimmer(t + .1, .06)
        if ty in ('counter', 'timescan', 'area'):
            for i in range(26): tick(t + .2 + i * .08 * (1 + i / 30), .05)
        if ty in ('stamp', 'doc'): thud(t + .45 if ty == 'stamp' else t + 1.95, .4)
        if ty == 'signal':
            for i in range(4): shimmer(t + i * .55, .035)
        if ty in ('century', 'map', 'parts'): boom(t + .1, .15, 60)

mix = amb + fx
mix /= np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix * 1.3) * .9
with wave.open(OUT, 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', OUT, round(T, 1))
