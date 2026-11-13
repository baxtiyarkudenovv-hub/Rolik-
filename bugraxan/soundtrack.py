"""Буғрахан естелиги — фон музыкасы ҳәм тоўыс дизайны (numpy, сыртқы файлларсыз).
Қолланыў: python3 soundtrack.py timeline.json out.wav
Шығыс-Орта Азия ладлы (D фригий-доминант) пад, дутар (Karplus-Strong), ней-сыяқлы әўен, доира, самал, импакт."""
import numpy as np, json, sys, wave
SR = 44100
TL = json.load(open(sys.argv[1])); OUT = sys.argv[2]
T = TL['total'] + 1; N = int(T * SR)
rng = np.random.default_rng(11)
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def add(bus, sig, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    if sig.ndim == 1:
        sig = np.stack([sig * np.sqrt((1 - pan) / 2), sig * np.sqrt((1 + pan) / 2)], 1) * 1.414
    j = min(N, i + len(sig)); bus[i:j] += sig[:j - i] * g

def env(n, a, r, curve=1.0):
    e = np.ones(n); ai, ri = min(n, int(a * SR)), min(n, int(r * SR))
    if ai: e[:ai] = np.linspace(0, 1, ai) ** curve
    if ri: e[-ri:] *= np.linspace(1, 0, ri) ** curve
    return e

def fft_filter(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))

# ---------- instruments ----------
def pad(notes, t, d, g=.08, bright=1.6, a=3.0, r=3.5):
    n = int(d * SR); tt = np.arange(n) / SR; L = np.zeros(n); R = np.zeros(n)
    for m in notes:
        f0 = hz(m)
        for v, det in enumerate((-.09, 0, .1)):
            ph = rng.random() * 6.28; fd = f0 * 2 ** (det / 12 * .5)
            s = np.zeros(n)
            for h in range(1, 9):
                if fd * h > 9000: break
                s += np.sin(2 * np.pi * fd * h * tt + ph * h) / h ** bright
            if v == 0: L += s
            elif v == 2: R += s
            else: L += s * .7; R += s * .7
    trem = 1 + .12 * np.sin(2 * np.pi * .18 * tt + rng.random() * 6)
    e = env(n, a, r, 1.6) * trem / len(notes)
    add(mus, np.stack([L * e, R * e], 1), t, g)

def pluck(m, t, g=.25, dur=2.2, pan=0.0, bright=.5):
    P = int(SR / hz(m)); n = int(dur * SR); nb = n // P + 2
    buf = rng.uniform(-1, 1, P); buf = buf - buf.mean()
    # pick position colouring
    buf = (1 - bright) * np.convolve(buf, np.ones(3) / 3, 'same') + bright * buf
    out = np.empty(nb * P); out[:P] = buf
    for k in range(1, nb):
        prev = out[(k - 1) * P:k * P]
        out[k * P:(k + 1) * P] = .996 * .5 * (prev + np.roll(prev, 1))
    y = out[:n] * env(n, .002, .3)
    add(mus, y, t, g, pan)

def ney(m, t, d, g=.07, pan=-.15):
    n = int(d * SR); tt = np.arange(n) / SR
    vib = 1 + .006 * np.sin(2 * np.pi * 5.2 * tt) * np.clip(tt / .6, 0, 1)
    ph = 2 * np.pi * np.cumsum(hz(m) * vib) / SR
    s = np.sin(ph) + .35 * np.sin(2 * ph) + .18 * np.sin(3 * ph) + .06 * np.sin(4 * ph)
    breath = fft_filter(rng.standard_normal(n), 900, 4000) * .5
    y = (s + breath) * env(n, .25, .45, 1.5)
    add(mus, y, t, g, pan)

def bell(m, t, g=.06, pan=0.0, d=4.0):
    n = int(d * SR); tt = np.arange(n) / SR; f = hz(m); y = np.zeros(n)
    for ratio, amp, dec in ((1, 1, 1.4), (2.76, .45, 2.4), (5.4, .25, 3.5), (8.93, .12, 5)):
        y += amp * np.sin(2 * np.pi * f * ratio * tt) * np.exp(-tt * dec)
    add(mus, y * env(n, .003, .2), t, g, pan)

def doira(t, g=.35, low=True):
    n = int(.6 * SR); tt = np.arange(n) / SR
    if low:
        f = 70 + 60 * np.exp(-tt * 25); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    else: y = np.zeros(n)
    y += fft_filter(rng.standard_normal(n), 1500, 7000) * np.exp(-tt * (30 if low else 45)) * (.25 if low else .6)
    add(sfx, y, t, g, rng.uniform(-.2, .2))

def boom(t, g=.55):
    n = int(4 * SR); tt = np.arange(n) / SR
    f = 32 + 40 * np.exp(-tt * 6); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.3)
    y += fft_filter(rng.standard_normal(n), 40, 400) * np.exp(-tt * 2.5) * .5
    add(sfx, y, t, g)

