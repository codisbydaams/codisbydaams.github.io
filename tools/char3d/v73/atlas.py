"""CODIS-V73 — أطلس خامات الخصل (مولّد حتمياً): كل خلية = حزمة شعيرات رأسية (الجذر أعلى، الطرف أسفل) بأطوال وانحناءات مختلفة.
   القنوات: RGB = سطوع كل شعيرة (تنوّع لوني)، A = التغطية (حواف ناعمة مضادة للتعرّج، أطراف مستدقّة، جذور شفافة قليلاً).
   الخلايا (أعمدة): كثيفة مستقيمة · متوسطة · متفرقة · مموجة · مجعّدة · شعيرات منفردة (خصل طائرة) · قصيرة كثيفة (حلاقة/لحية) · حاجب."""
import numpy as np
from PIL import Image

W, H, NC = 1024, 2048, 8
CELLS = ['dense', 'medium', 'sparse', 'wavy', 'curly', 'fine', 'short', 'brow']
def cell(name):
    i = CELLS.index(name); return (i / NC, (i + 1) / NC)

def draw(seed=731):
    rng = np.random.default_rng(seed)
    A = np.zeros((H, W)); C = np.zeros((H, W))
    cw = W // NC; rows = np.arange(H)
    def strand(cx, y0, y1, wpx, bright, alpha, xdrift):
        ys = rows[y0:y1]; t = (ys - y0) / max(1, (y1 - y0))
        xs = cx + xdrift(ys)
        wv = wpx * (1 - .55 * t ** 1.6)                                    # مستدقّة نحو الطرف
        av = alpha * np.clip(t / .03, .75, 1) * np.clip((1 - t) / .08, 0, 1) ** .6
        for dx in range(-4, 5):
            px = np.floor(xs).astype(int) + dx
            cov = np.clip(wv / 2 + .5 - np.abs(px + .5 - xs), 0, 1) * av
            ok = (px >= 0) & (px < W)
            yy, xx, cc = ys[ok], px[ok], cov[ok]
            better = cc > A[yy, xx]
            C[yy[better], xx[better]] = bright
            A[yy[better], xx[better]] = cc[better]
    for ci, name in enumerate(CELLS):
        x0 = ci * cw
        if name in ('dense', 'medium', 'sparse', 'wavy', 'curly'):
            n = {'dense': 46, 'medium': 32, 'sparse': 20, 'wavy': 34, 'curly': 30}[name]
            for k in range(n):
                cx = x0 + 6 + (cw - 12) * (k + rng.uniform(.15, .85)) / n
                y0 = int(rng.uniform(0, .06) * H); y1 = int(rng.uniform(.72, 1.0) * H)
                ph = rng.uniform(0, 6.28); amp = {'wavy': 3.2, 'curly': 4.5}.get(name, rng.uniform(.4, 1.6)); fr = {'wavy': 7, 'curly': 26}.get(name, rng.uniform(1, 3))
                drift = (lambda a, f, p, c: (lambda ys: a * np.sin(ys / H * f * 6.283 + p) + c * (ys / H)))(amp, fr, ph, rng.uniform(-6, 6))
                strand(cx, y0, y1, rng.uniform(1.3, 2.4), rng.uniform(.62, 1.0), rng.uniform(.82, 1.0), drift)
        elif name == 'fine':
            for k in range(5):
                cx = x0 + cw * (k + .5) / 5; y0 = int(rng.uniform(0, .05) * H); y1 = int(rng.uniform(.8, 1.0) * H)
                strand(cx, y0, y1, 1.4, rng.uniform(.7, 1.0), .9, (lambda p: (lambda ys: 2.5 * np.sin(ys / H * 5 + p)))(rng.uniform(0, 6)))
        elif name == 'short':      # شعيرات قصيرة كثيفة (لحية/حلاقة): كل الطول تقريباً، أطراف متفاوتة
            for k in range(70):
                cx = x0 + 3 + (cw - 6) * rng.uniform(); y0 = int(rng.uniform(0, .12) * H); y1 = int(rng.uniform(.55, 1.0) * H)
                strand(cx, y0, y1, rng.uniform(1.6, 2.6), rng.uniform(.55, 1.0), rng.uniform(.85, 1.0), (lambda a, p: (lambda ys: a * np.sin(ys / H * 9 + p)))(rng.uniform(1, 5), rng.uniform(0, 6)))
        elif name == 'brow':       # شعيرة حاجب واحدة عريضة الجذر
            for k in range(4):
                cx = x0 + cw * (k + .5) / 4; strand(cx, int(.02 * H), int(rng.uniform(.85, 1) * H), 3.2, rng.uniform(.7, 1.0), .95, lambda ys: 0 * ys)
    rgb = np.clip(np.where(A > .02, C, .8), 0, 1); a = np.clip(A, 0, 1)   # لا هالة سوداء عند حواف الشفافية
    img = np.dstack([rgb, rgb, rgb, a])
    return Image.fromarray(np.round(img * 255).astype(np.uint8), 'RGBA')
