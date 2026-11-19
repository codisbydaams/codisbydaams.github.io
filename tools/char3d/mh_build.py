"""CODIS-V72 — بناء أصول الشخصية الواقعية من MakeHuman (CC0 1.0) بلا Blender.
   المصدر: tools/char3d/source/mh/repo (مستودع makehuman: base.obj + targets + rigs) و source/mh/sys (makehuman_system_assets_cc0).
   الناتج: tools/char3d/dist/codis_char.bin — حاوية واحدة (رأس JSON + كتل ثنائية + صور WebP/JPEG) يقرأها CodisB3D.char.

   ما يُبنى (كله من الأصل نفسه، لا أشكال مرسومة يدوياً):
   • 4 بنيات جسم لكل جنس = أوزان «ماكرو» MakeHuman الأصلية (عضل/وزن/تناسب) مدموجة مسبقاً كمواضع كاملة.
   • فرق الطول (أقصر/أطول) لكل جنس كمواضع كاملة (يُمزج بنسبة وقت العرض).
   • مكتبة Targets متفرقة (الوجه/العينان/الأنف/الفم/الذقن/الخدان/الأذنان/الحاجبان/الجسم) — وقت العرض: مجموع موزون ثم إعادة حساب العموديات.
   • هيكل عظمي مختصر من default.mhskel (أصابع كاملة، عظام الوجه ⇒ الرأس) + أوزان default_weights.mhw مجمّعة لأعلى 4.
   • قطع مُركّبة (proxies): العينان، الحواجب (12)، الرموش، 10 تسريحات، الملابس، الحذاء — كل رأس = مركّب 3 رؤوس من الجسم + إزاحة مقيسة
     (صيغة mhclo) ⇒ تتبع أي وجه/جسم تلقائياً.
   • قشور مولّدة (اللحية/القصّات القصيرة جداً) = حلقات من سطح الجلد نفسه بأقنعة مناطق + خامات مولّدة (gen_textures.py).
   تشغيل:  py -3 tools/char3d/mh_build.py      (يحتاج numpy + pillow)"""
import os, re, json, struct, io, math, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, 'source', 'mh', 'repo', 'makehuman-master', 'makehuman', 'data')
SYS = os.path.join(HERE, 'source', 'mh', 'sys')
GEN = os.path.join(HERE, 'work', 'gen')
OUT = os.path.join(HERE, 'dist', 'codis_char.bin')   # يُنسخ إلى assets/char/codis_char_v72.bin بـ rebuild_v72.sh
DM = 0.1   # MakeHuman بالديسيمتر ⇒ متر
Q = 4e-5   # كمّ الموضع (متر) ⇒ int16 يغطي ±1.31م بدقة 0.04مم

# ---------------------------------------------------------------- base.obj
def read_obj(path):
    V, VT, F, FT, G = [], [], [], [], []
    g = ''
    for ln in open(path, encoding='utf-8', errors='replace'):
        if ln.startswith('v '): V.append([float(x) for x in ln.split()[1:4]])
        elif ln.startswith('vt '): VT.append([float(x) for x in ln.split()[1:3]])
        elif ln.startswith('g '): g = ln.split(None, 1)[1].strip()
        elif ln.startswith('f '):
            vs, ts = [], []
            for tok in ln.split()[1:]:
                p = tok.split('/'); vs.append(int(p[0]) - 1); ts.append(int(p[1]) - 1 if len(p) > 1 and p[1] else -1)
            F.append(vs); FT.append(ts); G.append(g)
    return np.array(V, np.float64), np.array(VT, np.float64) if VT else np.zeros((0, 2)), F, FT, G

BASE_V, BASE_VT, BASE_F, BASE_FT, BASE_G = read_obj(os.path.join(REPO, '3dobjs', 'base.obj'))
NV = len(BASE_V)
print('base.obj', NV, 'verts', len(BASE_F), 'faces')

# ---------------------------------------------------------------- targets
_tcache = {}
def target(rel):
    if rel in _tcache: return _tcache[rel]
    p = os.path.join(REPO, 'targets', rel + '.target')
    idx, d = [], []
    for ln in open(p, encoding='utf-8'):
        if not ln.strip() or ln[0] == '#': continue
        a = ln.split(); idx.append(int(a[0])); d.append([float(a[1]), float(a[2]), float(a[3])])
    r = (np.array(idx, np.int64), np.array(d, np.float64).reshape(-1, 3))
    _tcache[rel] = r; return r
