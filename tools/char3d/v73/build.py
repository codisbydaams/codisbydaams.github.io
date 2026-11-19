"""CODIS-V73 — بناء أصل الشخصية: tools/char3d/dist/codis_char_v73.bin (حاوية CDC3).
   py -3 tools/char3d/v73/build.py        (numpy · scipy · pillow · numba — لا Blender)
   المصادر: MakeHuman CC0 (tools/char3d/source/mh) + مولّدات v73 (الجلد/الشعر/الملابس). التفاصيل: tools/char3d/SOURCE_AND_LICENSE.md"""
import os, sys, json, time, re
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
import cc
from rt import Tracer
import skin as SK
import defs as D

T0 = time.time()
def log(*a): print('[%5.1fs]' % (time.time() - T0), *a, flush=True)
PK = Pack()
OUT = os.path.join(DIST, 'codis_char_v73.bin')

# ------------------------------------------------------------------ الهيكل المختصر + الأوزان (كما V72: عظام الوجه/اللسان/أصابع القدم ⇒ أقرب أب)
BONES = SKEL['bones']
DROP = re.compile(r'^(levator|oculi|orbicularis|oris|risorius|temporalis|special0[13456]|jaw|eye\.|tongue|toe|breast)')
keep = [b for b in BONES if not DROP.match(b)]
def kept_parent(b):
    while b and b not in keep: b = BONES[b]['parent']
    return b
order = []
def visit(b):
    if b in order: return
    if BONES[b]['parent']: visit(BONES[b]['parent'])
    order.append(b)
for b in keep: visit(b)
order = [b for b in order if b in keep]
bidx = {b: i for i, b in enumerate(order)}
bones_json = [{'n': b, 'p': bidx[kept_parent(BONES[b]['parent'])] if BONES[b]['parent'] else -1, 'h': SKEL['joints'][BONES[b]['head']], 't': SKEL['joints'][BONES[b]['tail']]} for b in order]
acc = np.zeros((NV, len(order)), np.float32)
for b, lst in WEIGHTS.items():
    k = bidx[kept_parent(b)]
    for vi, w in lst:
        if vi < NV: acc[vi, k] += w
top = np.argsort(-acc, axis=1)[:, :4]; tw = np.take_along_axis(acc, top, axis=1)
s = tw.sum(1, keepdims=True); s[s == 0] = 1; tw = tw / s
no = acc.sum(1) == 0; top[no] = bidx['head']; tw[no] = [1, 0, 0, 0]
J4 = top.astype(np.uint8); W4 = np.clip(np.round(tw * 255), 0, 255).astype(np.int32)
W4[:, 0] += 255 - W4.sum(1); W4 = W4.astype(np.uint8)
log('bones', len(order))

