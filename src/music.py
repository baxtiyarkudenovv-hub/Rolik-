"""Cinematic soundtrack: music bed (ducked under voice), whooshes, risers, impacts, UI sounds, voiceover.
Usage: python3 music.py out.wav   (reads timeline.json; mixes ../voice/seg_XX.wav when present)"""
import numpy as np, wave, json, os, sys
ROOT = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(ROOT, 'timeline.json')))
SR = 44100; T = TL['total']; N = int(SR * T) + SR
rng = np.random.default_rng(7)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2)); vox = np.zeros((N, 2))
nf = lambda m: 440 * 2 ** ((m - 69) / 12)

def add(bus, sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); s = sig[:j - i] * gain
    if s.ndim == 1:
        bus[i:j, 0] += s * np.sqrt((1 - pan) / 2) * 1.414; bus[i:j, 1] += s * np.sqrt((1 + pan) / 2) * 1.414
    else: bus[i:j] += s
def env(n, a, r):
    e = np.ones(n); ai, ri = int(a * SR), int(r * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e
def svf_bp(x, fc, q=2.0):
    """State-variable band-pass with time-varying cutoff (array)."""
    lp = bp = 0.0; y = np.empty_like(x); damp = 1 / q
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    for i in range(len(x)):
        hp = x[i] - lp - damp * bp; bp += f[i] * hp; lp += f[i] * bp; y[i] = bp
    return y

# ---------- SFX ----------
def whoosh(center, d=1.0, g=.5, f0=250, f1=4000, pan_sweep=True):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    shape = np.sin(np.pi * tt ** .8) ** 2
    fc = f0 * (f1 / f0) ** (np.sin(np.pi * tt))  # up then down
    y = svf_bp(rng.standard_normal(n), fc, 1.6) * shape
    y /= np.max(np.abs(y)) + 1e-9
    if pan_sweep:
        pan = np.linspace(-.8, .8, n)
        st = np.stack([y * np.sqrt((1 - pan) / 2), y * np.sqrt((1 + pan) / 2)], 1) * 1.414
        add(sfx, st, center - d * .55, g)
    else: add(sfx, y, center - d * .55, g)
def riser(end, d=2.0, g=.35):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    y = svf_bp(rng.standard_normal(n), 300 * (30 ** tt ** 2), 3) * tt ** 2
    tone = np.sin(2 * np.pi * np.cumsum(110 * 4 ** tt ** 1.5) / SR) * tt ** 3 * .5
    y = y / (np.max(np.abs(y)) + 1e-9) + tone
    add(sfx, y, end - d, g)
def impact(t0, g=.9):
    n = int(2.5 * SR); tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(32 + 90 * np.exp(-tt * 9)) / SR) * np.exp(-tt * 2.2)
    nz = svf_bp(rng.standard_normal(n), np.full(n, 900.0), .7) * np.exp(-tt * 9) * .6
    add(sfx, sub + nz, t0, g)
def hit(t0, g=.45):
    n = int(1.0 * SR); tt = np.arange(n) / SR
    add(sfx, np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-tt * 14)) / SR) * np.exp(-tt * 5), t0, g)
def shimmer(t0, g=.18, notes=(84, 88, 91, 96)):
    for k, m in enumerate(notes):
        n = int(2.2 * SR); tt = np.arange(n) / SR
        y = (np.sin(2 * np.pi * nf(m) * tt) + .4 * np.sin(2 * np.pi * nf(m) * 2.01 * tt)) * np.exp(-tt * 2.2) * env(n, .01, .3)
        add(sfx, y, t0 + k * .07, g, pan=(-.5, .5, -.2, .3)[k % 4])
def chime(t0, notes=(72, 76, 79, 84), g=.16):
    for k, m in enumerate(notes):
        n = int(1.3 * SR); tt = np.arange(n) / SR
        add(sfx, (np.sin(2 * np.pi * nf(m) * tt) + .3 * np.sin(2 * np.pi * nf(m) * 3 * tt)) * np.exp(-tt * 4), t0 + k * .09, g)
def tap(t0):
    n = int(.07 * SR); tt = np.arange(n) / SR
    add(sfx, np.sin(2 * np.pi * 1700 * tt) * np.exp(-tt * 70) + .3 * rng.standard_normal(n) * np.exp(-tt * 200), t0, .3)
def alert(t0, g=.12):
    for k in range(3):
        n = int(.14 * SR); tt = np.arange(n) / SR
        add(sfx, np.tanh(3 * np.sin(2 * np.pi * 880 * tt)) * env(n, .005, .05), t0 + k * .19, g)
def glitch(t0, d=.7, g=.22):
    n = int(d * SR); y = np.zeros(n); i = 0
    while i < n:
        L = int(rng.uniform(.015, .06) * SR); f = rng.choice([180, 420, 900, 2500, 60])
        seg = np.sign(np.sin(2 * np.pi * f * np.arange(L) / SR)) * rng.uniform(.3, 1)
        if rng.random() < .4: seg = rng.standard_normal(L) * .7
        y[i:i + L] = seg[:n - i]; i += L
    add(sfx, y * env(n, .01, .1), t0 - d / 2, g)

starts = {}; a = 0
for sid, d in TL['scenes']: starts[sid] = (a, d); a += d
TRANS = ['zoom', 'glitch', 'wipe', 'iris', 'zoom', 'wipe', 'iris', 'zoom']
# logo intro
riser(1.9, 1.9, .3)
for k in range(3): whoosh(1.75 + k * .05, .9, .28, 200, 3500)
impact(1.9, 1.0); shimmer(2.0, .12)
whoosh(3.6, 1.1, .25, 400, 6000); shimmer(3.4, .14, (79, 84, 88, 91)); shimmer(4.2, .1, (91, 96))
whoosh(5.4, .9, .15, 1500, 8000)
# scene boundaries
bounds = [starts[s][0] for s, _ in TL['scenes'][1:]]
for b, typ in zip(bounds, TRANS):
    whoosh(b, 1.0, .45, 200, 5000); hit(b, .55)
    if typ == 'glitch': glitch(b, .8, .25)
    if typ == 'zoom': riser(b, .9, .18)