def exists(rel): return os.path.exists(os.path.join(REPO, 'targets', rel + '.target'))
def add(P, rel, w):
    if not w: return
    if not exists(rel): return
    i, d = target(rel); P[i] += d * w

def tri(v):   # قيمة 0..1 ⇒ (min, average, max) بقاعدة MakeHuman
    mx = max(0.0, v * 2 - 1); mn = max(0.0, 1 - v * 2); return {'min': mn, 'average': 1 - mx - mn, 'max': mx}
def tri_avg_alt(v):   # الطول/الصدر/التناسب: average = 1 − الأكبر
    mx = max(0.0, v * 2 - 1); mn = max(0.0, 1 - v * 2); return {'min': mn, 'average': 1 - max(mx, mn), 'max': mx}

ETH = ('caucasian', 'african', 'asian')
def macro(gender, muscle, weight, height=.5, prop=.5, cup=.5, firm=.5, age='young', eth=(1/3, 1/3, 1/3)):
    """مواضع الجسم الكاملة (dm) لأوزان ماكرو MakeHuman (العمر شاب = 25 سنة).
       الأعراق (مجموعها 1) تحمل شكل الجنس/العمر الأساسي للجسم كله — تُطبَّق كاملة كما يفعل MakeHuman."""
    P = BASE_V.copy()
    G = {'female': 1 - gender, 'male': gender}
    for g, gw in G.items():
        if gw:
            for e, ew in zip(ETH, eth): add(P, 'macrodetails/%s-%s-%s' % (e, g, age), gw * ew)
    M = tri(muscle); W = tri(weight); H = tri_avg_alt(height); PR = tri_avg_alt(prop); C = tri_avg_alt(cup); FI = tri_avg_alt(firm)
    for g, gw in G.items():
        if not gw: continue
        for m, mw in M.items():
            for w, ww in W.items():
                base = gw * mw * ww
                if not base: continue
                add(P, 'macrodetails/universal-%s-%s-%smuscle-%sweight' % (g, age, m, w), base)
                for h in ('min', 'max'):
                    add(P, 'macrodetails/height/%s-%s-%smuscle-%sweight-%sheight' % (g, age, m, w, h), base * H[h])
                add(P, 'macrodetails/proportions/%s-%s-%smuscle-%sweight-idealproportions' % (g, age, m, w), base * max(0.0, prop * 2 - 1))
                add(P, 'macrodetails/proportions/%s-%s-%smuscle-%sweight-uncommonproportions' % (g, age, m, w), base * max(0.0, 1 - prop * 2))
                if g == 'female':
                    for c in ('min', 'average', 'max'):
                        for f in ('min', 'average', 'max'):
                            if c == 'average' and f == 'average': continue
                            add(P, 'breast/female-%s-%smuscle-%sweight-%scup-%sfirmness' % (age, m, w, c, f), base * C[c] * FI[f])
    return P

# بنيات الجسم: نحيف · متوازن · رياضي · عريض/ممتلئ — قيم ماكرو حقيقية (لا تكبير/تصغير)
BUILDS = {
    'male':   [('slim', dict(muscle=.3, weight=0., prop=.55)), ('avg', dict(muscle=.55, weight=.5, prop=.6)),
               ('athl', dict(muscle=1., weight=.62, prop=.9)), ('broad', dict(muscle=.6, weight=1., prop=.4))],
    'female': [('slim', dict(muscle=.3, weight=0., prop=.6, cup=.35)), ('avg', dict(muscle=.5, weight=.5, prop=.65, cup=.5)),
               ('athl', dict(muscle=.95, weight=.55, prop=.9, cup=.45, firm=.75)), ('broad', dict(muscle=.55, weight=1., prop=.4, cup=.75))],
}
# تفاصيل تشريحية مدموجة بكل بنية (أهداف MakeHuman الأصلية، أوزان معتدلة) ⇒ فرق واضح في الكتفين/الخصر/البطن/الحوض/الأطراف
def _lr(n, w): return {('armslegs/%s-' % s) + n: w for s in 'lr'}
BUILD_DETAIL = {
    'slim':  {'torso/torso-scale-horiz-decr': .25, 'hip/hip-scale-horiz-decr': .15, 'stomach/stomach-pregnant-decr': .4, 'neck/neck-scale-horiz-decr': .2},
    'avg':   {},
    'athl':  dict({'torso/torso-vshape-incr': .7, 'torso/torso-muscle-pectoral-incr': .45, 'torso/torso-muscle-dorsi-incr': .4, 'stomach/stomach-pregnant-decr': .5, 'hip/hip-waist-up': .2,
                   'neck/neck-scale-horiz-incr': .25}, **_lr('upperarm-muscle-incr', .5), **_lr('upperarm-shoulder-muscle-incr', .55), **_lr('upperleg-muscle-incr', .4), **_lr('lowerleg-muscle-incr', .35), **_lr('lowerarm-muscle-incr', .35)),
    'broad': dict({'stomach/stomach-pregnant-incr': .38, 'torso/torso-scale-horiz-incr': .2, 'torso/torso-scale-depth-incr': .25, 'hip/hip-scale-horiz-incr': .25, 'buttocks/buttocks-volume-incr': .3,
                   'neck/neck-scale-horiz-incr': .35, 'neck/neck-double-incr': .25}, **_lr('upperarm-fat-incr', .5), **_lr('upperleg-fat-incr', .45), **_lr('lowerleg-fat-incr', .3)),
}
SEXG = {'male': 1.0, 'female': 0.0}

