#!/usr/bin/env python3
"""Put lesreg.com on the MacBook in the drone intro.

The generated footage shows a fake browser UI on the laptop. We find the lit
screen in each frame, fit a smooth curve through those rectangles across time
(so the composite never jitters, even where detection is noisy), and paste the
site's own hero into it. The flight then ends on the page the visitor is about
to land on.
"""
import sys, os, json
import numpy as np
from PIL import Image

src_dir, shot_path, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
fps = float(sys.argv[4]) if len(sys.argv) > 4 else 24.0
# "blank" paints the screen in the page's own paper instead of the page itself,
# for the cut where the real page is drawn live on top of it.
mode = sys.argv[5] if len(sys.argv) > 5 else 'page'
PAPER = (242, 236, 224)
FADE_IN = 0.55          # seconds for the page to "render" once we can place it
os.makedirs(out_dir, exist_ok=True)

files = sorted(f for f in os.listdir(src_dir) if f.endswith('.png'))
shot = Image.open(shot_path).convert('RGB')


def detect(path):
    """Bounding box of the lit laptop screen, grown out to the dark bezel."""
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    h, w, _ = a.shape
    lo = a.min(axis=2)
    bright = lo > 165
    rows = bright.sum(axis=1).astype(float); cols = bright.sum(axis=0).astype(float)
    if rows.max() < 40 or cols.max() < 40: return None, (h, w)
    rr = np.where(rows > rows.max() * 0.45)[0]; cc = np.where(cols > cols.max() * 0.45)[0]
    if rr.size < 20 or cc.size < 20: return None, (h, w)
    y0, y1, x0, x1 = int(rr[0]), int(rr[-1]), int(cc[0]), int(cc[-1])

    T = 75
    for _ in range(400):
        if y0 - 1 < 0 or lo[y0 - 1, x0:x1].mean() <= T: break
        y0 -= 1
    for _ in range(400):
        if y1 + 1 >= h or lo[y1 + 1, x0:x1].mean() <= T: break
        y1 += 1
    for _ in range(400):
        if x0 - 1 < 0 or lo[y0:y1, x0 - 1].mean() <= T: break
        x0 -= 1
    for _ in range(400):
        if x1 + 1 >= w or lo[y0:y1, x1 + 1].mean() <= T: break
        x1 += 1

    bh, bw = y1 - y0, x1 - x0
    if bh < 20 or bw < 20 or not (1.3 < bw / bh < 2.0): return None, (h, w)
    if bh * bw < 0.025 * h * w: return None, (h, w)
    patch = a[y0 + int(bh * .45):y0 + int(bh * .78), x0 + int(bw * .3):x0 + int(bw * .7)]
    if patch.size == 0 or np.median(patch.reshape(-1, 3), axis=0).min() < 195:
        return None, (h, w)
    return (x0, y0, x1, y1), (h, w)


# --- pass 1: measure -------------------------------------------------------
raw = {}
size = None
for f in files:
    box, size = detect(os.path.join(src_dir, f))
    if box: raw[int(f[1:-4])] = box
h, w = size
idxs = sorted(raw)
print(f'detected on {len(idxs)} frames: {idxs[0]}..{idxs[-1]}' if idxs else 'none')

# --- fit a smooth path -----------------------------------------------------
# Frames where the screen already runs off the picture are clipped by the frame
# edge, so their numbers are not the real rectangle; fit on the clean ones and
# let the curve carry on past the edge.
M = 6
clean = [i for i in idxs if raw[i][0] > M and raw[i][1] > M and raw[i][2] < w - M and raw[i][3] < h - M]
if len(clean) < 8:
    clean = idxs
ca = np.array(clean, dtype=float)
fits = [np.polyfit(ca, np.array([raw[i][k] for i in clean], dtype=float), 3) for k in range(4)]
print(f'fitted on {len(clean)} clean frames: {clean[0]}..{clean[-1]}')

first = idxs[0]
last = int(files[-1][1:-4])

# Where the fitted screen first covers the whole picture. From there the push
# eases to a stop instead of barrelling past, so the film settles exactly on
# the page filling the frame — and the real page can take over without moving.
settle = None
for i in range(first, last + 1):
    if float(np.polyval(fits[0], i)) <= 0 and float(np.polyval(fits[1], i)) <= 0:
        settle = i; break
# Rest on the page covering the frame at its own proportions — stretching it to
# the frame would leave the last picture 11% too wide to dissolve into the page.
sa = shot.width / shot.height
tw_ = max(w, h * sa); th_ = tw_ / sa
REST = (-(tw_ - w) / 2, -(th_ - h) / 2, w + (tw_ - w) / 2, h + (th_ - h) / 2)
print('settles from frame', settle, 'onto', [round(v) for v in REST])

for f in files:
    idx = int(f[1:-4])
    img = Image.open(os.path.join(src_dir, f)).convert('RGB')
    if idx < first:
        img.save(os.path.join(out_dir, f)); continue

    x0, y0, x1, y1 = [float(np.polyval(p, idx)) for p in fits]
    if settle is not None and idx >= settle and last > settle:
        s = (idx - settle) / (last - settle)
        s = s * s * (3 - 2 * s)                     # smoothstep: ease to rest
        x0 += (REST[0] - x0) * s; y0 += (REST[1] - y0) * s
        x1 += (REST[2] - x1) * s; y1 += (REST[3] - y1) * s
    bw, bh = x1 - x0, y1 - y0
    if bw < 10 or bh < 10:
        img.save(os.path.join(out_dir, f)); continue

    # render the page at the screen's size, then paste it where the screen is
    tw, th = int(round(bw)), int(round(bh))
    page = (Image.new('RGB', (tw, th), PAPER) if mode == 'blank'
            else shot.resize((tw, th), Image.LANCZOS))
    px, py = int(round(x0)), int(round(y0))

    k = min(1.0, (idx - first) / (FADE_IN * fps))
    if k >= 1.0:
        img.paste(page, (px, py))
    else:
        base = img.crop((px, py, px + tw, py + th))
        img.paste(Image.blend(base, page, k), (px, py))

    img.save(os.path.join(out_dir, f))

print('composited from frame', first)

# Hand the same path to the page, so it can draw the real front page into the
# screen instead of relying on video pixels for it.
json.dump({
    'fps': fps, 'w': w, 'h': h,
    'first': first, 'last': last, 'settle': settle, 'rest': list(REST),
    'fit': [list(map(float, p)) for p in fits],
    'fadeIn': FADE_IN,
}, open(os.path.join(os.path.dirname(out_dir) or '.', 'screen-path.json'), 'w'), indent=1)
print('wrote screen-path.json')
