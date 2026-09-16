#!/usr/bin/env python3
"""Blank the laptop screen in the drone intro.

The generated footage puts a fake browser UI on the MacBook. Once the screen
is big enough to read, we find the lit screen rectangle, grow it up to the
bezel so the browser bar is inside it, and repaint the whole thing with the
screen's own colour — so the handover to the site's cream background reads as
one continuous light.
"""
import sys, os
import numpy as np
from PIL import Image

src_dir, out_dir = sys.argv[1], sys.argv[2]
fps = 24.0
start_t = 11.0      # before this the screen is small and clean; bright windows
                    # in the room would otherwise be mistaken for it
SITE_BG = (242, 236, 224)          # --ax-bg, the page's own background
os.makedirs(out_dir, exist_ok=True)

files = sorted(f for f in os.listdir(src_dir) if f.endswith('.png'))
report = []

def edge_grow(a, lo, y0, y1, x0, x1):
    """Walk each edge outward while the rows/columns are still lit screen —
    the browser bar counts, the near-black bezel does not."""
    h, w = lo.shape
    # A lit row averages far brighter than the near-black bezel, and unlike a
    # count of bright pixels this does not stall on the dark menu-bar text.
    T = 75
    for _ in range(300):                      # top (the browser bar lives here)
        if y0 - 1 < 0 or lo[y0 - 1, x0:x1].mean() <= T: break
        y0 -= 1
    for _ in range(300):                      # bottom
        if y1 + 1 >= h or lo[y1 + 1, x0:x1].mean() <= T: break
        y1 += 1
    for _ in range(300):                      # left
        if x0 - 1 < 0 or lo[y0:y1, x0 - 1].mean() <= T: break
        x0 -= 1
    for _ in range(300):                      # right
        if x1 + 1 >= w or lo[y0:y1, x1 + 1].mean() <= T: break
        x1 += 1
    return y0, y1, x0, x1

for f in files:
    idx = int(f[1:-4])
    t = (idx - 1) / fps
    img = Image.open(os.path.join(src_dir, f)).convert('RGB')
    if t < start_t:
        img.save(os.path.join(out_dir, f)); continue

    a = np.asarray(img).astype(np.int16)
    h, w, _ = a.shape
    lo = a.min(axis=2)
    bright = lo > 165

    rows = bright.sum(axis=1).astype(float); cols = bright.sum(axis=0).astype(float)
    if rows.max() < 40 or cols.max() < 40:
        img.save(os.path.join(out_dir, f)); report.append((round(t, 2), 'skip')); continue
    rr = np.where(rows > rows.max() * 0.45)[0]
    cc = np.where(cols > cols.max() * 0.45)[0]
    if rr.size < 25 or cc.size < 25:
        img.save(os.path.join(out_dir, f)); report.append((round(t, 2), 'skip')); continue

    y0, y1, x0, x1 = int(rr[0]), int(rr[-1]), int(cc[0]), int(cc[-1])
    # the browser bar sits above the white content area — grow to the bezel
    y0, y1, x0, x1 = edge_grow(a, lo, y0, y1, x0, x1)
    # then step back inside so the fill never touches the lid
    y0 += 2; y1 -= 2; x0 += 2; x1 -= 2
    bh, bw = y1 - y0, x1 - x0
    # a laptop screen, not a window: roughly 16:10, and a real share of the frame
    if bh < 25 or bw < 25 or not (1.25 < bw / bh < 2.15) or bh * bw < 0.06 * h * w:
        img.save(os.path.join(out_dir, f)); report.append((round(t, 2), 'reject')); continue

    cy0 = y0 + int(bh * 0.45); cy1 = y0 + int(bh * 0.78)
    cx0 = x0 + int(bw * 0.30); cx1 = x0 + int(bw * 0.70)
    fill = np.median(a[cy0:cy1, cx0:cx1].reshape(-1, 3), axis=0)
    if fill.min() < 195:                       # the lit screen, nothing dimmer
        img.save(os.path.join(out_dir, f)); report.append((round(t, 2), 'dim')); continue

    # Drift the blank screen from its own pale glow to the site's cream, so the
    # frame the page takes over from is already the page's own background.
    k = min(1.0, max(0.0, (t - 11.0) / 2.0))
    fill = fill * (1 - k) + np.array(SITE_BG, dtype=float) * k

    patch = a[y0:y1, x0:x1]
    ph, pw, _ = patch.shape
    # Keep the feather tight: the screen meets a dark bezel, and a wide ramp
    # would let the browser bar show through right where it sits.
    fy = np.clip(np.minimum(np.arange(ph), ph - 1 - np.arange(ph)) / 3.0, 0, 1)
    fx = np.clip(np.minimum(np.arange(pw), pw - 1 - np.arange(pw)) / 3.0, 0, 1)
    m = (fy[:, None] * fx[None, :])[:, :, None]
    a[y0:y1, x0:x1] = patch * (1 - m) + fill[None, None, :] * m

    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(out_dir, f))
    report.append((round(t, 2), f'{x0},{y0}-{x1},{y1}'))

print(f'frames: {len(files)}, touched: {len(report)}')
for r in report[::8]:
    print(r)