# ---------------------------------------------------------------- مكتبة الأهداف المتفرقة (وقت العرض)
def pairs(names):
    out = []
    for n in names: out += [n]
    return out
SPARSE = []
def S(rel): SPARSE.append(rel)
for n in ['head/head-oval', 'head/head-round', 'head/head-rectangular', 'head/head-square', 'head/head-triangular', 'head/head-invertedtriangular', 'head/head-diamond',
          'head/head-fat-decr', 'head/head-fat-incr', 'head/head-scale-horiz-decr', 'head/head-scale-horiz-incr', 'head/head-scale-vert-decr', 'head/head-scale-vert-incr',
          'head/head-scale-depth-decr', 'head/head-scale-depth-incr', 'head/head-back-scale-depth-decr', 'head/head-back-scale-depth-incr', 'head/head-age-decr', 'head/head-age-incr',
          'forehead/forehead-scale-vert-decr', 'forehead/forehead-scale-vert-incr', 'forehead/forehead-trans-backward', 'forehead/forehead-trans-forward',
          'forehead/forehead-temple-decr', 'forehead/forehead-temple-incr', 'forehead/forehead-nubian-decr', 'forehead/forehead-nubian-incr',
          'eyebrows/eyebrows-trans-up', 'eyebrows/eyebrows-trans-down', 'eyebrows/eyebrows-angle-up', 'eyebrows/eyebrows-angle-down', 'eyebrows/eyebrows-trans-forward', 'eyebrows/eyebrows-trans-backward',
          'neck/neck-scale-horiz-decr', 'neck/neck-scale-horiz-incr', 'neck/neck-double-incr',
          'chin/chin-width-decr', 'chin/chin-width-incr', 'chin/chin-height-decr', 'chin/chin-height-incr', 'chin/chin-prominent-decr', 'chin/chin-prominent-incr',
          'chin/chin-bones-decr', 'chin/chin-bones-incr', 'chin/chin-jaw-drop-decr', 'chin/chin-jaw-drop-incr', 'chin/chin-cleft-incr', 'chin/chin-prognathism-decr', 'chin/chin-prognathism-incr', 'chin/chin-triangle',
          'nose/nose-scale-horiz-decr', 'nose/nose-scale-horiz-incr', 'nose/nose-scale-vert-decr', 'nose/nose-scale-vert-incr', 'nose/nose-scale-depth-decr', 'nose/nose-scale-depth-incr',
          'nose/nose-trans-up', 'nose/nose-trans-down', 'nose/nose-nostrils-width-decr', 'nose/nose-nostrils-width-incr', 'nose/nose-point-width-decr', 'nose/nose-point-width-incr',
          'nose/nose-point-up', 'nose/nose-point-down', 'nose/nose-hump-decr', 'nose/nose-hump-incr', 'nose/nose-curve-concave', 'nose/nose-curve-convex', 'nose/nose-greek-incr',
          'nose/nose-volume-decr', 'nose/nose-volume-incr', 'nose/nose-flaring-decr', 'nose/nose-flaring-incr', 'nose/nose-width1-decr', 'nose/nose-width1-incr', 'nose/nose-base-up', 'nose/nose-base-down',
          'nose/nose-septumangle-decr', 'nose/nose-septumangle-incr', 'nose/nose-compression-compress',
          'mouth/mouth-scale-horiz-decr', 'mouth/mouth-scale-horiz-incr', 'mouth/mouth-scale-vert-decr', 'mouth/mouth-scale-vert-incr',
          'mouth/mouth-upperlip-volume-decr', 'mouth/mouth-upperlip-volume-incr', 'mouth/mouth-lowerlip-volume-decr', 'mouth/mouth-lowerlip-volume-incr',
          'mouth/mouth-upperlip-height-decr', 'mouth/mouth-upperlip-height-incr', 'mouth/mouth-lowerlip-height-decr', 'mouth/mouth-lowerlip-height-incr',
          'mouth/mouth-cupidsbow-decr', 'mouth/mouth-cupidsbow-incr', 'mouth/mouth-angles-up', 'mouth/mouth-angles-down', 'mouth/mouth-trans-forward', 'mouth/mouth-trans-backward',
          'mouth/mouth-trans-up', 'mouth/mouth-trans-down', 'mouth/mouth-philtrum-volume-incr', 'mouth/mouth-dimples-in', 'mouth/mouth-laugh-lines-in',
          'torso/torso-vshape-decr', 'torso/torso-vshape-incr', 'torso/torso-scale-horiz-decr', 'torso/torso-scale-horiz-incr', 'torso/torso-muscle-pectoral-incr',
          'hip/hip-scale-horiz-decr', 'hip/hip-scale-horiz-incr', 'hip/hip-waist-up', 'hip/hip-waist-down', 'stomach/stomach-pregnant-decr', 'stomach/stomach-pregnant-incr',
          'buttocks/buttocks-volume-decr', 'buttocks/buttocks-volume-incr',
          'armslegs/upperlegs-height-decr', 'armslegs/upperlegs-height-incr', 'armslegs/lowerlegs-height-decr', 'armslegs/lowerlegs-height-incr']:
    S(n)
