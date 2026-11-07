"""Modern cinematic sound design (no music) + narrator mix.
Usage: python3 sfx.py out.wav   (reads timeline.json and assets/media/diktor.wav)"""
import numpy as np, wave, json, os, sys, subprocess, tempfile
ROOT = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(ROOT, 'timeline.json')))
SR = 48000; T = TL['total']; N = int(SR * (T + 3))
rng = np.random.default_rng(11)
bus = np.zeros((N, 2))
nf = lambda m: 440 * 2 ** ((m - 69) / 12)
tt_ = lambda d: np.arange(int(d * SR)) / SR

def add(sig, start, g=1.0, pan=0.0):
    i = int(start * SR)
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt((1 - pan) / 2), sig * np.sqrt((1 + pan) / 2)], 1) * 1.414
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); bus[i:j] += sig[:j - i] * g
def env(n, a, r):
    e = np.ones(n); ai, ri = int(a * SR), int(r * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai) ** 2
    if ri: e[-ri:] *= np.linspace(1, 0, ri) ** 1.5
    return e
def svf(x, fc, q=1.5, mode='bp'):
    lp = bp = 0.0; y = np.empty_like(x); d = 1 / q
    f = 2 * np.sin(np.pi * np.clip(np.broadcast_to(fc, x.shape), 20, SR / 6) / SR)
    for i in range(len(x)):
        hp = x[i] - lp - d * bp; bp += f[i] * hp; lp += f[i] * bp
        y[i] = bp if mode == 'bp' else (lp if mode == 'lp' else hp)
    return y
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)
def saw(freq, t): ph = np.cumsum(np.broadcast_to(freq, t.shape)) / SR; return 2 * (ph % 1) - 1
def stereo_pan(y, p0, p1):
    pan = np.linspace(p0, p1, len(y)); return np.stack([y * np.sqrt((1 - pan) / 2), y * np.sqrt((1 + pan) / 2)], 1) * 1.414

# ---------------- instruments ----------------
def whoosh(center, d=1.0, g=.5, f0=300, f1=5000, pans=(-.9, .9), tone=True):
    t = tt_(d); u = t / d; shape = np.sin(np.pi * u ** .75) ** 2.2
    fc = f0 * (f1 / f0) ** np.sin(np.pi * u ** .8)
    y = norm(svf(rng.standard_normal(len(t)), fc, 1.3)) * .8
    y += norm(svf(rng.standard_normal(len(t)), fc * .35, 2.5)) * .4          # low body
    if tone: y += np.sin(2 * np.pi * np.cumsum(fc * .12) / SR) * .25 * (1 + .5 * np.sin(2 * np.pi * 18 * t))  # doppler swish tone
    add(stereo_pan(norm(y) * shape, *pans), center - d * .6, g)
def swish(t0, g=.25, d=.35, up=True):
    t = tt_(d); u = t / d; fc = 1500 + 7000 * (u if up else 1 - u)
    add(stereo_pan(norm(svf(rng.standard_normal(len(t)), fc, 2)) * np.sin(np.pi * u) ** 2, -.4, .4), t0 - d * .5, g)
def sub_drop(t0, g=.8, d=1.6):
    t = tt_(d); f = 30 + 55 * np.exp(-t * 3.5)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) * env(len(t), .005, .3), t0, g)
def braam(t0, g=.55, d=2.6, root=45):
    t = tt_(d); y = np.zeros(len(t))
    for m, a in ((root, 1), (root + 7, .6), (root + 12, .7), (root + 12.08, .5), (root - 12, .6)):
        y += saw(nf(m) * (1 + .003 * np.sin(2 * np.pi * .7 * t)), t) * a
    cut = 120 + 2600 * np.exp(-t * 2.4) * (1 - np.exp(-t * 40))
    y = svf(y, cut, .9, 'lp'); y = np.tanh(1.6 * norm(y))
    add(y * env(len(t), .01, 1.2), t0, g)