def whoosh(center, d=1.6, g=.18):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    y = fft_filter(rng.standard_normal(n), 300, 3500) * np.sin(np.pi * tt ** 1.3) ** 2
    pan = np.linspace(-.7, .7, n)
    add(sfx, np.stack([y * np.sqrt((1 - pan) / 2), y * np.sqrt((1 + pan) / 2)], 1) * 1.41, center - d * .6, g)

def riser(end, d=3.0, g=.12):
    n = int(d * SR); tt = np.linspace(0, 1, n)
    y = fft_filter(rng.standard_normal(n), 500, 6000) * tt ** 3
    add(sfx, y, end - d, g)

def wind(t, d, g=.06):
    n = int(d * SR); tt = np.arange(n) / SR
    L = fft_filter(rng.standard_normal(n), 120, 900); R = fft_filter(rng.standard_normal(n), 120, 900)
    lfo = .55 + .45 * np.sin(2 * np.pi * .07 * tt + rng.random() * 6) * np.sin(2 * np.pi * .023 * tt)
    e = env(n, 2, 2) * lfo
    add(sfx, np.stack([L * e, R * e], 1), t, g)

def rain(t, d, g=.05):
    n = int(d * SR); y = fft_filter(rng.standard_normal(n), 2000, 9000); y2 = fft_filter(rng.standard_normal(n), 2000, 9000)
    e = env(n, 3, 3); add(sfx, np.stack([y * e, y2 * e], 1), t, g)

def water(t, d, g=.08):
    n = int(d * SR); tt = np.arange(n) / SR
    y = fft_filter(rng.standard_normal(n), 60, 500) * (.6 + .4 * np.sin(2 * np.pi * .3 * tt))
    add(sfx, y * env(n, 3, 3), t, g)

# ---------- score ----------
D_PD = [62, 63, 66, 67, 69, 70, 72, 74]  # D phrygian dominant
def ostinato(t0, d, pat, step=.36, g=.18, oct=0, pan=.25):
    t = t0; i = 0
    while t < t0 + d - .3:
        m = pat[i % len(pat)]
        if m is not None: pluck(m + oct, t, g * (1 if i % 4 == 0 else .7), pan=pan * (1 if i % 2 else -1))
        t += step; i += 1

def melody(t0, phrase, g=.07):
    t = t0
    for m, d in phrase:
        if m is not None: ney(m, t, d * 1.15, g)
        t += d