for side in 'lr':
    for n in ['eyes/%s-eye-scale-decr', 'eyes/%s-eye-scale-incr', 'eyes/%s-eye-trans-in', 'eyes/%s-eye-trans-out', 'eyes/%s-eye-trans-up', 'eyes/%s-eye-trans-down',
              'eyes/%s-eye-height1-decr', 'eyes/%s-eye-height1-incr', 'eyes/%s-eye-height2-decr', 'eyes/%s-eye-height2-incr', 'eyes/%s-eye-height3-decr', 'eyes/%s-eye-height3-incr',
              'eyes/%s-eye-push1-in', 'eyes/%s-eye-push1-out', 'eyes/%s-eye-push2-in', 'eyes/%s-eye-push2-out', 'eyes/%s-eye-corner1-up', 'eyes/%s-eye-corner1-down',
              'eyes/%s-eye-corner2-up', 'eyes/%s-eye-corner2-down', 'eyes/%s-eye-eyefold-down', 'eyes/%s-eye-eyefold-up', 'eyes/%s-eye-eyefold-angle-up', 'eyes/%s-eye-eyefold-angle-down',
              'eyes/%s-eye-epicanthus-in', 'eyes/%s-eye-epicanthus-out', 'eyes/%s-eye-bag-decr', 'eyes/%s-eye-bag-incr',
              'cheek/%s-cheek-bones-decr', 'cheek/%s-cheek-bones-incr', 'cheek/%s-cheek-volume-decr', 'cheek/%s-cheek-volume-incr', 'cheek/%s-cheek-inner-decr', 'cheek/%s-cheek-inner-incr',
              'cheek/%s-cheek-trans-up', 'cheek/%s-cheek-trans-down',
              'ears/%s-ear-scale-decr', 'ears/%s-ear-scale-incr', 'ears/%s-ear-wing-decr', 'ears/%s-ear-wing-incr', 'ears/%s-ear-lobe-decr', 'ears/%s-ear-lobe-incr',
              'ears/%s-ear-shape-pointed', 'ears/%s-ear-shape-round', 'ears/%s-ear-shape-square', 'ears/%s-ear-flap-decr', 'ears/%s-ear-flap-incr', 'ears/%s-ear-trans-up', 'ears/%s-ear-trans-down',
              'armslegs/%s-upperarm-fat-incr', 'armslegs/%s-upperarm-muscle-incr', 'armslegs/%s-upperarm-shoulder-muscle-incr', 'armslegs/%s-upperleg-fat-incr', 'armslegs/%s-upperleg-muscle-incr',
              'armslegs/%s-lowerleg-fat-incr', 'armslegs/%s-lowerleg-muscle-incr']:
        S(n % side)
