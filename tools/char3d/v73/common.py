"""CODIS-V73 — قراءة صيغ MakeHuman (CC0) + سجلّ الكتل/الصور + كاتب الحاوية CDC3.
   يُستورد من كل وحدات v73 (لا Blender، لا كود MakeHuman — قراءة الصيغ مباشرة)."""
import os, re, json, io, struct
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
C3D = os.path.dirname(HERE)                                   # tools/char3d
REPO = os.path.join(C3D, 'source', 'mh', 'repo', 'makehuman-master', 'makehuman', 'data')
SYS = os.path.join(C3D, 'source', 'mh', 'sys')
WORK = os.path.join(C3D, 'work', 'v73')
DIST = os.path.join(C3D, 'dist')
os.makedirs(WORK, exist_ok=True)
DM = 0.1        # MakeHuman بالديسيمتر ⇒ متر
Q = 4e-5        # كمّ الموضع للمواضع الكاملة (int16 ⇒ ±1.31م بدقة 0.04مم)


# ------------------------------------------------------------------ OBJ
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
    return np.array(V, np.float64), (np.array(VT, np.float64) if VT else np.zeros((0, 2))), F, FT, G


BASE_V, BASE_VT, BASE_F, BASE_FT, BASE_G = read_obj(os.path.join(REPO, '3dobjs', 'base.obj'))
NV = len(BASE_V)
BODY_FACES = [i for i, g in enumerate(BASE_G) if g == 'body']
BODY_Q = np.array([BASE_F[i] for i in BODY_FACES], np.int64)          # 13378×4 (كلها رباعية، مغلقة، متشعبة)
BODY_QT = np.array([BASE_FT[i] for i in BODY_FACES], np.int64)         # فهارس UV لكل زاوية
BODY_VERTS = np.unique(BODY_Q)
IS_BODY = np.zeros(NV, bool); IS_BODY[BODY_VERTS] = True
VGROUP = {}
for f, g in zip(BASE_F, BASE_G):
    for v in f:
        if g == 'body' or v not in VGROUP: VGROUP[v] = g


# ------------------------------------------------------------------ targets
_tcache = {}
def target_path(rel): return os.path.join(REPO, 'targets', rel + '.target')
def exists(rel): return os.path.exists(target_path(rel))
def target(rel):
    if rel in _tcache: return _tcache[rel]
    idx, d = [], []
    for ln in open(target_path(rel), encoding='utf-8'):
        if not ln.strip() or ln[0] == '#': continue
        a = ln.split(); idx.append(int(a[0])); d.append([float(a[1]), float(a[2]), float(a[3])])
    r = (np.array(idx, np.int64), np.array(d, np.float64).reshape(-1, 3))
    _tcache[rel] = r; return r
def add(P, rel, w):
    if not w: return
    assert exists(rel), rel
    i, d = target(rel); P[i] += d * w
def dense(rel):
    D = np.zeros((NV, 3)); i, d = target(rel); D[i] = d; return D


# ------------------------------------------------------------------ macro model (MakeHuman: شاب 25 سنة)
def tri(v):
    mx = max(0.0, v * 2 - 1); mn = max(0.0, 1 - v * 2); return {'min': mn, 'average': 1 - mx - mn, 'max': mx}
def tri_alt(v):
    mx = max(0.0, v * 2 - 1); mn = max(0.0, 1 - v * 2); return {'min': mn, 'average': 1 - max(mx, mn), 'max': mx}
ETH = ('caucasian', 'african', 'asian')
def macro(gender, muscle=.5, weight=.5, height=.5, prop=.5, cup=.5, firm=.5, age='young', eth=(1 / 3, 1 / 3, 1 / 3)):
    """مواضع الجسم الكاملة (dm) لأوزان ماكرو MakeHuman. الأعراق (مجموعها 1) تحمل شكل الجنس للجسم كله."""
    P = BASE_V.copy()
    G = {'female': 1 - gender, 'male': gender}
    for g, gw in G.items():
        if gw:
            for e, ew in zip(ETH, eth): add(P, 'macrodetails/%s-%s-%s' % (e, g, age), gw * ew)
    M = tri(muscle); W = tri(weight); H = tri_alt(height); C = tri_alt(cup); FI = tri_alt(firm)
    for g, gw in G.items():
        if not gw: continue
        for m, mw in M.items():
            for w, ww in W.items():
                base = gw * mw * ww
                if not base: continue
                add(P, 'macrodetails/universal-%s-%s-%smuscle-%sweight' % (g, age, m, w), base)
                for h in ('min', 'max'):
                    if H[h]: add(P, 'macrodetails/height/%s-%s-%smuscle-%sweight-%sheight' % (g, age, m, w, h), base * H[h])
                if prop > .5: add(P, 'macrodetails/proportions/%s-%s-%smuscle-%sweight-idealproportions' % (g, age, m, w), base * (prop * 2 - 1))
                if prop < .5: add(P, 'macrodetails/proportions/%s-%s-%smuscle-%sweight-uncommonproportions' % (g, age, m, w), base * (1 - prop * 2))
                if g == 'female':
                    for c in ('min', 'average', 'max'):
                        for f in ('min', 'average', 'max'):
                            if c == 'average' and f == 'average': continue
                            if C[c] * FI[f]: add(P, 'breast/female-%s-%smuscle-%sweight-%scup-%sfirmness' % (age, m, w, c, f), base * C[c] * FI[f])
    return P