sc = TL['scenes']
for s in sc:
    t0, d, sid, segs = s['t0'], s['d'], s['id'], s['segs']
    if sid != 'intro': whoosh(t0, 1.6, .14)
    if sid == 'intro':
        wind(0, d + 2, .07)
        pad([38, 50, 57], 0, d + 2, .10, a=5)
        pad([62, 69], 4, d - 2, .05, a=4)
        riser(7.0, 3.5, .14); boom(7.0, .6)
        bell(74, 7.1, .05); bell(81, 7.15, .03, .4)
        melody(8.5, [(62, 1.2), (63, .6), (66, 1.4), (67, .6), (66, .8), (63, 1.8)], .06)
    elif sid == 'exped':
        pad([38, 50, 57, 62], t0, d + 1.5, .08)
        wind(t0, d, .05)
        ostinato(t0 + 1.5, d - 2, [62, None, 69, 62, 66, None, 63, 62], .38, .14)
        boom(segs[2] - .2, .35); doira(segs[2] - .2, .3)
    elif sid == 'name':
        pad([38, 50, 57, 62], t0, segs[3] - t0 + 1.5, .08)
        ostinato(t0 + 1, segs[3] - t0 - 1, [62, 63, 66, 63, 62, None, 57, None], .34, .14)
        for k in range(int((segs[3] - segs[1]) / 1.36)): doira(segs[1] + 1 + k * 1.36, .22); doira(segs[1] + 1.68 + k * 1.36, .12, False)
        boom(segs[2], .4)
        pad([34, 46, 53, 62], segs[3] - .5, t0 + d - segs[3] + 2, .09, a=2)
        bell(81, segs[3] + 1, .04, -.3); bell(78, segs[3] + 2.2, .03, .3); bell(74, segs[3] + 3.6, .03)
    elif sid == 'int':
        pad([38, 50, 57], t0 - .5, d + 1, .035, a=1.5, r=1.5)
        wind(t0, d, .02)
    elif sid == 'minaret':
        pad([43, 55, 62, 67], t0, segs[1] - t0 + 2, .09)
        pad([46, 58, 65, 69], segs[1] - 1, t0 + d - segs[1] + 2, .09)
        wind(t0, d, .05)
        melody(t0 + 1.2, [(67, 1.4), (69, .7), (70, 1.6), (69, .8), (67, 1.2), (66, 2.2)], .055)
        boom(segs[1], .35); bell(77, segs[1] + .2, .04)
    elif sid == 'beacon':
        pad([38, 50, 57, 64], t0, segs[3] - t0 + 2, .085)
        for k in range(10): bell([74, 81, 78, 86][k % 4], segs[1] - .5 + k * 1.1, .03, (-1) ** k * .4)
        for k in range(int((segs[3] - segs[2]) / .72)): doira(segs[2] + k * .72, .14 if k % 2 else .2, k % 2 == 0)
        pad([41, 53, 60, 65], segs[3] - 1, t0 + d - segs[3] + 2, .08)
        ostinato(segs[3], t0 + d - segs[3], [65, 72, 69, 72, 65, 72, 70, 72], .3, .11, pan=.4)
        boom(segs[5] - .1, .4)
    elif sid == 'city':
        pad([41, 53, 60, 65], t0, segs[2] - t0 + 2, .085)
        bell(77, t0 + 2, .03); bell(84, t0 + 4.5, .025, .3)
        pad([38, 50, 57, 62], segs[2] - 1, segs[5] - segs[2] + 2, .08)
        ostinato(segs[2], segs[5] - segs[2], [62, 69, 66, 69, 63, 69, 62, 69], .32, .12)
        boom(segs[4], .35)
        pad([43, 55, 62, 67, 70], segs[5] - 1, t0 + d - segs[5] + 2, .09)
        melody(segs[5], [(67, 1.0), (70, .8), (69, 1.4), (67, 2.0)], .055)
    elif sid == 'flood':
        pad([36, 48, 51, 55], t0, d + 1.5, .09, bright=1.3)
        rain(t0 + 1, d * .7, .06); water(t0 + 1, d - 1, .1)
        for k in range(int(d * .6 / .5)): doira(t0 + 1.5 + k * .5, .1 + .1 * (k / (d * 1.2)))
        boom(t0 + d * .35, .5); boom(t0 + d * .62, .3)
        pad([38, 50, 57, 62, 66], t0 + d * .65, d * .35 + 1.5, .08, a=2)
    elif sid == 'modern':
        for ch, a, b in (([50, 54, 57, 62], t0, segs[2]), ([43, 55, 59, 62], segs[2], segs[4]), ([45, 57, 61, 64], segs[4], segs[5]), ([50, 54, 57, 62, 66], segs[5], t0 + d)):
            pad(ch, a - .5, b - a + 2, .075)
        ostinato(t0 + 1, d - 2, [62, 66, 69, 66, 74, 69, 66, 69], .3, .11)
        for k in range(int((d - 4) / 1.2)): doira(t0 + 2 + k * 1.2, .16); doira(t0 + 2.6 + k * 1.2, .08, False)
        boom(segs[1] + 2.2, .35)
        melody(segs[6], [(66, 1.0), (69, .8), (74, 1.6), (73, .6), (71, 1.0), (69, 2.0)], .05)
    elif sid == 'wisdom':
        pad([38, 50, 57, 62, 69], t0, d + 1.5, .08, a=3)
        for k in range(int(d / .9)):
            bell([74, 78, 81, 86, 81, 78][k % 6], t0 + 1 + k * .9, .025, ((k % 3) - 1) * .5)
        riser(segs[2] + 1.5, 3, .1); boom(segs[2] + 1.5, .45)
    elif sid == 'finale':
        pad([38, 50, 57, 62], t0, segs[1] - t0 + 3, .085)
        wind(t0, d, .05)
        pad([38, 50, 57, 62, 66, 69], segs[1] + .5, t0 + d - segs[1] + 6, .1, a=3, r=5)
        for k in range(int((t0 + d - segs[1] - 2) / 1.4)): doira(segs[1] + 1 + k * 1.4, .2)
        melody(segs[1] + 1.5, [(62, 1.0), (66, .8), (69, 1.4), (74, 1.8), (73, .7), (69, 1.0), (66, 1.2), (62, 2.6)], .065)
        boom(segs[1] + 1, .5)
    elif sid == 'end':
        boom(t0 + 1, .45); bell(74, t0 + 1.1, .05); bell(81, t0 + 1.2, .03, .3)
        pad([38, 50, 57], t0, d, .07, a=1, r=4)

# ---------- reverb (OLA convolution) on music ----------
def reverb(x, sec=3.2, mix=.32):
    n = int(sec * SR); tt = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-tt * 6.9 / sec)[:, None]
    ir[:, 0] = fft_filter(ir[:, 0], 80, 6000); ir[:, 1] = fft_filter(ir[:, 1], 80, 6000)
    ir /= np.sqrt((ir ** 2).sum(0))
    B = 1 << 18; F = 1 << int(np.ceil(np.log2(B + n)))
    out = np.zeros((len(x) + n, 2)); IR = np.fft.rfft(ir, F, axis=0)
    for i in range(0, len(x), B):
        blk = x[i:i + B]; Y = np.fft.irfft(np.fft.rfft(blk, F, axis=0) * IR, F, axis=0)
        e = min(len(out), i + F); out[i:e] += Y[:e - i]
    return x * (1 - mix) + out[:len(x)] * mix * 2.2

mus = reverb(mus)
sfx = reverb(sfx, 2.2, .2)
mix = mus + sfx
mix[:int(.05 * SR)] *= np.linspace(0, 1, int(.05 * SR))[:, None]
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.4) * .89
with wave.open(OUT, 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', OUT, round(T, 1), 's')
