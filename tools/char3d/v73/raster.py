"""CODIS-V73 — راستر مثلثات في فضاء UV بقيم رؤوس مُستوفاة (numba) + توسيع الحواف (gutter) لمنع خطوط عند حدود الجزر."""
import numpy as np
from numba import njit


@njit(cache=True)
def _raster(uv, val, H, W, out, cov):
    nt = uv.shape[0]; C = val.shape[2]
    for t in range(nt):
        x0 = uv[t, 0, 0] * W; y0 = (1 - uv[t, 0, 1]) * H
        x1 = uv[t, 1, 0] * W; y1 = (1 - uv[t, 1, 1]) * H
        x2 = uv[t, 2, 0] * W; y2 = (1 - uv[t, 2, 1]) * H
        mnx = max(int(np.floor(min(x0, min(x1, x2)))), 0); mxx = min(int(np.ceil(max(x0, max(x1, x2)))), W - 1)
        mny = max(int(np.floor(min(y0, min(y1, y2)))), 0); mxy = min(int(np.ceil(max(y0, max(y1, y2)))), H - 1)
        den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
        if abs(den) < 1e-12: continue
        for py in range(mny, mxy + 1):
            for px in range(mnx, mxx + 1):
                cx = px + .5; cy = py + .5
                a = ((y1 - y2) * (cx - x2) + (x2 - x1) * (cy - y2)) / den
                b = ((y2 - y0) * (cx - x2) + (x0 - x2) * (cy - y2)) / den
                c = 1 - a - b
                if a < -1e-4 or b < -1e-4 or c < -1e-4: continue
                for k in range(C): out[py, px, k] = a * val[t, 0, k] + b * val[t, 1, k] + c * val[t, 2, k]
                cov[py, px] = 1


def raster(tri_uv, tri_val, size):
    """tri_uv (nt,3,2) بـ UV (أصل OBJ أسفل-يسار)، tri_val (nt,3,C) ⇒ صورة (size,size,C) بلا فراغات عند الحدود."""
    H = W = size; C = tri_val.shape[2]
    out = np.zeros((H, W, C)); cov = np.zeros((H, W), np.uint8)
    _raster(np.ascontiguousarray(tri_uv, np.float64), np.ascontiguousarray(tri_val, np.float64), H, W, out, cov)
    return dilate(out, cov, 12)


def dilate(img, cov, n):
    img = img.copy(); m = cov.astype(bool)
    for _ in range(n):
        if m.all(): break
        acc = np.zeros_like(img); cnt = np.zeros(m.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            sm = np.roll(np.roll(m, dy, 0), dx, 1); si = np.roll(np.roll(img, dy, 0), dx, 1)
            acc += si * sm[..., None]; cnt += sm
        new = (~m) & (cnt > 0)
        img[new] = acc[new] / cnt[new][:, None]; m = m | new
    return img
