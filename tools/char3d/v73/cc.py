"""CODIS-V73 — تقسيم Catmull–Clark (مستوى واحد) للجسم الرباعي المغلق (13,378 وجهاً).
   خطّي بالمواضع ⇒ نفس المؤثر يُطبَّق بعد مزج أي أهداف/بنيات/طول (العرض يعيده بالجافاسكربت بنفس القواعد: tools/box3d/src/char.js).
   الفهرسة الجديدة: [0..NV) = نقاط الرؤوس (المساعدات تمرّ كما هي) · [NV..NV+NE) نقاط الحواف · [NV+NE..) نقاط الوجوه."""
import numpy as np
from common import BODY_Q, BODY_QT, BASE_VT, NV


def topology(Q=BODY_Q):
    nf = len(Q)
    a = Q.reshape(-1); b = np.roll(Q, -1, axis=1).reshape(-1)
    lo, hi = np.minimum(a, b), np.maximum(a, b)
    key = lo * NV + hi
    uk, inv = np.unique(key, return_inverse=True)
    E = np.stack([uk // NV, uk % NV], 1)                     # الحواف (فريدة)
    fe = inv.reshape(nf, 4)                                  # حافة كل ضلع: (a,b),(b,c),(c,d),(d,a)
    ef = -np.ones((len(E), 2), np.int64); cnt = np.zeros(len(E), np.int64)
    for f in range(nf):
        for k in range(4):
            e = fe[f, k]; ef[e, cnt[e]] = f; cnt[e] += 1
    assert (cnt == 2).all(), 'mesh must be closed 2-manifold'
    return E, fe, ef


E, FE, EF = topology()
NE, NF = len(E), len(BODY_Q)
NSV = NV + NE + NF
# الجوار لكل رأس (للنقطة الجديدة): الحواف والوجوه المجاورة
_vf = [[] for _ in range(NV)]
for f, q in enumerate(BODY_Q):
    for v in q: _vf[v].append(f)
_ve = [[] for _ in range(NV)]
for e, (x, y) in enumerate(E): _ve[x].append(e); _ve[y].append(e)
VAL = np.array([len(l) for l in _ve])


def subdivide(P):
    """P: (NV,3) ⇒ (NSV,3) مواضع المستوى الأول (المساعدات بلا تغيير)."""
    FP = P[BODY_Q].mean(1)
    EP = (P[E[:, 0]] + P[E[:, 1]] + FP[EF[:, 0]] + FP[EF[:, 1]]) / 4
    VP = P.copy()
    mid = (P[E[:, 0]] + P[E[:, 1]]) / 2
    for v in np.nonzero(VAL)[0]:
        n = VAL[v]; Fa = FP[_vf[v]].mean(0); Ra = mid[_ve[v]].mean(0)
        VP[v] = (Fa + 2 * Ra + (n - 3) * P[v]) / n
    return np.concatenate([VP, EP, FP])


def quads():
    """الرباعيات الجديدة على فهرسة SV + زوايا UV لكل رباعي (4 زوايا)."""
    Q = BODY_Q; fe = FE; nf = len(Q)
    out = np.zeros((nf * 4, 4), np.int64); uv = np.zeros((nf * 4, 4, 2))
    UVc = BASE_VT[BODY_QT]                                   # (nf,4,2)
    for k in range(4):
        a = Q[:, k]; e_next = fe[:, k]; e_prev = fe[:, (k + 3) % 4]
        out[k::4, 0] = a; out[k::4, 1] = NV + e_next; out[k::4, 2] = NV + NE + np.arange(nf); out[k::4, 3] = NV + e_prev
        ua = UVc[:, k]; ub = UVc[:, (k + 1) % 4]; ud = UVc[:, (k + 3) % 4]; uf = UVc.mean(1)
        uv[k::4, 0] = ua; uv[k::4, 1] = (ua + ub) / 2; uv[k::4, 2] = uf; uv[k::4, 3] = (ua + ud) / 2
    return out, uv


def normals(P, Qd):
    """عموديات الرؤوس (مساحة موزونة بحاصل ضرب القطرين) على رباعيات مغلقة."""
    n = np.cross(P[Qd[:, 2]] - P[Qd[:, 0]], P[Qd[:, 3]] - P[Qd[:, 1]])
    N = np.zeros_like(P)
    for k in range(4): np.add.at(N, Qd[:, k], n)
    l = np.linalg.norm(N, axis=1, keepdims=True); l[l == 0] = 1
    return N / l


SQ, SUV = quads()