for n in SPARSE: assert exists(n), n

# ---------------------------------------------------------------- الهيكل المختصر + الأوزان
SK = json.load(open(os.path.join(REPO, 'rigs', 'default.mhskel'), encoding='utf-8'))
WT = json.load(open(os.path.join(REPO, 'rigs', 'default_weights.mhw'), encoding='utf-8'))['weights']
BONES = SK['bones']
DROP = re.compile(r'^(levator|oculi|orbicularis|oris|risorius|temporalis|special0[13456]|jaw|eye\.|tongue|toe|breast)')
keep = [b for b in BONES if not DROP.match(b)]
def kept_parent(b):
    while b and b not in keep: b = BONES[b]['parent']
    return b
# ترتيب: الأب قبل الابن
order = []
def visit(b):
    if b in order: return
    p = BONES[b]['parent']
    if p: visit(p)
    order.append(b)
for b in keep: visit(b)
order = [b for b in order if b in keep]
bone_idx = {b: i for i, b in enumerate(order)}
bones_json = [{'n': b, 'p': bone_idx[kept_parent(BONES[b]['parent'])] if BONES[b]['parent'] else -1,
               'h': SK['joints'][BONES[b]['head']], 't': SK['joints'][BONES[b]['tail']]} for b in order]
print('bones', len(order), 'of', len(BONES))
acc = np.zeros((NV, len(order)), np.float32)
for b, lst in WT.items():
    k = bone_idx[kept_parent(b)]
    for vi, w in lst:
        if vi < NV: acc[vi, k] += w
top = np.argsort(-acc, axis=1)[:, :4]
tw = np.take_along_axis(acc, top, axis=1)
s = tw.sum(1, keepdims=True); s[s == 0] = 1; tw = tw / s
no = acc.sum(1) == 0
top[no] = bone_idx['head']; tw[no] = [1, 0, 0, 0]   # المساعدات بلا أوزان (لا تُرسم) ⇒ الرأس
J4 = top.astype(np.uint8); W4 = np.clip(np.round(tw * 255), 0, 255).astype(np.uint8)
fix = 255 - W4.sum(1).astype(np.int32); W4[:, 0] = (W4[:, 0].astype(np.int32) + fix).astype(np.uint8)

# ---------------------------------------------------------------- طوبولوجيا الجسم (تفكيك حسب UV)
def unweld(F, FT, sel, nvt):
    key = {}; vmap = []; uvmap = []; tris = []
    for fi in sel:
        vs, ts = F[fi], FT[fi]; ids = []
        for v, t in zip(vs, ts):
            k = (v, t)
            if k not in key: key[k] = len(vmap); vmap.append(v); uvmap.append(t)
            ids.append(key[k])
        for j in range(1, len(ids) - 1): tris.append((ids[0], ids[j], ids[j + 1]))
    return np.array(vmap), np.array(uvmap), np.array(tris)
body_faces = [i for i, g in enumerate(BASE_G) if g == 'body']
B_vmap, B_uv, B_tri = unweld(BASE_F, BASE_FT, body_faces, len(BASE_VT))
B_face = np.repeat(np.arange(len(body_faces)), [len(BASE_F[f]) - 2 for f in body_faces])   # مثلث ⇒ ترتيب وجهه في faces4 (للحذف تحت الملابس)
print('body render verts', len(B_vmap), 'tris', len(B_tri))

