# Synthesized soundtrack: ambient pad + pulse beat + SFX (whoosh, taps, alerts, chimes)
import numpy as np, wave, sys
SR = 44100; T = 72.6; N = int(SR * T)
t = np.arange(N) / SR
out = np.zeros((N, 2))
def env(n, a, r):
    e = np.ones(n); ai = int(a*SR); ri = int(r*SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e
def add(sig, start, gain=1.0, pan=0.0):
    i = int(start*SR); j = min(N, i+len(sig)); s = sig[:j-i]*gain
    out[i:j, 0] += s*(1-pan)*0.5*2**.5; out[i:j, 1] += s*(1+pan)*0.5*2**.5
nf = lambda m: 440*2**((m-69)/12)
# chord progression (Am - F - C - G), 4s each
prog = [[57,60,64],[53,57,60],[48,55,64],[55,59,62]]
for k in range(int(T/4)+1):
    ch = prog[k % 4]; st = k*4; n = int(4.6*SR); tt = np.arange(n)/SR
    sig = sum(np.sin(2*np.pi*nf(m)*tt + 0.3*np.sin(2*np.pi*0.3*tt)) + 0.4*np.sin(2*np.pi*nf(m)*2.003*tt) for m in ch)
    sig += 0.8*np.sin(2*np.pi*nf(ch[0]-12)*tt)
    add(sig*env(n, 1.2, 1.2), st, 0.045)
# arpeggio pluck 8ths from 7s to 64s
for i in range(int((64.6-7)/0.25)):
    st = 7 + i*0.25; k = int(st/4) % 4; ch = prog[k]
    m = ch[i % 3] + 12*(1 + (i//3) % 2); n = int(0.3*SR); tt = np.arange(n)/SR
    sig = np.sin(2*np.pi*nf(m)*tt) * np.exp(-tt*14)
    add(sig, st, 0.05, pan=0.4 if i % 2 else -0.4)
# kick + hat from 7s to 64.6s
for b in range(int((64.6-7)/0.5)):
    st = 7 + b*0.5; n = int(0.25*SR); tt = np.arange(n)/SR
    if b % 2 == 0:
        f = 55 + 90*np.exp(-tt*30); add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*12), st, 0.35)
    hn = int(0.05*SR); add(np.random.randn(hn)*np.exp(-np.arange(hn)/SR*80), st+0.25, 0.025)
def whoosh(st, d=0.9, g=0.18):
    n = int(d*SR); noise = np.random.randn(n); tt = np.arange(n)/SR
    # moving lowpass via cumulative averaging with varying alpha
    a = 0.02 + 0.25*np.sin(np.pi*tt/d)
    y = np.zeros(n); acc = 0
    for i in range(n): acc += a[i]*(noise[i]-acc); y[i] = acc
    add(y*np.sin(np.pi*tt/d)**2, st - d*0.6, g)
def tap(st):
    n = int(0.08*SR); tt = np.arange(n)/SR
    add(np.sin(2*np.pi*1800*tt)*np.exp(-tt*60), st, 0.25)
def alert(st):
    for k in range(3):
        n = int(0.14*SR); tt = np.arange(n)/SR
        add(np.sign(np.sin(2*np.pi*880*tt))*0.5*env(n, .005, .04), st + k*0.2, 0.09)
def chime(st, notes=(72,76,79,84)):
    for k, m in enumerate(notes):
        n = int(1.2*SR); tt = np.arange(n)/SR
        add((np.sin(2*np.pi*nf(m)*tt)+0.3*np.sin(2*np.pi*nf(m)*3*tt))*np.exp(-tt*4), st + k*0.09, 0.12)
def boom(st):
    n = int(1.5*SR); tt = np.arange(n)/SR
    f = 40 + 60*np.exp(-tt*8); add(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*3), st, 0.5)
starts = [0, 7, 17, 25, 33, 56.6, 64.6]
for s in starts[1:]: whoosh(s)
boom(0.4); chime(1.2); whoosh(2.1, 0.7, .25); alert(3.1)
alert(9.6); boom(9.5)
alert(28.0); chime(29.2, (64, 60))
for s in (34.4, 40.0, 45.6, 51.1): tap(s)
alert(34.9); chime(46.0, (76, 79)); chime(52.0)
chime(57.3, (76, 79)); chime(59.1, (76, 79)); alert(60.8)
boom(64.8); chime(65.3, (72, 76, 79, 84, 88))
# master fade
fade = np.ones(N); fade[:int(.3*SR)] = np.linspace(0,1,int(.3*SR)); fade[-int(2*SR):] = np.linspace(1,0,int(2*SR))
out *= fade[:, None]
out /= np.max(np.abs(out)) / 0.89
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out*32767).astype('<i2').tobytes())