def impact(t0, g=.9):
    t = tt_(2.2)
    kick = np.sin(2 * np.pi * np.cumsum(42 + 140 * np.exp(-t * 22)) / SR) * np.exp(-t * 3.2)
    crack = norm(svf(rng.standard_normal(len(t)), 2200, .8)) * np.exp(-t * 30) * .7
    body = norm(svf(rng.standard_normal(len(t)), 180, 1.2)) * np.exp(-t * 6) * .5
    add(np.tanh(1.4 * (kick + crack + body)), t0, g)
def hit(t0, g=.5):
    t = tt_(.9)
    k = np.sin(2 * np.pi * np.cumsum(55 + 110 * np.exp(-t * 28)) / SR) * np.exp(-t * 6)
    n = norm(svf(rng.standard_normal(len(t)), 3500, .7)) * np.exp(-t * 45) * .5
    add(k + n, t0, g)
def rev_swell(t_end, d=.9, g=.35):
    t = tt_(d); u = t / d
    y = norm(svf(rng.standard_normal(len(t)), 600 + 5000 * u ** 2, 1.1)) * u ** 3
    y += np.sin(2 * np.pi * nf(81) * t) * u ** 4 * .25
    add(stereo_pan(y, .6, -.2), t_end - d, g)
def riser(t_end, d=2.0, g=.35):
    t = tt_(d); u = t / d
    f = 80 * 8 ** (u ** 1.6)
    y = saw(f, t) * .35 + saw(f * 1.5, t) * .25 + saw(f * 2.01, t) * .2
    y = svf(y, 300 + 6000 * u ** 2, 1.4, 'lp') * (1 + .4 * np.sin(2 * np.pi * (4 + 18 * u) * t))
    y += norm(svf(rng.standard_normal(len(t)), 800 + 9000 * u ** 2, 1.5)) * .5
    add(stereo_pan(norm(y) * u ** 2.2, -.5, .5), t_end - d, g)
def glitch(t0, d=.6, g=.3):
    n = int(d * SR); y = np.zeros(n); i = 0
    while i < n:
        L = int(rng.uniform(.01, .05) * SR); kind = rng.integers(4); tl = np.arange(L) / SR
        if kind == 0: seg = np.sign(np.sin(2 * np.pi * rng.choice([90, 220, 880, 3000]) * tl))
        elif kind == 1: seg = rng.standard_normal(L)
        elif kind == 2: seg = np.round(np.sin(2 * np.pi * rng.uniform(200, 2000) * tl) * 4) / 4
        else: seg = np.zeros(L)
        y[i:i + L] = (seg * rng.uniform(.3, 1))[:n - i]; i += L
    add(stereo_pan(y * env(n, .005, .08), rng.uniform(-.8, 0), rng.uniform(0, .8)), t0 - d / 2, g)
def tick(t0, g=.18, f=2400):
    t = tt_(.06); add(np.sin(2 * np.pi * f * t) * np.exp(-t * 90) + norm(svf(rng.standard_normal(len(t)), 6000, 1)) * np.exp(-t * 200) * .4, t0, g, pan=rng.uniform(-.3, .3))
def pop(t0, g=.3, f0=900):
    t = tt_(.18); add(np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.2 * np.exp(-t * 40))) / SR) * np.exp(-t * 22), t0, g)
def ui_click(t0, g=.35):
    t = tt_(.08); add(np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 80) + rng.standard_normal(len(t)) * np.exp(-t * 300) * .3, t0, g)
def ding(t0, g=.28, notes=(88, 95)):
    for k, m in enumerate(notes):
        t = tt_(1.6); c = np.sin(2 * np.pi * nf(m) * t + 1.2 * np.sin(2 * np.pi * nf(m) * 1.41 * t) * np.exp(-t * 6))
        add(c * np.exp(-t * 3.2) * env(len(t), .002, .3), t0 + k * .11, g, pan=(-.25, .25)[k % 2])