# ---------------------------------------------------------------- القطع المُركّبة (mhclo)
def read_mhclo(path):
    d = {'refs': [], 'del': [], 'scale': {}, 'material': None, 'obj': None, 'name': None, 'zdepth': 50}
    mode = None
    for ln in open(path, encoding='utf-8', errors='replace'):
        if ln.startswith('#'): continue
        s = ln.strip()
        if not s:
            if mode == 'verts': mode = None
            continue
        a = s.split()
        if a[0] == 'verts': mode = 'verts'; continue
        if a[0] == 'delete_verts': mode = 'del'; continue
        if mode == 'verts' and re.match(r'^-?\d', a[0]):
            if len(a) >= 9: d['refs'].append([int(a[0]), int(a[1]), int(a[2]), float(a[3]), float(a[4]), float(a[5]), float(a[6]), float(a[7]), float(a[8])])
            else: d['refs'].append([int(a[0]), int(a[0]), int(a[0]), 1.0, 0.0, 0.0, 0.0, 0.0, 0.0])
            continue
        if mode == 'del' and re.match(r'^\d', a[0]):
            i = 0
            while i < len(a):
                if i + 2 < len(a) and a[i + 1] == '-': d['del'] += list(range(int(a[i]), int(a[i + 2]) + 1)); i += 3
                else: d['del'].append(int(a[i])); i += 1
            continue
        if mode == 'del': mode = None   # كلمة مفتاحية بعد قائمة الحذف؛ المراجع تستمر رغم سطر material داخلها
        if a[0] in ('x_scale', 'y_scale', 'z_scale'): d['scale'][a[0][0]] = [int(a[1]), int(a[2]), float(a[3])]
        elif a[0] == 'material': d['material'] = a[1]
        elif a[0] == 'obj_file': d['obj'] = a[1]
        elif a[0] == 'name': d['name'] = a[1]
        elif a[0] == 'z_depth': d['zdepth'] = int(a[1])
    return d

def read_mhmat(path):
    m = {}
    for ln in open(path, encoding='utf-8', errors='replace'):
        a = ln.strip().split(None, 1)
        if len(a) == 2 and not ln.startswith('#') and not ln.startswith('//'): m[a[0]] = a[1]
    return m

BLOBS = []   # (name, bytes)
def BLOBS_GET(name):
    for n, b, t, sh in BLOBS:
        if n == name: return np.frombuffer(b, dtype=t).reshape(sh)
def blob(name, arr):
    b = arr.tobytes(); BLOBS.append((name, b, str(arr.dtype), list(arr.shape))); return name

PROXIES = []
PROXY_P0 = {}
PROXY_UV = {}
def proxy(kind, pid, folder, mhclo=None, tex=None, extra=None, clip_y=None):
    mh = read_mhclo(os.path.join(folder, mhclo or (os.path.basename(folder) + '.mhclo')))
    V, VT, F, FT, G = read_obj(os.path.join(folder, mh['obj']))
    assert len(mh['refs']) == len(V), (pid, len(mh['refs']), len(V))
    vmap, uvi, tris = unweld(F, FT, range(len(F)), len(VT))
    uv = VT[uvi] if len(VT) else np.zeros((len(vmap), 2))
    R = np.array(mh['refs'])
    sc0 = mh['scale']; sv = [abs(BASE_V[sc0[a][0], k] - BASE_V[sc0[a][1], k]) / sc0[a][2] if a in sc0 else 1 for k, a in enumerate('xyz')]
    P0 = (BASE_V[R[:, 0].astype(int)] * R[:, 3:4] + BASE_V[R[:, 1].astype(int)] * R[:, 4:5] + BASE_V[R[:, 2].astype(int)] * R[:, 5:6]) + R[:, 6:9] * np.array(sv)
    PROXY_P0[pid] = P0   # الموضع المحايد (dm) — لأقنعة ظلّ فروة الرأس لكل تسريحة
    PROXY_UV[pid] = (vmap, uv, tris)   # لأخذ شفافية الخامة عند كل رأس
    if clip_y is not None:   # حذف ما فوق ارتفاع معيّن (جوارب الحذاء تخترق حاشية البنطال) — بالموضع المحايد
        ground = BASE_V[[v for f in body_faces for v in BASE_F[f]], 1].min()
        hy = (P0[vmap][:, 1] - ground) * DM
        keep = (hy[tris] < clip_y).any(1); print(pid, 'clip', int((~keep).sum()), 'of', len(tris)); tris = tris[keep]
    refs = R[vmap][:, :3].astype(np.uint16); w = R[vmap][:, 3:6].astype(np.float32); off = (R[vmap][:, 6:9]).astype(np.float32)
    sc = mh['scale']
    p = {'kind': kind, 'id': pid, 'n': int(len(vmap)), 'scale': [sc.get('x'), sc.get('y'), sc.get('z')],
         'refs': blob(pid + '.refs', refs), 'w': blob(pid + '.w', w), 'off': blob(pid + '.off', off),
         'uv': blob(pid + '.uv', np.clip(np.round(uv * 65535), 0, 65535).astype(np.uint16)),
         'tri': blob(pid + '.tri', tris.astype(np.uint16 if len(vmap) < 65536 else np.uint32)), 'zdepth': mh['zdepth']}
    if mh['del']: p['del'] = blob(pid + '.del', np.array(sorted(set(mh['del'])), np.uint16))
    if extra: p.update(extra)
    if tex: p['tex'] = tex
    PROXIES.append(p); return p

