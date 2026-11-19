"""CODIS-V73 — القطع المُركّبة على الجسم (صيغة mhclo: 3 رؤوس مرجعية + إزاحة مقيسة):
   العينان (high-poly + قزحيات طبيعية مُعاد تلوينها) · الرموش · الحذاء (MakeHuman CC0) · الشعر/اللحية/الحواجب المولّدة (groom.py) · الملابس المولّدة (garments.py)."""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from common import *
import cc

S_NEUTRAL = None
def unweld(F, FT):
    key = {}; vmap = []; uvmap = []; tris = []
    for vs, ts in zip(F, FT):
        ids = []
        for v, t in zip(vs, ts):
            k = (v, t)
            if k not in key: key[k] = len(vmap); vmap.append(v); uvmap.append(t)
            ids.append(key[k])
        for j in range(1, len(ids) - 1): tris.append((ids[0], ids[j], ids[j + 1]))
    return np.array(vmap), np.array(uvmap), np.array(tris)

def proxy(PK, meta, kind, pid, folder, tex=None, extra=None, clip_y=None):
    mh = read_mhclo(os.path.join(folder, os.path.basename(folder) + '.mhclo'))
    V, VT, F, FT, G = read_obj(os.path.join(folder, mh['obj']))
    assert len(mh['refs']) == len(V), (pid, len(mh['refs']), len(V))
    vmap, uvi, tris = unweld(F, FT)
    uv = VT[uvi] if len(VT) else np.zeros((len(vmap), 2))
    R = np.array(mh['refs'])
    if clip_y is not None:
        sv = [abs(BASE_V[mh['scale'][a][0], k] - BASE_V[mh['scale'][a][1], k]) / mh['scale'][a][2] if a in mh['scale'] else 1 for k, a in enumerate('xyz')]
        P0 = (BASE_V[R[:, 0].astype(int)] * R[:, 3:4] + BASE_V[R[:, 1].astype(int)] * R[:, 4:5] + BASE_V[R[:, 2].astype(int)] * R[:, 5:6]) + R[:, 6:9] * np.array(sv)
        ground = BASE_V[BODY_VERTS, 1].min(); hy = (P0[vmap][:, 1] - ground) * DM
        tris = tris[(hy[tris] < clip_y).any(1)]
    p = {'kind': kind, 'id': pid, 'n': int(len(vmap)), 'scale': [mh['scale'].get('x'), mh['scale'].get('y'), mh['scale'].get('z')],
         'refs': PK.arr(pid + '.refs', R[vmap][:, :3].astype(np.uint16)), 'w': PK.arr(pid + '.w', R[vmap][:, 3:6].astype(np.float32)),
         'off': PK.arr(pid + '.off', R[vmap][:, 6:9].astype(np.float32)),
         'uv': PK.arr(pid + '.uv', np.clip(np.round(uv * 65535), 0, 65535).astype(np.uint16)), 'tri': PK.arr(pid + '.tri', tris.astype(np.uint16 if len(vmap) < 65536 else np.uint32).ravel())}
    if extra: p.update(extra)
    if tex: p['tex'] = tex
    meta['proxies'].append(p); return p, uv, tris

# ------------------------------------------------------------------ القزحية: تلوين طبيعي من بنية القزحيات الأصلية
IRIS = {   # (لون حلقة الحافة، لون الوسط، لون قرب البؤبؤ (الطوق)، مصدر البنية)
    'darkbrown': ((.10, .055, .03), (.20, .11, .05), (.26, .15, .06), 'brown'),
    'brown':     ((.16, .08, .035), (.36, .2, .08), (.46, .28, .1), 'brown'),
    'hazel':     ((.2, .16, .07), (.44, .36, .16), (.55, .36, .12), 'brownlight'),
    'amber':     ((.3, .16, .04), (.66, .42, .12), (.72, .5, .15), 'brownlight'),
    'green':     ((.12, .18, .1), (.33, .46, .25), (.5, .42, .16), 'green'),
    'graygreen': ((.2, .24, .2), (.46, .53, .45), (.52, .48, .3), 'bluegreen'),
    'blue':      ((.1, .16, .28), (.33, .5, .7), (.5, .62, .74), 'blue'),
    'lightblue': ((.2, .3, .42), (.55, .7, .84), (.68, .78, .86), 'lightblue'),
    'gray':      ((.24, .26, .28), (.52, .55, .57), (.6, .6, .58), 'grey'),
}
def iris_layout(img):
    """مركز القزحيتين ونصف قطرهما (UV بأصل OBJ) من البؤبؤ الأغمق بالخامة الأصلية."""
    A = np.asarray(img.convert('L').resize((512, 512))).astype(float)
    from scipy.ndimage import label, center_of_mass
    m = A < 45; lab, n = label(m); cs = sorted([(np.sum(lab == i), center_of_mass(m, lab, i)) for i in range(1, n + 1)], reverse=True)[:2]
    out = [(c[1] / 512, 1 - c[0] / 512) for _, c in cs]
    out.sort(key=lambda c: -c[0])
    return out, 56 / 512