def alert(t0, g=.3):
    for k, m in enumerate((76, 72)):
        t = tt_(.32); y = svf(saw(nf(m), t) + saw(nf(m) * 1.007, t), 2400, 1.2, 'lp')
        add(norm(y) * env(len(t), .005, .12), t0 + k * .24, g)
    sub_drop(t0, .35, .8)
def shimmer(t0, g=.2, notes=(84, 88, 91, 96, 100)):
    for k, m in enumerate(notes):
        t = tt_(2.0); y = (np.sin(2 * np.pi * nf(m) * t) + .3 * np.sin(2 * np.pi * nf(m) * 2.76 * t)) * np.exp(-t * 2.6)
        add(y * env(len(t), .004, .4), t0 + k * .055, g / len(notes) * 2.2, pan=np.sin(k * 1.7) * .7)
    add(stereo_pan(norm(svf(rng.standard_normal(int(1.2 * SR)), 9000, 1.2)) * np.exp(-tt_(1.2) * 3.5), -.6, .6), t0, g * .5)
def success(t0, g=.3):
    shimmer(t0, g * .8, (72, 76, 79, 84, 88, 91)); impact(t0 - .02, .25)
def text_slam(t0, g=.5):  # big word landing
    hit(t0, g); swish(t0 - .05, g * .5, .3, False); add(stereo_pan(norm(svf(rng.standard_normal(int(.7 * SR)), 4000, .8)) * np.exp(-tt_(.7) * 7), -.5, .5), t0, g * .25)
def letters(t0, n, stg, g=.06):  # soft typing ticks under per-letter animation
    for i in range(n):
        if i % 2 == 0: tick(t0 + i * stg + .12, g, 1800 + 900 * rng.random())
def skitter(t0, d, g=.12):
    k = t0
    while k < t0 + d: tick(k, g * rng.uniform(.5, 1), rng.uniform(3000, 6000)); k += rng.uniform(.03, .09)
def crumble(t0, d=1.4, g=.35):
    t = tt_(d); y = rng.standard_normal(len(t)) * (rng.random(len(t)) > .985) * 3
    y = svf(y + rng.standard_normal(len(t)) * .15, 2500 - 1500 * t / d, 1.2) * np.exp(-t * 2)
    add(stereo_pan(norm(y), -.6, .6), t0, g)

# ---------------- timeline events ----------------
S = {}; a = 0
for sid, d in TL['scenes']: S[sid] = a; a += d
TRANS = ['zoom', 'glitch', 'cube', 'wipe', 'cube', 'iris', 'zoom', 'cube']
# logo
L = S['logo']
riser(L + 1.9, 1.9, .3); rev_swell(L + 1.9, 1.0, .35)
for j, e in enumerate((1.9, 1.9, 1.9)): whoosh(L + 1.55 + j * .12, .9, .3, 250, 4500, ((-1, .2), (.9, -.2), (-.2, 1))[j])
braam(L + 1.9, .6); impact(L + 1.9, 1.0); sub_drop(L + 1.9, .7, 2.2); shimmer(L + 2.0, .22)
whoosh(L + 3.7, 1.2, .3, 500, 7000, (-.8, .8)); shimmer(L + 3.5, .14, (79, 84, 88)); pop(L + 4.2, .2, 700)
shimmer(L + 5.0, .16, (91, 96, 100, 103))
# transitions
for sid, typ in zip([s for s, _ in TL['scenes'][1:]], TRANS):
    b = S[sid]
    if typ == 'zoom': riser(b, .9, .22); whoosh(b, 1.0, .5, 200, 6000); impact(b, .55)
    elif typ == 'glitch': glitch(b, .7, .35); whoosh(b, .8, .3, 400, 5000); hit(b, .5)
    elif typ == 'cube': whoosh(b, 1.3, .55, 120, 3500, (-.9, .9)); sub_drop(b + .1, .45, 1.2); hit(b + .15, .4)
    elif typ == 'wipe': whoosh(b, .8, .5, 800, 9000, (-1, 1)); hit(b, .35)
    elif typ == 'iris': whoosh(b, 1.0, .45, 300, 6000); shimmer(b + .1, .14)