# ---------------------------------------------------------------- الصور
IMAGES = []
def img(name, im, fmt='webp', q=82, size=None, alpha=False):
    if size and im.size[0] != size: im = im.resize((size, size), Image.LANCZOS)
    b = io.BytesIO()
    if fmt == 'jpeg': im.convert('RGB').save(b, 'JPEG', quality=q, optimize=True, progressive=False); mime = 'image/jpeg'
    else: im.save(b, 'WEBP', quality=q, method=6, alpha_quality=90 if alpha else 100); mime = 'image/webp'
    BLOBS.append((name, b.getvalue(), mime, [im.size[0], im.size[1]])); IMAGES.append(name); return name

def gray_alpha(path, size):
    """خامة شعر/حاجب ⇒ رمادي (الإضاءة) + شفافية؛ اللون يُعطى وقت العرض (يتبع لون الشعر المختار)."""
    im = Image.open(path).convert('RGBA'); r, g, b, a = im.split()
    L = Image.merge('RGB', (r, g, b)).convert('L')
    arr = np.asarray(L).astype(np.float32); al = np.asarray(a).astype(np.float32) / 255
    m = arr[al > .5].mean() if (al > .5).any() else arr.mean()
    arr = np.clip(arr * (150.0 / max(m, 1)), 0, 255).astype(np.uint8)   # تطبيع: متوسط الخصلات ≈ 150 مهما كان لون الأصل
    out = Image.merge('RGBA', (Image.fromarray(arr),) * 3 + (a,))
    return out.resize((size, size), Image.LANCZOS)

