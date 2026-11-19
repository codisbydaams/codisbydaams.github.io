"""CODIS-V72 — خامات مولّدة حتمياً (بذرة ثابتة): تفاصيل الجلد الدقيقة (مسام/خطوط) كخريطة عمودية متكررة.
   py -3 tools/char3d/gen_textures.py  ⇒ work/gen/*.png"""
import os, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'work', 'gen'); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(72)
N = 512
def tile_noise(scale, octaves=4):
    h = np.zeros((N, N))
    for o in range(octaves):
        f = scale * 2 ** o; g = rng.standard_normal((f, f))
        G = np.fft.fft2(g); up = np.zeros((N, N), complex)
        k = f // 2; up[:k, :k] = G[:k, :k]; up[:k, -k:] = G[:k, -k:]; up[-k:, :k] = G[-k:, :k]; up[-k:, -k:] = G[-k:, -k:]
        h += np.real(np.fft.ifft2(up)) * (0.55 ** o)
    return (h - h.mean()) / (h.std() + 1e-9)
# مسام: نقاط صغيرة غائرة + تموّج ناعم
pores = np.zeros((N, N))
for _ in range(5200):
    x, y = rng.integers(0, N, 2); r = rng.uniform(.8, 1.9)
    yy, xx = np.ogrid[-4:5, -4:5]; d = np.exp(-(xx * xx + yy * yy) / (2 * r * r))
    ys = (np.arange(y - 4, y + 5) % N)[:, None]; xs = (np.arange(x - 4, x + 5) % N)[None, :]
    pores[ys, xs] -= d * rng.uniform(.5, 1)
h = pores * .9 + tile_noise(24, 4) * .35 + tile_noise(96, 2) * .25
gy, gx = np.gradient(h); s = 1.6
n = np.dstack([-gx * s, -gy * s, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8)).save(os.path.join(OUT, 'skin_detail_nrm.png'))
print('skin_detail_nrm.png')
# شعيرات متكررة للقشور (اللحية/الحلاقة): R = «طول» الشعرة (عشوائي لكل شعرة)، G = درجة لونها؛ شعيرة ≈ 1–2px ممدودة قليلاً
S = 256
R = np.zeros((S, S)); Gc = np.full((S, S), .5)
# شعيرات بعرض 1–2px وطول 2–5px باتجاه شبه ثابت (منحنية قليلاً) ⇒ تغطية أكثف بلا «نقاط فلفل»
for _ in range(16000):
    x, y = rng.integers(0, S, 2); L = rng.uniform(.12, 1.0) ** .7; g = rng.uniform(.25, 1); w = 1 + (rng.random() < .45)
    dx = rng.uniform(-.35, .35)
    for k in range(rng.integers(2, 6)):
        yy = (y + k) % S; xx = int(round(x + dx * k)) % S
        for ww in range(w):
            xw = (xx + ww) % S; v = L * (1 - k * .08)
            if v > R[yy, xw]: R[yy, xw] = v; Gc[yy, xw] = g
Image.fromarray(np.dstack([R * 255, Gc * 255, np.zeros((S, S))]).astype(np.uint8)).save(os.path.join(OUT, 'strands.png'))
print('strands.png')
# قمصان بلا شعار (الخامة الأصلية CC0؛ نزيل شعار MakeHuman فقط): قناع لون الشعار ⇒ ملء بالتفاف مطبَّع + تفاصيل القماش من رقعة نظيفة مجاورة
from PIL import ImageFilter
SRC = os.path.join(HERE, 'source', 'mh', 'sys', 'clothes')
def clean(name, boxes, shift):
    im = np.asarray(Image.open(os.path.join(SRC, name, name + '_diffuse.png')).convert('RGB')).astype(np.float32); H, W, _ = im.shape
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    orange = (r > 150) & (r - b > 70) & (g < r - 30)
    grayish = (np.abs(r - g) < 22) & (np.abs(g - b) < 26) & (r < 205) & (r > 60)
    m = np.zeros((H, W), bool)
    for (x0, y0, x1, y1, gray) in boxes:
        X0, Y0, X1, Y1 = [int(v * W / 768) for v in (x0, y0, x1, y1)]
        if gray == 'ellipse':   # الشعار كاملاً (الحلقة وحوافها المنعّمة)
            yy, xx = np.ogrid[:H, :W]; cx, cy, rx, ry = (X0 + X1) / 2, (Y0 + Y1) / 2, (X1 - X0) / 2, (Y1 - Y0) / 2
            m |= ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 < 1; continue
        sub = orange[Y0:Y1, X0:X1] | (grayish[Y0:Y1, X0:X1] if gray else False)
        m[Y0:Y1, X0:X1] |= sub
    mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)); m = np.asarray(mi) > 0
    keep = (~m).astype(np.float32)
    from scipy.ndimage import gaussian_filter
    def blur(a, r): return gaussian_filter(a.astype(np.float32), r)
    low = np.zeros_like(im); done = np.zeros(m.shape, bool)
    for rad in (28, 90, 260):   # ملء متعدد المقاييس: كل بكسل من أقرب نطاق فيه قماش كافٍ
        k = blur(keep, rad); ok = (k > .25) & ~done
        for c in range(3): low[..., c] = np.where(ok, blur(im[..., c] * keep, rad) / np.maximum(k, 1e-4), low[..., c])
        done |= ok
    dx, dy = shift; src = np.roll(np.roll(im, dy, 0), dx, 1); hf = src - np.dstack([blur(src[..., c], 6) for c in range(3)])
    fill = low + hf
    soft = blur(m.astype(np.float32) * 255, 3) / 255
    out = im * (1 - soft[..., None]) + fill * soft[..., None]
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name + '_diffuse.png')); print(name, 'clean', int(m.sum()))
clean('male_casualsuit06', [(140, 85, 235, 125, True), (330, 85, 490, 160, True), (560, 110, 585, 140, False)], (0, 160))
def patch(name, dst, src, feather=14):
    # الشعار ⇒ رقعة قماش نظيفة من اللوحة الخلفية للقميص نفسه بحواف ناعمة (لا ألوان مصطنعة)
    path = os.path.join(OUT, name + '_diffuse.png'); base = path if os.path.exists(path) else os.path.join(SRC, name, name + '_diffuse.png')
    im = np.asarray(Image.open(base).convert('RGB')).astype(np.float32); H, W, _ = im.shape; f = W / 768
    x0, y0, x1, y1 = [int(v * f) for v in dst]; sx, sy = int(src[0] * f), int(src[1] * f)
    P = im[sy:sy + (y1 - y0), sx:sx + (x1 - x0)].copy()
    from scipy.ndimage import distance_transform_edt
    inner = np.zeros((y1 - y0, x1 - x0), bool); fe = int(feather * f); inner[fe:-fe, fe:-fe] = True
    a = np.clip(distance_transform_edt(inner) / fe, 0, 1)[..., None] if fe else 1
    im[y0:y1, x0:x1] = im[y0:y1, x0:x1] * (1 - a) + P * a
    Image.fromarray(np.clip(im, 0, 255).astype(np.uint8)).save(path); print(name, 'patched')
patch('female_casualsuit01', (505, 92, 700, 272), (90, 92))
