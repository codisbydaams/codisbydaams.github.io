# CODIS-V72 — القشور المولّدة (يُنفَّذ داخل mh_parts.py بنطاق mh_build.py)
# اللحية وقصّات «الحلاقة القصيرة» = طبقات من سطح الجلد نفسه (نفس رؤوس الجسم ⇒ تتبع أي وجه/جسم تلقائياً)، كثافة لكل نمط من أقنعة
# هندسية مبنية على معالم الهيكل (العينان/الفم/الذقن/الأذنان من default.mhskel) — لا رسم يدوي.
import json as _json
_SK = _json.load(open(os.path.join(REPO, 'rigs', 'default.mhskel'), encoding='utf-8'))
def _J(name, end='head'): return BASE_V[_SK['joints'][_SK['bones'][name][end]]].mean(0)
_eye = _J('eye.L'); _mU = _J('oris05'); _mL = _J('oris01'); _chin = _J('special04'); _jaw = _J('jaw')
_V = BASE_V   # dm، النموذج المحايد (الأقنعة على الفهارس ⇒ صالحة لكل شكل)
def _ss(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

# رؤوس الرأس فقط (من أوزان MakeHuman الأصلية: الرأس + عظام الوجه + الرقبة العليا)
_WT = _json.load(open(os.path.join(REPO, 'rigs', 'default_weights.mhw'), encoding='utf-8'))['weights']
_hw = np.zeros(len(_V))
import re as _re
for b, lst in _WT.items():
    if b == 'head' or b == 'jaw' or b == 'neck03' or _re.match(r'^(levator|oculi|orbicularis|oris|risorius|temporalis|special0[13456]|eye\.|tongue)', b):
        for vi, w in lst:
            if vi < len(_hw): _hw[vi] += w
x, y, z = _V[:, 0], _V[:, 1], _V[:, 2]; ax = np.abs(x)

# ---------------- اللحية ----------------
# الحد العلوي على الخدّين: من السوالف أمام الأذن (≈7.08) إلى زاوية الفم (≈6.86)؛ الشارب بين الشفة العليا وقاعدة الأنف
y_cheek = 6.86 + _ss(.2, .62, ax) * .24
front = _ss(.45, .7, z)                                   # أمام الأذن
neck_cut = _ss(5.86, 6.02, y) * (1 - _ss(.2, .55, -(z - .55)) * 0)   # أسفل الرقبة لا لحية
under = (y < _chin[1] + .05) & (z > .55)                  # تحت الذقن
lips = (ax < .2) & (y > _mL[1] - .02) & (y < _mU[1] + .03) & (z > 1.38)
mous = (ax < .3) & (y > _mU[1] - .01) & (y < _mU[1] + .2) & (z > 1.3)
beard_all = (_hw > .3) & (y < y_cheek + .02) & (y > 5.9) & (z > .48) & ~lips & (ax < .72)
beard_all |= mous & (_hw > .3) & ~lips
soft = (1 - _ss(y_cheek - .1, y_cheek + .02, y)) * _ss(5.88, 6.05, y) * _ss(.46, .62, z)
soft = np.where(mous, np.maximum(soft, 1 - _ss(_mU[1] + .12, _mU[1] + .2, y)), soft)
chin_zone = (ax < .34 + (_chin[1] + .25 - y).clip(0) * .2) & (z > .9) & (y < _mU[1] + .02)
STYLES = {
    'full':    beard_all * soft,
    'short':   beard_all * soft,
    'stubble': beard_all * soft,
    'goatee':  (beard_all & (chin_zone | mous)) * soft * (1 - _ss(.26, .36, ax) * (~mous)),      # سكسوكة: شارب + ذقن
    'chin':    (beard_all & chin_zone & ~mous) * soft * (1 - _ss(.24, .34, ax)),                  # ذقن فقط
    'mustache': (mous & ~lips).astype(float) * (1 - _ss(.22, .3, ax)),                             # شارب
}
def shell(name, styles):
    m = np.zeros(len(_V), bool)
    for v in styles.values(): m |= v > .02
    # مثلثات الجسم المرئي التي كل رؤوسها داخل المنطقة
    rv = m[B_vmap]                                   # رأس عرض ⇒ داخل؟
    T = B_tri[rv[B_tri].all(1)]
    used = np.unique(T); remap = -np.ones(len(B_vmap), np.int64); remap[used] = np.arange(len(used))
    d = {'v': blob('shell.%s.v' % name, used.astype(np.uint16)), 'tri': blob('shell.%s.tri' % name, remap[T].astype(np.uint16).ravel()), 'dens': {}}
    for k, v in styles.items(): d['dens'][k] = blob('shell.%s.%s' % (name, k), np.clip(np.round(v[B_vmap[used]] * 255), 0, 255).astype(np.uint8))
    meta.setdefault('shells', {})[name] = d
    print('shell', name, 'verts', len(used), 'tris', len(T), {k: int((v > .02).sum()) for k, v in styles.items()})
shell('beard', STYLES)

# ---------------- فروة الرأس (الحلاقة القصيرة + ظلّ منبت الشعر تحت كل تسريحة) ----------------
y_front = 7.80 - _ss(.08, .6, ax) * .36                    # خط المنبت الأمامي (الوسط ⇒ الصدغ)
ear = (ax > .6) & (y < 7.55) & (y > 6.8) & (z > -.25) & (z < .85)
scalp_line = np.where(z > .62, y_front, np.where(z > .1, 7.14 + (z - .1) * .55, 6.88 + _ss(-.6, .1, z) * .26))
scalp = (_hw > .45) & (y > scalp_line - .02) & ~ear
s_soft = _ss(scalp_line - .03, scalp_line + .1, y) * (1 - (ear * 1.0))
fade = s_soft * (1 - _ss(.35, .62, ax) * (1 - _ss(7.75, 8.05, y)) * .85)   # جوانب أخف (تدريج)
shell('scalp', {'buzz': scalp * s_soft, 'fade': scalp * fade, 'crew': scalp * s_soft})
# قناع على الجسم نفسه (ظلّ الشعر على الجلد تحت أي تسريحة + ظلّ اللحية) — قناتان uint8 لكل رأس أصلي
meta['hairMask'] = blob('hairmask', np.stack([np.clip(np.round(s_soft * scalp * 255), 0, 255), np.clip(np.round(STYLES['full'] * 255), 0, 255)], 1).astype(np.uint8))
meta['beardMask'] = {k: blob('beardmask.' + k, np.clip(np.round(v * 255), 0, 255).astype(np.uint8)) for k, v in STYLES.items()}
# خامة الشعيرات المتكررة (gen_textures.py)
meta['strands'] = img('tex.strands', Image.open(os.path.join(GEN, 'strands.png')).convert('RGB'), 'webp', 92, 256)

# ---------------- ظلّ فروة الرأس لكل تسريحة: رؤوس الرأس القريبة من مجسّم التسريحة نفسها (بالموضع المحايد) ----------------
from scipy.spatial import cKDTree as _KD
_cand = (_hw > .4) & ((y > _eye[1] + .3) | ((z < .65) & (y > 6.95))) & ~ear
# عموديات الرؤوس (النموذج المحايد) — الظلّ فقط حيث يغطي الشعر الجلدَ فعلاً على امتداد العمودي (لا حول حافة التسريحة)
_N = np.zeros_like(_V)
for _f in body_faces:
    _q = BASE_F[_f]; _a, _b, _c = _V[_q[0]], _V[_q[1]], _V[_q[2]]; _n = np.cross(_b - _a, _c - _a)
    for _i in _q: _N[_i] += _n
_N /= np.maximum(np.linalg.norm(_N, axis=1, keepdims=True), 1e-9)
_ci = np.nonzero(_cand)[0]
meta['hairScalp'] = {}
for _p in [p for p in meta['proxies'] if p['kind'] == 'hair']:
    # رؤوس الشعر المعتمة فقط (شفافية الخامة عند UV الرأس > 0.45): أطراف الغرّة الشفافة لا تُظلّل الجبهة
    _vm, _uv, _tr = PROXY_UV[_p['id']]; _tx = HAIR_TEX.get(_p['id'], _p['id'] + '_diffuse.png')
    _A = np.asarray(Image.open(J('hair', _p['id'], _tx)).convert('RGBA'))[..., 3].astype(np.float32) / 255; _S = _A.shape[0]
    _al = _A[np.clip(((1 - _uv[:, 1]) * _S).astype(int), 0, _S - 1), np.clip((_uv[:, 0] * _S).astype(int), 0, _S - 1)]
    _op = np.zeros(len(PROXY_P0[_p['id']])); np.maximum.at(_op, _vm, _al)
    _H = PROXY_P0[_p['id']][_op > .45]; _T = _KD(_H); _m = np.zeros(len(_V))
    for _k, _lst in zip(_ci, _T.query_ball_point(_V[_ci], .4)):
        if not _lst: continue
        _d = _H[_lst] - _V[_k]; _al = _d @ _N[_k]; _lat = np.linalg.norm(_d - _al[:, None] * _N[_k], axis=1)
        _ok = (_al > -.01) & (_al < .4); 
        if _ok.any(): _m[_k] = 1 - _ss(.06, .14, _lat[_ok].min())
    meta['hairScalp'][_p['id']] = blob('hairscalp.' + _p['id'], np.clip(np.round(_m * 255), 0, 255).astype(np.uint8))
print('hair scalp masks', len(meta['hairScalp']))