# ---------------------------------------------------------------- التجميع
def main():
    meta = {'v': 2, 'model': 'mh-cc0', 'units': 'm', 'q': Q, 'nv': NV, 'bones': bones_json, 'builds': {}, 'height': {}, 'targets': [], 'proxies': PROXIES, 'images': IMAGES,
            'license': 'MakeHuman assets CC0 1.0 (makehumancommunity.org); see tools/char3d/SOURCE_AND_LICENSE.md'}
    # البنيات
    for sex in ('male', 'female'):
        meta['builds'][sex] = []
        for bid, o in BUILDS[sex]:
            P = macro(SEXG[sex], **o)
            for rel, w in BUILD_DETAIL[bid].items():
                if sex == 'female' and 'pectoral' in rel: continue
                assert exists(rel), rel; add(P, rel, w)
            P = P * DM
            meta['builds'][sex].append({'id': bid, 'pos': blob('build.%s.%s' % (sex, bid), np.round(P / Q).astype(np.int16))})
        avg = dict(BUILDS[sex])['avg']; P0 = macro(SEXG[sex], **avg)
        for h, v in (('min', 0.0), ('max', 1.0)):
            D = (macro(SEXG[sex], height=v, **{k: x for k, x in avg.items() if k != 'height'}) - P0) * DM
            meta['height'][sex + '.' + h] = blob('height.%s.%s' % (sex, h), np.round(D / Q).astype(np.int16))
    # الأهداف المتفرقة (فرق الأصل بلا تعديل) — الأعراق: منطقة الرأس/الرقبة فقط
    head_y = BASE_V[:, 1] > np.percentile(BASE_V[[v for f in body_faces for v in BASE_F[f]], 1], 82)
    allI, allD, tab = [], [], []
    off = 0
    for rel in SPARSE:
        i, d = target(rel)
        if rel.startswith('macrodetails/'):
            m = head_y[i]; i, d = i[m], d[m]
        d = d * DM; keepm = np.abs(d).max(1) > 2e-6; i, d = i[keepm], d[keepm]
        sc = float(np.abs(d).max()) / 127 if len(i) else 1e-6   # int8 بمقياس لكل هدف (دقة ≤ max/254 ≈ أجزاء من مم)
        allI.append(i.astype(np.uint16)); allD.append(np.round(d / sc).astype(np.int8)); tab.append([rel.split('/')[-1], off, int(len(i)), sc]); off += len(i)
    # فروق الوجه بين الأعراق (مشتقة): T_e − متوسط الثلاثة، على الرأس فقط بتلاشٍ تدريجي عند الرقبة وبلا الإزاحة الصلبة
    hwv = np.zeros(NV)
    for b, lst in WT.items():
        if b in ('head', 'jaw', 'neck03') or DROP.match(b):
            for vi, w in lst:
                if vi < NV: hwv[vi] += w
    for sex in ('male', 'female'):
        T = {e: np.zeros((NV, 3)) for e in ETH}
        for e in ETH: i, d = target('macrodetails/%s-%s-young' % (e, sex)); T[e][i] = d
        mean = sum(T.values()) / 3
        fall = np.clip((hwv - .35) / .45, 0, 1); fall = fall * fall * (3 - 2 * fall)
        core = hwv > .95
        for e in ETH:
            D = T[e] - mean; D = D - D[core].mean(0)          # بلا رفع/إزاحة الرأس كله
            D = D * fall[:, None] * DM
            m = np.abs(D).max(1) > 2e-6; i = np.nonzero(m)[0]
            sc = float(np.abs(D[i]).max()) / 127
            allI.append(i.astype(np.uint16)); allD.append(np.round(D[i] / sc).astype(np.int8)); tab.append(['face-%s-%s' % (e, sex), off, int(len(i)), sc]); off += len(i)
    meta['targets'] = tab
    blob('tg.idx', np.concatenate(allI)); blob('tg.d', np.concatenate(allD))
    print('sparse targets', len(tab), 'entries', off)
    # الجسم
    meta['body'] = {'vmap': blob('body.vmap', B_vmap.astype(np.uint16)), 'uv': blob('body.uv', np.clip(np.round(BASE_VT[B_uv] * 65535), 0, 65535).astype(np.uint16)),
                    'tri': blob('body.tri', B_tri.astype(np.uint16)), 'face': blob('body.face', B_face.astype(np.uint16)),
                    'face4': blob('body.faces', np.array([(BASE_F[f] + [BASE_F[f][-1]])[:4] for f in body_faces], np.uint16))}
    meta['weights'] = {'j': blob('w.j', J4), 'w': blob('w.w', W4)}
    # المجموعات المساعدة (للقشور المولّدة وللاختبارات)
    meta['groups'] = {}
    exec(open(os.path.join(HERE, 'mh_parts.py'), encoding='utf-8').read(), {'proxy': proxy, 'img': img, 'BLOBS_GET': BLOBS_GET, 'PROXY_P0': PROXY_P0, 'PROXY_UV': PROXY_UV, 'gray_alpha': gray_alpha, 'SYS': SYS, 'REPO': REPO, 'GEN': GEN, 'Image': Image,
                                                                           'np': np, 'blob': blob, 'meta': meta, 'BASE_V': BASE_V, 'BASE_VT': BASE_VT, 'B_vmap': B_vmap, 'B_uv': B_uv,
                                                                           'B_tri': B_tri, 'BASE_F': BASE_F, 'BASE_G': BASE_G, 'body_faces': body_faces, 'read_mhmat': read_mhmat, 'os': os,
                                                                           'macro': macro, 'BUILDS': BUILDS, 'SEXG': SEXG, 'DM': DM, 'J4': J4, 'W4': W4, 'bone_idx': bone_idx})
    # الكتابة: CDC2 | uint32 طول JSON | JSON | الكتل (محاذاة 4)
    bin_ = bytearray(); table = {}
    for name, b, typ, shape in BLOBS:
        while len(bin_) % 4: bin_.append(0)
        table[name] = [len(bin_), len(b), typ, shape]; bin_ += b
    meta['blobs'] = table
    js = json.dumps(meta, separators=(',', ':')).encode('utf-8')
    while len(js) % 4: js += b' '
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'wb') as f: f.write(b'CDC2' + struct.pack('<I', len(js)) + js + bytes(bin_))
    tot = os.path.getsize(OUT)
    print('codis_char.bin', round(tot / 1024), 'KB  (json', round(len(js) / 1024), 'KB)')
    kinds = {}
    for name, b, typ, shape in BLOBS:
        k = 'image' if typ.startswith('image/') else name.split('.')[0]
        kinds[k] = kinds.get(k, 0) + len(b)
    print({k: round(v / 1024) for k, v in sorted(kinds.items(), key=lambda x: -x[1])})

if __name__ == '__main__': main()