# ------------------------------------------------------------------ skeleton / weights
SKEL = json.load(open(os.path.join(REPO, 'rigs', 'default.mhskel'), encoding='utf-8'))
WEIGHTS = json.load(open(os.path.join(REPO, 'rigs', 'default_weights.mhw'), encoding='utf-8'))['weights']
def joint(name, end='head', P=None):
    P = BASE_V if P is None else P
    return P[SKEL['joints'][SKEL['bones'][name][end]]].mean(0)
def bone_weight(pattern, P=None):
    """مجموع أوزان العظام المطابقة لكل رأس (0..1)."""
    w = np.zeros(NV); rx = re.compile(pattern)
    for b, lst in WEIGHTS.items():
        if rx.match(b):
            for vi, x in lst:
                if vi < NV: w[vi] += x
    return np.clip(w, 0, 1)


# ------------------------------------------------------------------ mhclo / mhmat
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
        if mode == 'del': mode = None
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


# ------------------------------------------------------------------ registry + container
class Pack:
    """كتل ثنائية مسمّاة + صور مضغوطة ⇒ حاوية CDC3 واحدة:  'CDC3' | uint32 طول JSON | JSON | الكتل (محاذاة 4)."""
    def __init__(self): self.blobs = []; self.names = set()
    def arr(self, name, a):
        assert name not in self.names, name; self.names.add(name)
        a = np.ascontiguousarray(a); self.blobs.append((name, a.tobytes(), str(a.dtype), list(a.shape))); return name
    def img(self, name, im, fmt='webp', q=85, size=None, lossless=False):
        assert name not in self.names, name; self.names.add(name)
        if size and im.size[0] != size: im = im.resize((size, int(round(size * im.size[1] / im.size[0]))), Image.LANCZOS)
        b = io.BytesIO()
        if fmt == 'jpeg': im.convert('RGB').save(b, 'JPEG', quality=q, optimize=True, subsampling=0 if q >= 90 else 2); mime = 'image/jpeg'
        elif fmt == 'png': im.save(b, 'PNG', optimize=True); mime = 'image/png'
        else:
            if lossless: im.save(b, 'WEBP', lossless=True, quality=100, method=6)
            else: im.save(b, 'WEBP', quality=q, method=6, alpha_quality=95)
            mime = 'image/webp'
        self.blobs.append((name, b.getvalue(), mime, [im.size[0], im.size[1]])); return name
    def get(self, name):
        for n, b, t, sh in self.blobs:
            if n == name: return np.frombuffer(b, dtype=t).reshape(sh)
    def write(self, path, meta):
        body = bytearray(); table = {}
        for name, b, typ, shape in self.blobs:
            while len(body) % 4: body.append(0)
            table[name] = [len(body), len(b), typ, shape]; body += b
        meta = dict(meta); meta['blobs'] = table
        js = json.dumps(meta, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
        while len(js) % 4: js += b' '
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'wb') as f: f.write(b'CDC3' + struct.pack('<I', len(js)) + js + bytes(body))
        kinds = {}
        for name, b, typ, shape in self.blobs:
            k = 'img:' + name.split('.')[0] if typ.startswith('image/') else name.split('.')[0]
            kinds[k] = kinds.get(k, 0) + len(b)
        return os.path.getsize(path), len(js), {k: round(v / 1024) for k, v in sorted(kinds.items(), key=lambda x: -x[1])}


def q16(x, scale=Q): return np.clip(np.round(np.asarray(x) / scale), -32767, 32767).astype(np.int16)
def q8n(x):
    """int8 بمقياس للكتلة كلها ⇒ (القيم، المقياس)."""
    x = np.asarray(x, np.float64); s = float(np.abs(x).max()) / 127 if x.size and np.abs(x).max() > 0 else 1e-9
    return np.clip(np.round(x / s), -127, 127).astype(np.int8), s
def u8(x): return np.clip(np.round(np.asarray(x) * 255), 0, 255).astype(np.uint8)
def smoothstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
