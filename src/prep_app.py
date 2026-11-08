"""Real Xazna app screen recording -> per-frame screen crops without the burned-in captions.
Output: src/build/app/f_XXXX.jpg (frame k = recording time 1.0 + (k-1)/30), 552x1152 (screen aspect of the 3D phone)."""
import numpy as np, subprocess, os, json, cv2
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, '..', 'assets', 'media', 'xazna_ekran.mp4')
OUT = os.path.join(ROOT, 'build', 'app'); os.makedirs(OUT, exist_ok=True)
W, H, T0, T1, ZOOM_T = 1080, 1918, 1.0, 22.0, 20.02   # after ZOOM_T the video is a full-screen close-up (no bezel)
OW, OH = 552, 1152
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(T0), '-to', str(T1), '-i', SRC, '-vf', 'fps=30', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
frames, rects = [], []
def detect(im):
    s = im.sum(2) < 150
    cf, rf = s.mean(0), s.mean(1)
    cols = np.where(cf > .55)[0]; rows = np.where(rf > .55)[0]
    if len(cols) < 2 or len(rows) < 2: return None
    L = cols[cols < W / 2]; R = cols[cols > W / 2]; Tp = rows[rows < H / 2]; B = rows[rows > H / 2]
    if not (len(L) and len(R) and len(Tp) and len(B)): return None
    # inner edge = end of the contiguous dark cluster nearest the screen
    def inner(v, rev):
        v = sorted(v, reverse=rev); e = v[0]
        for a in v[1:]:
            if abs(a - e) <= 3: e = a
            else: break
        return e
    l = inner(L, False) + 1; r = inner(R, True) - 1; t = inner(Tp, False) + 1; b = inner(B, True) - 1
    if r - l < 500 or b - t < 1000: return None
    return [l, t, r, b]
k = 0
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    im = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    tm = T0 + k / 30
    frames.append(tm); rects.append(None if tm >= ZOOM_T else detect(im.astype(np.int32)))
    k += 1
    np.save(os.path.join(OUT, f'raw_{k:04d}.npy'), im) if False else None
p.wait()
json.dump([[f, r and [int(v) for v in r]] for f, r in zip(frames, rects)], open(os.path.join(OUT, 'rects.json'), 'w'))
print(len(frames), 'frames;', sum(r is None for r in rects), 'without rect')

# ---------- pass 2: smooth rects, crop, remove captions, save ----------
ts = np.array(frames); good = np.array([r is not None for r in rects])
tb = np.array([r if r else [0, 0, 0, 0] for r in rects], float)
for c in (1, 3):  # top, bottom: interpolate gaps, light median smoothing
    v = np.interp(ts, ts[good], tb[good, c]); tb[:, c] = [np.median(v[max(0, i - 1):i + 2]) for i in range(len(v))]
CX, ASP = (154 + 925) / 2, (925 - 154) / (1758 - 157)
BAND = (1170, 1400)   # captions are burned in at a fixed height of the full frame
def remove_captions(crop, top):
    """Inpaint the caption pill inside the already-cropped screen (no bezel pixels to smear)."""
    y0, y1 = int(BAND[0] - top), int(BAND[1] - top)
    win = crop[y0:y1]
    r, g, b = [win[..., i].astype(int) for i in range(3)]
    m = (g - r > 28) & (b - r > 28) & (abs(g - b) < 32)
    rows = np.where(m.sum(1) > 40)[0]
    if not len(rows): return crop
    cols = np.where(m[rows].sum(0) > 2)[0]
    mask = np.zeros(crop.shape[:2], np.uint8)
    mask[max(0, y0 + rows.min() - 9):y0 + rows.max() + 10, max(0, cols.min() - 12):cols.max() + 13] = 1
    return cv2.inpaint(np.ascontiguousarray(crop), mask, 11, cv2.INPAINT_TELEA)
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(T0), '-to', str(T1), '-i', SRC, '-vf', 'fps=30', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
for k in range(len(frames)):
    im = np.frombuffer(p.stdout.read(W * H * 3), np.uint8).reshape(H, W, 3)
    if ts[k] >= ZOOM_T:
        cw = H * ASP; crop = im[:, int(W / 2 - cw / 2):int(W / 2 + cw / 2)]
    else:
        t, b = tb[k, 1] + 3, tb[k, 3] - 3; w = (b - t) * ASP - 30
        crop = remove_captions(im[int(t):int(b), int(CX - w / 2):int(CX + w / 2)].copy(), int(t))
    out = cv2.resize(crop, (OW, OH), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(OUT, f'f_{k + 1:04d}.jpg'), cv2.cvtColor(out, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
p.wait(); print('saved', len(frames), 'screens')