# s1
s = S['s1']; whoosh(s + 1.0, 1.2, .35, 150, 3000); impact(s + 1.05, .45)
for k in range(4): pop(s + .9 + k * .18, .12, 600 + k * 150)
letters(s + .5, 16, .018, .04)
rev_swell(s + 3.0, .7, .25); letters(s + 2.9, 15, .045, .07); text_slam(s + 3.6, .55); braam(s + 3.6, .3, 2.0, 50)
pop(s + 5.15, .35, 500); alert(s + 5.4, .25)
# s2
s = S['s2']; whoosh(s + .6, 1.2, .35, 150, 3000); skitter(s + .4, 2.2, .1)
glitch(s + 1.6, .6, .3); text_slam(s + 1.8, .45); text_slam(s + 2.3, .45)
alert(s + 2.5, .32); glitch(s + 2.8, .4, .2)
whoosh(s + 3.9, 1.0, .25, 80, 1200); sub_drop(s + 3.6, .4)
for i in range(9): swish(s + 4.6 + i * .42, .09, .3)
letters(s + 4.4, 14, .02, .04)
whoosh(s + 8.5, .7, .3, 600, 6000); text_slam(s + 9.6, .55); glitch(s + 9.5, .3, .15)
# s3
s = S['s3']; whoosh(s + .9, 1.3, .4, 150, 3500); impact(s + 1.0, .3)
swish(s + 1.3, .25, .45); letters(s + 1.9, 20, .016, .04)
whoosh(s + 7.0, 1.2, .35, 200, 4000); rev_swell(s + 7.2, .7, .2); text_slam(s + 7.3, .55); text_slam(s + 7.75, .35)
for c in (8.1, 8.9, 10.4): swish(c + s + .1, .25, .35); pop(s + c + .35, .22, 700); tick(s + c + .5, .12)
# s4
s = S['s4']; whoosh(s + .9, 1.2, .35, 150, 3000); pop(s + .7, .3, 520); shimmer(s + .8, .12, (84, 88, 91))
letters(s + 1.3, 15, .02, .04); text_slam(s + 3.1, .5)
t = tt_(2.4); add(stereo_pan(np.sin(2 * np.pi * np.cumsum(900 + 500 * np.sin(2 * np.pi * .8 * t)) / SR) * .15 * np.sin(np.pi * t / 2.4) * (1 + .5 * np.sign(np.sin(2 * np.pi * 9 * t))), -.4, .4), s + 3.4, .35)
alert(s + 6.2, .35); swish(s + 6.4, .25); pop(s + 6.6, .2); swish(s + 8.4, .25); ding(s + 8.6, .2)
whoosh(s + 10.6, 1.3, .5, 100, 3500); impact(s + 11.0, .5); pop(s + 11.2, .3, 400); ui_click(s + 11.25, .4)
letters(s + 11.8, 17, .02, .04); text_slam(s + 12.9, .5); text_slam(s + 13.5, .55); braam(s + 13.5, .25, 1.8, 41)
# s5 steps
s = S['s5']; st = [0]
for d in TL['steps'][:-1]: st.append(st[-1] + d)
for k, o in enumerate(st):
    if k: whoosh(s + o + .35, .8, .35, 300, 5000)
    swish(s + o + .2, .2, .3); text_slam(s + o + .6, .3)