def main():
    meta = {'v': 3, 'model': 'mh-cc0', 'units': 'm', 'q': Q, 'nv': NV, 'bones': bones_json, 'builds': {}, 'targets': [], 'proxies': [], 'masks': {}, 'tex': {}, 'skins': {},
            'license': 'MakeHuman assets CC0 1.0 + CODIS generated assets; see tools/char3d/SOURCE_AND_LICENSE.md'}
    # --- الطوبولوجيا + UV لكل زاوية + أقرب رأس جسم للمساعدات
    meta['body'] = {'q4': PK.arr('body.q4', BODY_Q.astype(np.uint16)), 'uv': PK.arr('body.uv', np.clip(np.round(BASE_VT[BODY_QT] * 65535), 0, 65535).astype(np.uint16))}
    from scipy.spatial import cKDTree
    kd = cKDTree(BASE_V[BODY_VERTS]); near = np.arange(NV)
    hv = np.nonzero(~IS_BODY)[0]; near[hv] = BODY_VERTS[kd.query(BASE_V[hv])[1]]
    meta['body']['near'] = PK.arr('body.near', near.astype(np.uint16))
    meta['weights'] = {'j': PK.arr('w.j', J4), 'w': PK.arr('w.w', W4)}
    # --- البنيات (مواضع كاملة int16)
    for sex in ('male', 'female'):
        meta['builds'][sex] = []
        bl = dict(D.builds(sex)); qa = q16(bl['avg'] * DM).astype(np.int32)
        for bid, P in D.builds(sex):   # المتوسطة كاملة، والبقية فرق عنها (تُضغط أفضل)
            if bid == 'avg': meta['builds'][sex].append({'id': bid, 'pos': PK.arr('build.%s.%s' % (sex, bid), qa.astype(np.int16))})
            else: meta['builds'][sex].append({'id': bid, 'base': 'avg', 'pos': PK.arr('build.%s.%s' % (sex, bid), (q16(P * DM).astype(np.int32) - qa).astype(np.int16))})
        log('builds', sex, [b['id'] for b in meta['builds'][sex]])
    # --- الأهداف المتفرقة (int8 بمقياس لكل هدف)
    allI, allD, tab, off = [], [], [], 0
    def put(name, i, d):
        nonlocal off
        m = np.abs(d).max(1) > 5e-5; i, d = i[m], d[m]   # أقل من 0.05مم لا أثر مرئي
        sc = float(np.abs(d).max()) / 127 if len(i) else 1e-9
        allI.append(i.astype(np.uint16)); allD.append(np.round(d / sc).astype(np.int8)); tab.append([name, off, int(len(i)), sc]); off += len(i)
    for rel in D.SPARSE:
        i, d = target(rel); put(rel.split('/')[-1], i, d * DM)
    for name, Dd in D.derived():
        i = np.nonzero(np.abs(Dd).max(1) > 1e-7)[0]; put(name, i, Dd[i] * DM)
    meta['targets'] = tab; meta['tgIdx'] = PK.arr('tg.idx', np.concatenate(allI)); meta['tgD'] = PK.arr('tg.d', np.concatenate(allD))
    log('targets', len(tab), 'entries', off)
    # --- AO + السماكة (مخبوزة على الجسم المحايد المقسَّم، لكل رأس أصلي)
    P0 = macro(.5, .5, .5) * DM; S0 = cc.subdivide(P0); N0 = cc.normals(S0, cc.SQ)
    tr = Tracer(S0, np.concatenate([cc.SQ[:, [0, 1, 2]], cc.SQ[:, [0, 2, 3]]]))
    ao = np.ones(NV); th = np.zeros(NV)
    ao[BODY_VERTS] = tr.ao(S0[BODY_VERTS], N0[BODY_VERTS], nray=256, dist=.11)
    t = tr.thickness(S0[BODY_VERTS], N0[BODY_VERTS], nray=64, dist=.05)
    th[BODY_VERTS] = np.clip(1 - (t - .004) / .022, 0, 1) ** 1.5           # ≤4مم ⇒ 1 ، ≥26مم ⇒ 0
    ao = np.clip(ao ** 1.15, 0, 1)
    meta['body']['ao'] = PK.arr('body.ao', u8(ao)); meta['body']['thick'] = PK.arr('body.thick', u8(th))
    log('ao/thickness baked', 'ao min %.2f mean %.2f' % (ao[BODY_VERTS].min(), ao[BODY_VERTS].mean()), 'thin verts', int((th > .5).sum()))
    # --- الرمش: أوزان الجفن العلوي (MakeHuman orbicularis03) + حافتا الجفنين + مركز العين (المساعد)
    meta['blink'] = {}
    for s in 'LR':
        wu = bone_weight(r'^orbicularis03\.' + s); wl = bone_weight(r'^orbicularis04\.' + s)
        eye_h = np.array([v for v, g in VGROUP.items() if g == 'helper-%s-eye' % s.lower()])
        c = BASE_V[eye_h].mean(0)
        vi = np.nonzero(wu > .02)[0]
        near_c = np.abs(BASE_V[:, 0] - c[0]) < .07
        mu = np.nonzero((wu > .5) & IS_BODY & near_c)[0]; mu = mu[np.argsort(BASE_V[mu, 1])[:3]]
        ml = np.nonzero((wl > .5) & IS_BODY & near_c)[0]; ml = ml[np.argsort(-BASE_V[ml, 1])[:3]]
        meta['blink'][s] = {'v': PK.arr('blink.%s.v' % s, vi.astype(np.uint16)), 'w': PK.arr('blink.%s.w' % s, u8(wu[vi])), 'c': PK.arr('blink.%s.c' % s, eye_h.astype(np.uint16)),
                            'mu': PK.arr('blink.%s.mu' % s, mu.astype(np.uint16)), 'ml': PK.arr('blink.%s.ml' % s, ml.astype(np.uint16)), 'k': 1.0}
        log('blink', s, 'lid verts', len(vi), 'margins', mu.tolist(), ml.tolist())
    # --- خامات الجلد
    meta['tex']['lut'] = PK.img('tex.lut', SK.lut(), 'png')
    # ذاكرة مؤقتة للخامات الثقيلة (work/v73/cache) — FRESH=1 لإعادة التوليد
    cdir = os.path.join(WORK, 'cache'); os.makedirs(cdir, exist_ok=True); fresh = os.environ.get('FRESH') == '1'
    names = [(sex, k) for sex in SK.SKIN_SRC for k, _ in SK.SKIN_SRC[sex]]
    if fresh or not all(os.path.exists(os.path.join(cdir, 'skin_%s_%s.png' % nk)) for nk in names) or not os.path.exists(os.path.join(cdir, 'region.png')):
        sk = SK.skins(1536)
        for sex in sk:
            for k, im in sk[sex]: im.save(os.path.join(cdir, 'skin_%s_%s.png' % (sex, k)))
        reg, dens = SK.region(Image.open(os.path.join(SYS, 'skins', SK.SKIN_SRC['male'][0][1])), 1024); reg.save(os.path.join(cdir, 'region.png'))   # الشعر المرسوم من الأصل (قبل التنظيف)
    sk = {sex: [(k, Image.open(os.path.join(cdir, 'skin_%s_%s.png' % (sex, k))).convert('RGB')) for k, _ in SK.SKIN_SRC[sex]] for sex in SK.SKIN_SRC}
    reg = Image.open(os.path.join(cdir, 'region.png'))
    meta['tex']['region'] = PK.img('tex.region', reg, 'webp', lossless=True)
    meta['tex']['detail'] = PK.img('tex.detail', SK.detail(), 'jpeg', 92); meta['tex']['detailRep'] = 56
    meta['tex']['stub'] = PK.img('tex.stub', SK.stubble().resize((384, 384)), 'jpeg', 84)
    for sex in sk:
        meta['skins'][sex] = [{'id': k, 'img': PK.img('skin.%s.%s' % (sex, k), im, 'jpeg', 84)} for k, im in sk[sex]]
    log('skin textures')
    # --- القطع (العينان/الرموش/الحواجب/الشعر/الملابس/الحذاء) — parts.py
    import parts
    parts.build(PK, meta, log)
    # --- الكتابة
    tot, js, kinds = PK.write(OUT, meta)
    import gzip
    raw = open(OUT, 'rb').read(); open(OUT, 'wb').write(gzip.compress(raw, 9, mtime=0))   # gzip (العارض يفك بـDecompressionStream أو بديل JS)
    log('codis_char_v73.bin raw', round(tot / 1024), 'KB -> gz', round(os.path.getsize(OUT) / 1024), 'KB (json', round(js / 1024), 'KB)'); print(kinds)

if __name__ == '__main__': main()