def recolor_iris(src, cols, c0, c1, r):
    A = np.asarray(src.convert('RGB')).astype(np.float64) / 255; H, W, _ = A.shape
    yy, xx = np.mgrid[0:H, 0:W]; u = (xx + .5) / W; v = 1 - (yy + .5) / H
    d = np.minimum(np.hypot(u - c0[0], v - c0[1]), np.hypot(u - c1[0], v - c1[1])) / r
    L = A.mean(2); Lb = gaussian_filter(L, 8); det = np.clip(L / np.maximum(Lb, 1e-3), .4, 1.9)
    rim, mid, col = [np.array(c) for c in cols[:3]]
    t = np.clip(d, 0, 1)[..., None]
    base = np.where(t < .55, col + (mid - col) * (t / .55), mid + (rim - mid) * ((t - .55) / .45))
    iris = np.clip(base * det[..., None] ** 1.25, 0, 1)
    pupil = d < .3
    m = (d < 1.02)[..., None] & ~pupil[..., None]
    out = np.where(m, iris, A)
    out = np.where(pupil[..., None], A * .35, out)
    return Image.fromarray(np.clip(out * 255, 0, 255).astype(np.uint8))

def build(PK, meta, log):
    J = lambda *p: os.path.join(SYS, *p)
    # --- العينان
    pe, uv, tris = proxy(PK, meta, 'eyes', 'eyes', J('eyes', 'high-poly'))
    c = ((uv[:, 0] - .935) ** 2 + (uv[:, 1] - .066) ** 2) < .075 ** 2
    isC = c[tris].all(1)
    pe['triBall'] = PK.arr('eyes.triBall', tris[~isC].astype(np.uint32).ravel()); pe['triCornea'] = PK.arr('eyes.triCornea', tris[isC].astype(np.uint32).ravel())
    src = Image.open(J('eyes', 'materials', 'brown_eye.png'))
    (c0, c1), r = iris_layout(src)
    meta['eye'] = {'c0': [round(c0[0], 4), round(c0[1], 4)], 'c1': [round(c1[0], 4), round(c1[1], 4)], 'r': round(r, 4), 'depth': .0016}
    meta['eyeTex'] = {}
    for k, cols in IRIS.items():
        im = recolor_iris(Image.open(J('eyes', 'materials', cols[3] + '_eye.png')), cols, c0, c1, r)
        meta['eyeTex'][k] = PK.img('eye.' + k, im.resize((640, 640), Image.LANCZOS), 'jpeg', 87)
    log('eyes', 'iris', meta['eye'])
    # --- الرموش (MakeHuman) بخامة رمادية-شفافة
    for n in ('eyelashes01', 'eyelashes02'):
        im = Image.open(J('eyelashes', n, n + '.png')).convert('RGBA'); a = im.split()[3]
        g = Image.merge('RGBA', (Image.new('L', im.size, 200),) * 3 + (a,)).resize((256, 256), Image.LANCZOS)
        proxy(PK, meta, 'lashes', n, J('eyelashes', n), tex=PK.img('tex.' + n, g, 'webp', 90))
    # --- الحذاء (MakeHuman shoes05: أبيض/رمادي محايد)
    for n in ('shoes05',):
        m = read_mhmat(J('clothes', n, n + '.mhmat'))
        t = PK.img('tex.' + n, Image.open(J('clothes', n, m['diffuseTexture'])).convert('RGB'), 'jpeg', 84, 512)
        nm = PK.img('nrm.' + n, Image.open(J('clothes', n, m['normalmapTexture'])).convert('RGB'), 'jpeg', 88, 512) if m.get('normalmapTexture') else None
        proxy(PK, meta, 'shoes', n, J('clothes', n), tex=t, extra={'nrm': nm} if nm else None, clip_y=.105)
    # --- الشعر/اللحية/الحواجب المولّدة + الملابس المولّدة
    import groom, garments
    groom.build(PK, meta, log)
    garments.build(PK, meta, log)
