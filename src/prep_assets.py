"""Prepares logo cut-outs (transparent PNGs) from source logos."""
from PIL import Image; import numpy as np, os
A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')
im = np.array(Image.open(f'{A}/xazna_logo_src.png').convert('RGB')).astype(float) / 255
a = (1 - im).max(axis=2)                       # un-blend from white
a = np.clip((a - .02) / .98, 0, 1)
rgb = np.where(a[..., None] > 1e-3, (im - (1 - a[..., None])) / np.maximum(a[..., None], 1e-3), 0)
out = np.dstack([np.clip(rgb, 0, 1), a]) * 255
m = a > .1; ys, xs = np.where(m)
cols = m.any(0); xs_on = np.where(cols)[0]
gap = [i for i in range(xs_on.min(), xs_on.max()) if not cols[i]]
run = [gap[0]]
for g in gap[1:]:
    if g != run[-1] + 1: break
    run.append(g)
split = (run[0] + run[-1]) // 2  # first gap: between icon and wordmark
y0, y1 = ys.min() - 4, ys.max() + 4
def save(arr, name): Image.fromarray(arr.astype(np.uint8)).save(f'{A}/{name}'); print(name, arr.shape)
save(out[y0:y1, xs.min() - 4:xs.max() + 4], 'xazna_full.png')
save(out[y0:y1, xs.min() - 4:split], 'xazna_icon.png')
save(out[y0:y1, split:xs.max() + 4], 'xazna_word.png')