o = s + st[0]; ui_click(o + 3.7); alert(o + 4.25, .3); pop(o + 4.3, .25, 500)
o = s + st[1]; ui_click(o + 4.9); whoosh(o + 6.7, .7, .35, 800, 8000, (.8, -.8))
o = s + st[2]; ui_click(o + 1.4); pop(o + 1.55, .25, 1100); tick(o + 1.7, .2, 3200)
o = s + st[3]; ui_click(o + 1.5); crumble(o + 3.8, 1.4, .4); glitch(o + 3.9, .5, .18); success(o + 4.7, .4)
# s6
s = S['s6']; whoosh(s + .8, 1.2, .35, 150, 3000)
for k in range(6): add(stereo_pan(np.sin(2 * np.pi * 180 * tt_(1.2)) * np.exp(-tt_(1.2) * 3) * .3, -.3, .3), s + 1 + k * 2.2, .25)
ding(s + 1.1); ding(s + 3.8); alert(s + 7.3, .33)
letters(s + .4, 16, .02, .04); text_slam(s + 3.6, .55); text_slam(s + 4.1, .45)
for c in (7.2, 10.8): swish(s + c + .1, .25, .35); pop(s + c + .35, .22, 700)
success(s + 11.2, .25)
# s7
s = S['s7']; whoosh(s + 1.0, 1.4, .45, 120, 3500); impact(s + 1.1, .35); pop(s + .6, .3, 520)
letters(s + 1.2, 18, .012, .035)
for k in range(4): tick(s + 3.0 + k * .07 + .3, .2, 1400)
impact(s + 3.45, .45); text_slam(s + 4.1, .5); shimmer(s + 3.8, .25); swish(s + 4.9, .2, .5)
# end
s = S['end']; whoosh(s + .6, 1.3, .4, 150, 4000, (-.8, .2)); whoosh(s + 1.1, 1.0, .35, 250, 5000, (.8, -.2))
braam(s + .9, .4, 3.2, 45); impact(s + .9, .6); shimmer(s + 1.5, .2); shimmer(s + 2.0, .16, (91, 96, 100)); swish(s + 2.6, .2, .6)

# ---------------- reverb on SFX ----------------
irn = int(2.2 * SR); ir = rng.standard_normal((irn, 2)) * np.exp(-np.arange(irn) / SR * 2.6)[:, None] * .015
ir[:int(.02 * SR)] = 0
for c in range(2):
    nfft = 1 << (N + irn - 1).bit_length()
    bus[:, c] += np.fft.irfft(np.fft.rfft(bus[:, c], nfft) * np.fft.rfft(ir[:, c], nfft), nfft)[:N] * .55

# ---------------- voice ----------------
tmp = tempfile.mktemp(suffix='.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(ROOT, '..', 'assets', 'media', 'diktor.wav'), '-af',
                'highpass=f=75,lowpass=f=15000,acompressor=threshold=-21dB:ratio=3:attack=6:release=120:makeup=2,loudnorm=I=-16:TP=-2:LRA=9',
                '-ar', str(SR), '-ac', '1', tmp], check=True)
with wave.open(tmp) as w: v = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
os.remove(tmp)
vox = np.zeros(N); i0 = int(TL['voff'] * SR); vox[i0:i0 + len(v)] = v[:N - i0]
duck = np.full(N, .62)                       # SFX level without narration
for a, b in TL['blocks']: duck[int((a - .2) * SR):int((b + .25) * SR)] = .22   # well under the narrator
k = int(.12 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same')
sfx = bus / (np.max(np.abs(bus)) + 1e-9) * .8
out = sfx * duck[:, None] + vox[:, None] * .95
_m = np.zeros(N, bool)
for a_, b_ in TL['blocks']: _m[int(a_ * SR):int(b_ * SR)] = True
_r = lambda z: 20 * np.log10(np.sqrt(np.mean(z ** 2)) + 1e-12)
print('during narration: voice RMS %.1f dB, SFX RMS %.1f dB' % (_r(vox[_m] * .95), _r((sfx * duck[:, None])[_m].mean(1))))
out = out[:int(T * SR)]
fl = int(1.2 * SR); out[-fl:] *= np.linspace(1, 0, fl)[:, None]
out = np.tanh(out * 1.1) / np.tanh(1.1) * .97
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
print('wrote', sys.argv[1], round(len(out) / SR, 2), 's')