s, d = starts['s1']; impact(s + .4, .5); shimmer(s + 1.0, .1); whoosh(s + 2.3, .8, .25); alert(s + 3.2, .08)
s, d = starts['s2']; whoosh(s + 1.5, 1.6, .2, 150, 1200); alert(s + 2.6); hit(s + 2.6, .5)
for k in range(int((d - 5) / .45)):
    if k % 2 == 0: whoosh(s + 4.8 + k * .45, .5, .07, 800, 5000)
s, d = starts['s3']; shimmer(s + d * .2, .08, (76, 79, 84)); chime(s + d * .55, (79, 84), .1)
s, d = starts['s4']; whoosh(s + d * .22, 1.6, .12, 300, 2500, False); alert(s + d * .45); hit(s + d * .45, .45); hit(s + d * .7, .35)
s, d = starts['s5']; a = s
for k, sd in enumerate(TL['steps']):
    f = (.35, .3, .4, .3)[k]; tap(a + sd * f + .2)
    if k == 0: alert(a + sd * f + .7, .09)
    if k == 1: whoosh(a + sd * .55 + .35, .7, .2, 600, 6000)
    if k == 3: impact(a + sd * f + .7, .35); chime(a + sd * f + 1.5, (72, 76, 79, 84, 88), .16)
    a += sd
s, d = starts['s6']; chime(s + d * .1 + .2, (76, 79)); chime(s + d * .3 + .2, (76, 79)); alert(s + d * .55 + .1)
s, d = starts['s7']; impact(s + .3, .6); chime(s + .9, (72, 76, 79, 84, 88)); shimmer(s + 1.8, .12)
s, d = starts['end']; impact(s + .3, .7); shimmer(s + 1.2, .14)

# ---------- music bed ----------
prog = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
mstart = 6.6
for k in range(int((T - mstart) / 4) + 1):
    ch = prog[k % 4]; st = mstart + k * 4; n = int(4.8 * SR); tt = np.arange(n) / SR
    sig = sum(np.sin(2 * np.pi * nf(m) * tt + .3 * np.sin(2 * np.pi * .3 * tt)) + .35 * np.sin(2 * np.pi * nf(m) * 2.003 * tt) for m in ch)
    sig += .9 * np.sin(2 * np.pi * nf(ch[0] - 24) * tt)
    add(music, sig * env(n, 1.0, 1.4), st, .05)
for i in range(int((T - 2 - mstart) / .25)):
    st = mstart + i * .25; ch = prog[int((st - mstart) / 4) % 4]
    m = ch[i % 3] + 12 * (1 + (i // 3) % 2); n = int(.3 * SR); tt = np.arange(n) / SR
    add(music, np.sin(2 * np.pi * nf(m) * tt) * np.exp(-tt * 14), st, .04, pan=.4 if i % 2 else -.4)
for b in range(int((T - 3 - mstart) / .5)):
    st = mstart + b * .5; n = int(.25 * SR); tt = np.arange(n) / SR
    if b % 2 == 0: add(music, np.sin(2 * np.pi * np.cumsum(50 + 80 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 12), st, .3)
    hn = int(.05 * SR); add(music, rng.standard_normal(hn) * np.exp(-np.arange(hn) / SR * 80), st + .25, .02)
# intro drone under logo
n = int(7 * SR); tt = np.arange(n) / SR
add(music, (np.sin(2 * np.pi * 55 * tt) + .5 * np.sin(2 * np.pi * 82.4 * tt)) * env(n, 1.5, 2.5), 0, .12)

# ---------- voice ----------
duck = np.ones(N)
for at, i in TL['voice']:
    f = os.path.join(ROOT, '..', 'voice', f'seg_{i:02d}.wav')
    if not os.path.exists(f): continue
    with wave.open(f) as w:
        ch, sr = w.getnchannels(), w.getframerate()
        v = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
    v = v.reshape(-1, ch).mean(1)
    assert sr == SR, sr
    add(vox, v, at, 1.0)
    a0, a1 = int((at - .2) * SR), min(N, int((at + len(v) / SR + .3) * SR)); duck[max(0, a0):a1] = .38
k = int(.25 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same')
music *= duck[:, None]; sfx *= (.55 + .45 * duck)[:, None]

# ---------- simple reverb on sfx ----------
irn = int(1.8 * SR); ir = rng.standard_normal(irn) * np.exp(-np.arange(irn) / SR * 3.2) * .02
for c in range(2):
    L = N + irn; nfft = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(sfx[:, c], nfft) * np.fft.rfft(ir, nfft), nfft)[:N]
    sfx[:, c] += wet * .5
out = music + sfx + vox * 1.0
out = out[:int(T * SR)]
fade = np.ones(len(out)); fl = int(1.5 * SR); fade[-fl:] = np.linspace(1, 0, fl)
out *= fade[:, None]
out = np.tanh(out / np.max(np.abs(out)) * 1.3) / np.tanh(1.3) * .95  # soft limiter
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
print('wrote', sys.argv[1], round(len(out) / SR, 2), 's; voice segments:', sum(os.path.exists(os.path.join(ROOT, '..', 'voice', f'seg_{i:02d}.wav')) for i in range(10)))
