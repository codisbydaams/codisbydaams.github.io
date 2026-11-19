"""CODIS-V73 — مولّد الشعر/اللحية/الحواجب (تسريحات حقيقية ثلاثية الأبعاد من بطاقات خصل):
   1) فروة الرأس من الجسم المحايد المقسَّم (قناع منبت طبيعي بتلاشٍ عند الحافة) ⇒ جذور موزّعة بالتساوي (Poisson).
   2) كل خصلة دليلية تُنمى خطوةً خطوة: حقل تمشيط لكل تسريحة (فرق/للخلف/للأمام/دوّامة/شعاعي/نقطة ربط) + ارتفاع حجم
      فوق الفروة + جاذبية خارج الرأس + تصادم مع الرأس/الأذنين/الرقبة/الكتفين (أقرب سطح ⇒ دفع للخارج) + تموّج/تجعّد.
   3) الخصلة ⇒ بطاقة مستدقّة مسطحة على سطح الشعر (عرض/التفاف عشوائي) بطبقات (داخلية أغمق ⇒ ظل ذاتي) + خصل طائرة.
   4) كل رأس بطاقة مربوط بأقرب مثلث من الجسم (3 رؤوس + إزاحة، صيغة mhclo) ⇒ يتبع أي وجه/رأس/بنية وقت العرض.
   حتمي (بذور ثابتة). المراجع: Koh & Huang (بطاقات الشعر)، Scheuermann 2004 (التظليل)، أدوات Hair Card Generator."""
import numpy as np
from scipy.spatial import cKDTree
from common import *
import cc
import defs as D
import atlas as AT

# ------------------------------------------------------------------ الرأس المرجعي (لكل جنس: البنية المتوسطة)
BIND_TRI = BODY_Q[:, [0, 1, 2, 0, 2, 3]].reshape(-1, 3)          # مثلثات الربط العالمية (فهرس uint16)
HWB = bone_weight(r'^(head|jaw|neck03|levator|oculi|orbicularis|oris|risorius|temporalis|special0[13456]|eye\.|tongue)')
def sv_scalar(x):
    """قيمة لكل رأس أصلي ⇒ لكل رأس مقسّم (نفس القواعد الخطية)."""
    x = np.asarray(x, np.float64)
    return cc.subdivide(np.repeat(x[:, None], 3, 1))[:, 0]

_x, _y, _z = BASE_V[:, 0], BASE_V[:, 1], BASE_V[:, 2]; _ax = np.abs(_x)
def scalp_density(sex):
    """كثافة الشعر لكل رأس أصلي (0..1) — منبت أمامي/صدغان/سوالف/خلف الأذن/القفا (إحداثيات الجسم الخام dm)."""
    y_front = (7.80 if sex == 'female' else 7.83) - smoothstep(.08, .6, _ax) * (.32 if sex == 'female' else .42)
    ear = (_ax > .6) & (_y < 7.55) & (_y > 6.8) & (_z > -.25) & (_z < .85)
    line = np.where(_z > .62, y_front, np.where(_z > .1, 7.14 + (_z - .1) * .55, 6.88 + smoothstep(-.6, .1, _z) * .26))
    m = (HWB > .4) & ~ear
    return np.clip(smoothstep(line - .02, line + .12, _y) * m, 0, 1)

def cap_mask(sex):
    """«غطاء الفروة» (حلاقة قصيرة جداً + الشعر القصير تحت كل تسريحة): منبت طبيعي نظيف لكل جنس بلا قطع صلبة.
       بخلاف scalp_density (التي تحدد جذور البطاقات): لا حدّ وزن عظمة الرأس (كان يقطع القذال بخط مسنّن)، والأذن قطع
       ناقص ناعم حول الأذن نفسها بهامش ~8مم (كان صندوقاً يترك جلداً عارياً 1.5سم فوقها وخلفها)، + سالفان أمام الأذن،
       + تموّج خفيف حتمي بالمنبت (±2.5مم) ⇒ لا خط مسطرة. وحدات الجسم الخام (dm): y للأعلى، z للأمام، x جانبي."""
    f = sex == 'female'
    y_front = (7.80 if f else 7.83) - smoothstep(.08, .6, _ax) * (.32 if f else .42)
    side = smoothstep(.5, .62, _ax)                                                   # جانب الرأس فقط
    # الخلف: القفا 6.88 بالوسط ⇒ ~6.94 بالجانبين؛ خلف الأذن ينزل المنبت لمستوى شحمة الأذن (الأذن نفسها قطع ناقص أدناه)؛
    # الوسط الأمامي السفلي (تحت الذقن/الحلق) يبقى بالخط الأصلي المرتفع ⇒ لا تغطية خارج الفروة.
    back = 6.88 + smoothstep(.2, .6, _ax) * .06
    mid = 7.14 + (_z - .1) * .55
    lat = np.minimum(mid, 6.94 + smoothstep(.55, .62, _z) * (mid - 6.94))
    line = np.where(_z > .62, y_front, np.where(_z > .1, mid + (lat - mid) * smoothstep(.42, .55, _ax), back))
    burn = side * smoothstep(.5, .6, _z) * (1 - smoothstep(.72, .8, _z))              # السالف أمام الأذن
    line = np.minimum(line, np.where(burn > 0, line - burn * (line - (7.2 if f else 7.08)), line))
    rng = np.random.default_rng(731 + f)
    wob = np.sin(_x * 23 + rng.uniform(0, 6)) * np.cos(_z * 19 + rng.uniform(0, 6)) * .5 + rng.uniform(-.5, .5, len(_x))
    line = line + wob * .025 * (.4 + .6 * smoothstep(-.3, .3, _z))                  # تموّج أخف بالقفا
    m = smoothstep(line - .01, line + .07, _y)
    e = ((_y - 7.13) / .33) ** 2 + ((_z - .44) / .24) ** 2                            # الأذن + هامش
    m *= 1 - (1 - smoothstep(1.0, 1.4, e)) * side
    m *= (_y > 6.6) & IS_BODY
    return np.clip(m, 0, 1)

class Head:
    def __init__(self, sex):
        self.sex = sex
        P = dict(D.builds(sex))['avg'] * DM
        self.P = P; self.S = cc.subdivide(P); self.N = cc.normals(self.S, cc.SQ)
        hb = joint('head', 'head', P); ht = joint('head', 'tail', P)
        self.C = hb + (ht - hb) * .45; self.top = ht[1]
        self.dens = scalp_density(sex); self.dsv = sv_scalar(self.dens)
        hsv = sv_scalar(HWB)
        sv_all = np.arange(cc.NSV); body_sv = np.zeros(cc.NSV, bool); body_sv[np.unique(cc.SQ)] = True
        self.y_neck = joint('neck01', 'head', P)[1]; self.y_chest = joint('spine03', 'head', P)[1]
        arm = sv_scalar(bone_weight(r'^(upperarm|lowerarm|wrist|finger|metacarpal)')) > .3
        sel = body_sv & (self.S[:, 1] > self.y_chest - .12) & ~arm
        self.sp = self.S[sel]; self.sn = self.N[sel]; self.shead = hsv[sel] > .35
        self.kd = cKDTree(self.sp)
        # المثلثات الأصلية (لربط القطع): الجذع العلوي + الرقبة + الرأس، بلا الذراعين
        tri = BIND_TRI
        armb = bone_weight(r'^(upperarm|lowerarm|wrist|finger|metacarpal|clavicle|shoulder)') > .5
        keep = ~armb[tri].any(1) & (self.S[tri, 1].mean(1) > self.y_chest - .15)
        self.tid = np.nonzero(keep)[0]; self.tri = tri[keep]; self.tc = self.S[self.tri].mean(1); self.tkd = cKDTree(self.tc)
        self.vid = np.unique(self.tri); self.vkd = cKDTree(self.S[self.vid])
        self.eye = (BASE_V[[v for v, g in VGROUP.items() if g == 'helper-l-eye']].mean(0)) * DM
        self.kds = cKDTree(self.S)
        self.rng = np.random.default_rng(730 + (sex == 'female'))

    # ---- جذور على الفروة
    def roots(self, n, dens_fn=None, seed=0, dsv=None):
        rng = np.random.default_rng(seed)
        Q = cc.SQ; d = (self.dsv if dsv is None else dsv)[Q].mean(1)
        if dens_fn is not None:
            c = self.S[Q].mean(1); d = d * dens_fn(c)
        ok = d > .03; Qs = Q[ok]; ds = d[ok]
        A = np.linalg.norm(np.cross(self.S[Qs[:, 2]] - self.S[Qs[:, 0]], self.S[Qs[:, 3]] - self.S[Qs[:, 1]]), axis=1) / 2
        w = A * ds; w /= w.sum()
        m = n * 3; qi = rng.choice(len(Qs), m, p=w); u, v = rng.random(m), rng.random(m)
        a, b, c_, e = (self.S[Qs[qi, k]] for k in range(4))
        p = (a * (1 - u)[:, None] + b * u[:, None]) * (1 - v)[:, None] + (e * (1 - u)[:, None] + c_ * u[:, None]) * v[:, None]
        na, nb, nc, ne = (self.N[Qs[qi, k]] for k in range(4))
        nn = (na * (1 - u)[:, None] + nb * u[:, None]) * (1 - v)[:, None] + (ne * (1 - u)[:, None] + nc * u[:, None]) * v[:, None]
        nn /= np.linalg.norm(nn, axis=1, keepdims=True)
        # تخفيف Poisson (أقل مسافة تقريبية)
        r = np.sqrt((A * ds).sum() / n) * .62; keep = []; grid = {}
        for i in range(m):
            k = tuple(np.floor(p[i] / r).astype(int)); bad = False
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for dz in (-1, 0, 1):
                        for j in grid.get((k[0] + dx, k[1] + dy, k[2] + dz), ()):
                            if np.sum((p[j] - p[i]) ** 2) < r * r: bad = True; break
                        if bad: break
                    if bad: break
                if bad: break
            if not bad: keep.append(i); grid.setdefault(k, []).append(i)
            if len(keep) >= n: break
        keep = np.array(keep); return p[keep], nn[keep]

    # ---- أقرب سطح (موضع/عمودي/هل هو الرأس)
    def surf(self, p):
        _, i = self.kd.query(p); return self.sp[i], self.sn[i], self.shead[i]

    # ---- نمو الخصل الدليلية (متجهياً)
    def grow(self, p0, n0, L, K, field, vol, lift=.3, grav=0.0, s_lift=.025, clear=.004, cap_len=None, tie=None, gcap=0.0):
        """p0,n0: (N,3) · L: (N,) أطوال · field(p, n, s) ⇒ اتجاه مرغوب (N,3) · vol: ارتفاع الحجم (N,) فوق الفروة."""
        N = len(p0); ds = L / K; P = np.zeros((N, K + 1, 3)); P[:, 0] = p0 + n0 * .0004
        d = field(p0, n0, np.zeros(N)); d = d - n0 * (d * n0).sum(1, keepdims=True); d = d / np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
        d = d * np.cos(lift)[:, None] if np.ndim(lift) else d * np.cos(lift); d = d + n0 * np.sin(lift)[:, None] if np.ndim(lift) else d + n0 * np.sin(lift)
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        s = np.zeros(N); p = P[:, 0].copy(); onc = np.ones(N, bool)
        for k in range(1, K + 1):
            s = s + ds
            p = p + d * ds[:, None]
            sp, sn, sh = self.surf(p); h = ((p - sp) * sn).sum(1)
            cap = sh & (p[:, 1] > self.y_neck + .03)
            ht = .0006 + (vol - .0006) * smoothstep(0, s_lift, s)
            under = sn[:, 1] < -.18
            pull = cap & onc & ~(under & (grav > 0))
            fix = np.where(pull, ht - h, np.maximum(np.minimum(clear, ht) - h, 0))
            p = p + sn * fix[:, None]
            onc = onc & pull if cap_len is None else onc & (s < cap_len)
            cap = pull
            des = field(p, sn, s)
            des = np.where(cap[:, None], des - sn * (des * sn).sum(1, keepdims=True), des)
            g = (np.where(cap, gcap * smoothstep(.02, .12, s), grav))[:, None]
            dn = np.zeros_like(p); dn[:, 1] = -1; dn[:, 2] = np.where(cap, 0, np.sign(p[:, 2] - (self.C[2] - .015)) * .3 * smoothstep(.03, .1, self.y_neck + .05 - p[:, 1]))
            des = des * (1 - g) + dn * g   # خارج الفروة: جاذبية + انقسام أمام/خلف الكتف (لا «أجنحة» أفقية)
            des /= np.maximum(np.linalg.norm(des, axis=1, keepdims=True), 1e-9)
            nd = p - P[:, k - 1]; nd /= np.maximum(np.linalg.norm(nd, axis=1, keepdims=True), 1e-9)
            d = nd * .62 + des * .38; d /= np.linalg.norm(d, axis=1, keepdims=True)
            if tie is not None:   # نقطة ربط (ذيل/كعكة): انجذاب نحوها، والخصلة تنتهي عندها
                tv = tie - p; td = np.linalg.norm(tv, axis=1); pull = smoothstep(.0, .08, s)[:, None] * .5
                d = d * (1 - pull) + tv / np.maximum(td[:, None], 1e-6) * pull; d /= np.linalg.norm(d, axis=1, keepdims=True)
                near = td < .012; p = np.where(near[:, None], tie + (p - tie) * .5, p)
            P[:, k] = p
        return P

    # ---- تموّج/تجعّد بعد النمو (إزاحة عمودية على الخصلة تزداد من الجذر)
    def wave(self, P, amp, freq, curl=False, seed=0):
        rng = np.random.default_rng(seed); N, K1, _ = P.shape
        t = np.gradient(P, axis=1); t /= np.maximum(np.linalg.norm(t, axis=2, keepdims=True), 1e-9)
        o = P - self.C; o /= np.linalg.norm(o, axis=2, keepdims=True)
        sd = np.cross(t, o); sd /= np.maximum(np.linalg.norm(sd, axis=2, keepdims=True), 1e-9); up = np.cross(sd, t)
        seg = np.linalg.norm(np.diff(P, axis=1), axis=2); s = np.concatenate([np.zeros((N, 1)), np.cumsum(seg, 1)], 1)
        ph = rng.uniform(0, 6.28, (N, 1)); a = amp * smoothstep(.01, .06, s)
        w = s * freq * 6.283 + ph
        off = sd * (np.sin(w) * a)[..., None] + (up * (np.cos(w) * a)[..., None] if curl else 0)
        return P + off

    # ---- البطاقات + الربط
    def cards(self, P, width, cellname, depth, seed=0, taper=.5, twist=.3, ufrac=(.55, 1.0), vlen=(.8, 1.0)):
        rng = np.random.default_rng(seed); N, K1, _ = P.shape; K = K1 - 1
        t = np.gradient(P, axis=1); t /= np.maximum(np.linalg.norm(t, axis=2, keepdims=True), 1e-9)
        sp, sn, sh = self.surf(P.reshape(-1, 3)); sn = sn.reshape(N, K1, 3)
        rad = P - self.C; rad /= np.linalg.norm(rad, axis=2, keepdims=True)
        o = sn * .7 + rad * .3; o /= np.linalg.norm(o, axis=2, keepdims=True)
        sd = np.cross(t, o); sd /= np.maximum(np.linalg.norm(sd, axis=2, keepdims=True), 1e-9)
        tw = rng.uniform(-twist, twist, (N, 1, 1)); oo = np.cross(sd, t)
        sd = sd * np.cos(tw) + oo * np.sin(tw)
        kk = np.arange(K1) / K
        w = width[:, None] * (1 - taper * kk[None] ** 1.4) * (.75 + .25 * smoothstep(0, .15, kk))[None]
        L = P - sd * w[..., None] / 2; R = P + sd * w[..., None] / 2
        V = np.stack([L, R], 2).reshape(N, K1 * 2, 3)
        u0, u1 = AT.cell(cellname); cw = u1 - u0
        f = rng.uniform(*ufrac, N); us = u0 + rng.uniform(0, 1, N) * cw * (1 - f); ue = us + cw * f
        vl = rng.uniform(*vlen, N)
        uv = np.zeros((N, K1 * 2, 2)); uv[:, 0::2, 0] = us[:, None]; uv[:, 1::2, 0] = ue[:, None]
        vv = 1 - kk[None] * vl[:, None] * .985 - .005; uv[:, 0::2, 1] = vv; uv[:, 1::2, 1] = vv
        tri = []
        for k in range(K):
            a, b, c, d = 2 * k, 2 * k + 1, 2 * k + 3, 2 * k + 2; tri += [(a, b, c), (a, c, d)]
        tri = np.array(tri)
        hr = np.repeat(kk, 2)[None].repeat(N, 0)
        hd = np.clip(depth[:, None] + (1 - kk[None]) * .18, 0, 1).repeat(2, 1)
        hc = rng.random(N)[:, None].repeat(K1 * 2, 1)
        tdir = np.ones((N, K1 * 2), np.int8); tdir[:, -2:] = -1
        nin = np.repeat(o, 2, axis=1)
        return dict(V=V.reshape(-1, 3), uv=uv.reshape(-1, 2), tri=(tri[None] + (np.arange(N) * K1 * 2)[:, None, None]).reshape(-1, 3),
                    hr=hr.reshape(-1), hd=hd.reshape(-1), hc=hc.reshape(-1), tdir=tdir.reshape(-1), nin=nin.reshape(-1, 3))

    def bind(self, V):
        """أقرب مثلث أصلي (على الرأس المرجعي المنعَّم) ⇒ (refs, w, off بالـdm)."""
        Bv = self.S[:NV]; _, ci = self.tkd.query(V, k=8)
        best = np.full(len(V), np.inf); R = np.zeros((len(V), 3), np.int64); Wt = np.zeros((len(V), 3)); TI = np.zeros(len(V), np.int64)
        for j in range(ci.shape[1]):
            t = self.tri[ci[:, j]]; a, b, c = Bv[t[:, 0]], Bv[t[:, 1]], Bv[t[:, 2]]
            n = np.cross(b - a, c - a); n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
            q = V - n * ((V - a) * n).sum(1, keepdims=True)
            v0, v1, v2 = b - a, c - a, q - a
            d00 = (v0 * v0).sum(1); d01 = (v0 * v1).sum(1); d11 = (v1 * v1).sum(1); d20 = (v2 * v0).sum(1); d21 = (v2 * v1).sum(1)
            den = d00 * d11 - d01 * d01; den[den == 0] = 1e-12
            bv = (d11 * d20 - d01 * d21) / den; bw = (d00 * d21 - d01 * d20) / den; bu = 1 - bv - bw
            W3 = np.clip(np.stack([bu, bv, bw], 1), 0, 1); W3 /= np.maximum(W3.sum(1, keepdims=True), 1e-9)
            pp = a * W3[:, :1] + b * W3[:, 1:2] + c * W3[:, 2:3]; dist = np.linalg.norm(V - pp, axis=1)
            m = dist < best; best[m] = dist[m]; R[m] = t[m]; Wt[m] = W3[m]; TI[m] = self.tid[ci[m, j]]
        off = V - (Bv[R[:, 0]] * Wt[:, :1] + Bv[R[:, 1]] * Wt[:, 1:2] + Bv[R[:, 2]] * Wt[:, 2:3])
        return TI, Wt, off

    def scale_refs(self):
        """أزواج القياس (من شعر MakeHuman): عرض/ارتفاع/عمق الرأس ⇒ المسافة بالمتر على الرأس المرجعي (النسبة وقت العرض)."""
        return [[a, b, float(abs(self.S[a, k] - self.S[b, k]))] for k, (a, b) in enumerate(((5399, 11998), (791, 881), (962, 5320)))]


# ------------------------------------------------------------------ حقول التمشيط (متجهة؛ p بالمتر)
def unit(v): return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-9)
def F_const(v):
    v = np.array(v, float); return lambda p, n, s: np.broadcast_to(v, p.shape).copy()
def F_part(H, px, back=.25, down=.15, fwd=0.0, sweep=.9):
    """فرق عند x=px (بإحداثيات الرأس): الشعر يبتعد عن الفرق ثم ينزل/للخلف؛ قرب الجبهة يُمسح للخلف/الجانب (لا يسقط على الوجه)."""
    def f(p, n, s):
        r = p - H.C; x = r[:, 0] - px; sx = np.sign(x + 1e-6)
        away = np.stack([sx, np.zeros_like(x), np.zeros_like(x)], 1)
        side_w = np.clip(np.abs(x) / .06, .45, 1)[:, None]
        fr = smoothstep(.02, .08, r[:, 2])[:, None] * sweep
        sd = smoothstep(.045, .075, np.abs(r[:, 0]))[:, None] * smoothstep(.07, .02, r[:, 1])[:, None]   # الجانبان (تحت خط الفرق): ينزل الشعر للأسفل/الخلف لا للخارج
        return unit(away * side_w * (1 - .8 * sd) + np.array([0, -down, -back + fwd]) + np.array([0, -1.1, -.5]) * sd + np.array([0, 0, -1.0]) * fr)
    return f
def F_back(H, down=.1): return lambda p, n, s: unit(np.broadcast_to(np.array([0, -down, -1.0]), p.shape) + np.array([0, 0, 0]))
def F_whorl(H, crown, swirl=.6, down=.35):
    def f(p, n, s):
        r = p - crown; r = r - n * (r * n).sum(1, keepdims=True); rr = unit(r)
        sw = np.cross(n, rr)
        return unit(rr * (1 - swirl) + sw * swirl + np.array([0, -down, 0]))
    return f
def F_radial(H, up=.15): return lambda p, n, s: unit(n + np.array([0, up, 0]))
def F_mix(*fw):
    def f(p, n, s):
        out = np.zeros_like(p)
        for fn, w in fw: out += fn(p, n, s) * (w(p) if callable(w) else w)[..., None] if callable(w) else fn(p, n, s) * w
        return unit(out)
    return f

# ------------------------------------------------------------------ أدوات الطول/المناطق (بالنسبة لمركز الرأس)
def zone(H, p):
    """top: أعلى الرأس (0..1) · front · back · side."""
    r = p - H.C
    top = smoothstep(.02, .085, r[:, 1]); front = smoothstep(.0, .07, r[:, 2]); back = smoothstep(.0, .07, -r[:, 2]); side = smoothstep(.04, .075, np.abs(r[:, 0]))
    return top, front, back, side

# ------------------------------------------------------------------ تعريف تسريحة = طبقات
def style_layers(H, sid):
    """يرجع قائمة طبقات: dict(p0,n0,L,K,field,vol,lift,grav,width,cell,depth,wave,curl,tie,...)"""
    sex = H.sex; C = H.C; out = []
    def layer(n, Lf, K, field, vol, cell, depth, width, seed, dens=None, lift=.25, grav=0.0, wave=None, curl=None, tie=None, cap_len=None, twist=.15, taper=.5, clear=.004, s_lift=.025, gcap=0.0):
        p0, n0 = H.roots(n, dens, seed)
        if tie is None:   # أقصى حافة المنبت (كثافة < 0.22) بلا بطاقات: طبقة الفروة المرسومة تتولاها (لا «شرطات» داكنة على الصدغ/السالف)
            keep = H.dsv[H.kds.query(p0)[1]] >= .22; p0, n0 = p0[keep], n0[keep]
        L = Lf(p0) if callable(Lf) else np.full(len(p0), Lf)
        vv = vol(p0) if callable(vol) else np.full(len(p0), vol)
        ll = lift(p0) if callable(lift) else lift
        out.append(dict(p0=p0, n0=n0, L=L, K=K, field=field, vol=vv, lift=ll, grav=grav, cell=cell, depth=np.full(len(p0), depth), width=width, seed=seed,
                        wave=wave, curl=curl, tie=tie, cap_len=cap_len, twist=twist, taper=taper, clear=clear, s_lift=s_lift, gcap=gcap))
    crown = C + np.array([0, .075, -.065])
    T = lambda p: zone(H, p)
    if sid == 'crew':
        Lf = lambda p: .006 + .009 * T(p)[0]
        f = F_mix((F_whorl(H, crown, .25, .2), 1.0), (F_const([0, .2, .6]), .5))
        layer(3200, Lf, 4, f, .002, 'short', .6, (.006, .009), 11, lift=.45, s_lift=.004, taper=.25)
        layer(2400, Lf, 4, f, .0035, 'short', .2, (.005, .008), 12, lift=.55, s_lift=.004, taper=.3)
    elif sid == 'fade':
        Lf = lambda p: .004 + .045 * T(p)[0]
        dens = lambda c: .35 + .65 * smoothstep(.035, .07, (c - C)[:, 1])
        f = F_mix((F_const([0, .35, .55]), 1.0), (F_whorl(H, crown, .3, .1), .5))
        layer(2200, Lf, 6, f, lambda p: .003 + .012 * T(p)[0], 'medium', .5, (.005, .009), 21, dens=dens, lift=.55, s_lift=.012)
        layer(1300, Lf, 6, f, lambda p: .004 + .018 * T(p)[0], 'sparse', .1, (.004, .008), 22, dens=lambda c: smoothstep(.04, .07, (c - C)[:, 1]), lift=.6, s_lift=.012)
    elif sid in ('side_part', 'classic'):
        px = .032
        Lf = lambda p: (.022 + .045 * T(p)[0] + .012 * T(p)[1]) * (1 - .45 * T(p)[3] * (1 - T(p)[0]))
        f = F_part(H, px, back=.45, down=.25)
        layer(3000, Lf, 7, f, lambda p: .003 + .009 * T(p)[0], 'dense', .6, (.006, .01), 31, lift=.3)
        layer(2100, Lf, 7, f, lambda p: .005 + .013 * T(p)[0], 'dense', .15, (.0055, .009), 32, lift=.35, twist=.2)
    elif sid == 'slick_back':
        Lf = lambda p: .03 + .06 * T(p)[0]
        f = F_mix((F_back(H, .15), 1.0), (F_const([0, -.4, 0]), lambda p: T(p)[3]))
        layer(2800, Lf, 9, f, lambda p: .003 + .009 * T(p)[0], 'dense', .5, (.0055, .009), 41, lift=.2)
        layer(1800, Lf, 9, f, lambda p: .005 + .012 * T(p)[0], 'dense', .12, (.005, .0085), 42, lift=.25)
    elif sid == 'quiff':
        Lf = lambda p: .012 + .07 * T(p)[0] * (.6 + .4 * T(p)[1])
        f = F_mix((F_back(H, .0), 1.0), (F_const([0, .9, .1]), lambda p: T(p)[1] * T(p)[0] * 1.6))
        layer(2000, Lf, 9, f, lambda p: .003 + .03 * T(p)[0] * T(p)[1] + .006 * T(p)[0], 'medium', .5, (.006, .011), 51, lift=lambda p: .4 + .6 * T(p)[1])
        layer(1300, Lf, 9, f, lambda p: .005 + .035 * T(p)[0] * T(p)[1] + .008 * T(p)[0], 'dense', .12, (.006, .01), 52, lift=lambda p: .5 + .6 * T(p)[1])
    elif sid == 'crop':
        Lf = lambda p: .01 + .035 * T(p)[0]
        f = F_mix((F_const([0, -.35, 1.0]), lambda p: .3 + T(p)[0]), (F_whorl(H, crown, .3, .3), .5))
        layer(2200, Lf, 6, f, lambda p: .003 + .009 * T(p)[0], 'medium', .5, (.005, .009), 61, lift=.35, s_lift=.012)
        layer(1400, Lf, 6, f, lambda p: .005 + .012 * T(p)[0], 'sparse', .1, (.004, .008), 62, lift=.45, s_lift=.012)
    elif sid == 'curly_top':
        Lf = lambda p: .008 + .04 * T(p)[0]
        f = F_mix((F_radial(H, .3), .8), (F_whorl(H, crown, .4, .2), .4))
        layer(2000, Lf, 9, f, lambda p: .004 + .02 * T(p)[0], 'curly', .5, (.006, .01), 71, lift=.8, curl=(.005, 32), s_lift=.01)
        layer(1300, Lf, 9, f, lambda p: .006 + .026 * T(p)[0], 'curly', .12, (.006, .01), 72, lift=.9, curl=(.006, 28), s_lift=.01)
    elif sid in ('medium_wavy', 'curtains'):
        mid = sid == 'curtains'
        Lf = (lambda p: .1 + .02 * T(p)[0]) if not mid else (lambda p: .085 + .03 * T(p)[0])
        f = F_part(H, 0.0, back=.15, down=.7, fwd=.15 if mid else 0)
        layer(1600, Lf, 14, f, lambda p: .005 + .01 * T(p)[0], 'wavy' if not mid else 'medium', .55, (.008, .014), 81, lift=.3, grav=.6, wave=(.006, 9) if not mid else (.003, 6))
        layer(1100, Lf, 14, f, lambda p: .008 + .013 * T(p)[0], 'wavy' if not mid else 'dense', .12, (.008, .013), 82, lift=.35, grav=.6, wave=(.007, 8) if not mid else (.003, 6))
    elif sid == 'afro':
        Lf = lambda p: .045 + .02 * T(p)[0]
        f = F_radial(H, .25)
        layer(2400, Lf, 9, f, lambda p: .03 + .02 * T(p)[0], 'curly', .55, (.009, .015), 91, lift=1.2, curl=(.008, 26), s_lift=.03, clear=.01)
        layer(1600, Lf, 9, f, lambda p: .04 + .025 * T(p)[0], 'curly', .12, (.009, .014), 92, lift=1.25, curl=(.009, 22), s_lift=.03, clear=.012)
    elif sid in ('long_straight', 'long_wavy', 'long_curly', 'shoulder', 'lob', 'bob', 'bangs'):
        Lmap = {'long_straight': .42, 'long_wavy': .4, 'long_curly': .34, 'shoulder': .24, 'lob': .27, 'bob': .17, 'bangs': .4}
        Lm = Lmap[sid]; px = .03 if sid in ('long_wavy', 'bob') else 0.0
        Lf = lambda p: Lm * (.92 + .08 * T(p)[0]) - .06 * T(p)[1] * (Lm > .2)
        f = F_part(H, px, back=.12, down=.85, sweep=1.5 if sid == 'bob' else .9)
        cell = {'long_wavy': 'wavy', 'long_curly': 'curly'}.get(sid, 'dense')
        K = int(np.clip(Lm / .018, 10, 22))
        wv = {'long_wavy': (.012, 4.5), 'long_curly': None}.get(sid, (.002, 3))
        cu = {'long_curly': (.012, 9)}.get(sid)
        vol0 = .012 if sid != 'long_curly' else .025
        dens = None
        if sid == 'bangs': dens = lambda c: 1 - .0 * c[:, 0]
        layer(1700, Lf, K, f, lambda p: .004 + vol0 * T(p)[0], cell, .6, (.014, .022), 101, lift=.2, grav=.9, gcap=.3, wave=wv, curl=cu)
        layer(1200, Lf, K, f, lambda p: .007 + vol0 * 1.3 * T(p)[0], cell, .15, (.013, .02), 102, lift=.25, grav=.9, gcap=.3, wave=wv, curl=cu, twist=.2)
        if sid == 'bangs':
            fr = lambda c: smoothstep(.04, .07, (c - C)[:, 2]) * smoothstep(-.06, -.03, -np.abs((c - C)[:, 0]))
            layer(500, .1, 8, F_const([0, -.2, 1.0]), .006, 'dense', .2, (.008, .012), 103, dens=fr, lift=.3, grav=.9)
    elif sid in ('ponytail', 'bun', 'top_knot', 'man_bun', 'braid', 'low_bun'):
        tie = {'ponytail': C + np.array([0, .065, -.085]), 'man_bun': C + np.array([0, .07, -.075]), 'bun': C + np.array([0, -.005, -.1]),
               'low_bun': C + np.array([0, -.03, -.09]), 'top_knot': C + np.array([0, .115, -.02]), 'braid': C + np.array([0, -.02, -.095])}[sid]
        sp, sn, _ = H.surf(tie[None]); tie = sp[0] + sn[0] * .006
        f = lambda p, n, s: unit(tie - p)
        Lf = lambda p: np.linalg.norm(p - tie, axis=1) * 1.25 + .01
        layer(2600, Lf, 10, f, .003, 'dense', .55, (.011, .017), 111, lift=.06, tie=tie, taper=.1)
        layer(1600, Lf, 10, f, .0045, 'dense', .15, (.01, .015), 112, lift=.08, tie=tie, taper=.1)
        out.append(dict(kind='tie', tie=tie, tn=sn[0], sid=sid))
    return out

def tail(H, tie, tn, sid, seed):
    """الجزء المربوط: ذيل حصان (يتدلى بالجاذبية) · كعكة (لفّات حول كرة) · ضفيرة (ثلاث حزم متداخلة)."""
    rng = np.random.default_rng(seed); parts = []
    if sid == 'ponytail':
        n = 1100; ang = rng.uniform(0, 6.283, n); rr = np.sqrt(rng.random(n)) * .013
        a = unit(np.cross(tn, [0, 1, 0])); b = unit(np.cross(tn, a))
        p0 = tie + (a[None] * np.cos(ang)[:, None] + b[None] * np.sin(ang)[:, None]) * rr[:, None]
        L = rng.uniform(.26, .34, n); K = 16; lat = rng.normal(0, 1, (n, 1)) * a[None] * .0022
        P = np.zeros((n, K + 1, 3)); P[:, 0] = p0; d = np.broadcast_to(unit(tn * .8 + np.array([0, .25, 0])), (n, 3)).copy(); p = p0.copy()
        for k in range(1, K + 1):
            p = p + d * (L / K)[:, None] + lat * (k < 6)
            sp, sn, _ = H.surf(p); h = ((p - sp) * sn).sum(1); p = p + sn * np.maximum(.01 - h, 0)[:, None]
            g = min(1.0, .25 + k * .22); d = unit(d * (1 - g * .5) + np.array([0, -1.0, -.12]) * g * .5)
            P[:, k] = p
        parts.append((P, 'dense', .35, (.0055, .0085), .5))
    elif sid in ('bun', 'top_knot', 'man_bun', 'low_bun'):
        R0 = {'bun': .034, 'top_knot': .036, 'man_bun': .026, 'low_bun': .032}[sid]
        cen = tie + tn * R0 * .85; n = 260; K = 16; P = np.zeros((n, K + 1, 3))
        a = unit(np.cross(tn, [0, 1, 0.001])); b = unit(np.cross(tn, a))
        for i in range(n):
            th0 = rng.uniform(0, 6.283); el0 = rng.uniform(-1.1, 1.1); turns = rng.uniform(.8, 1.3)
            for k in range(K + 1):
                t = k / K; th = th0 + t * 6.283 * turns; el = el0 * (1 - t) + rng.normal(0, .05)
                r = R0 * (.75 + .25 * np.cos(t * 3.14)) * rng.uniform(.92, 1.0)
                dirv = (a * np.cos(th) + b * np.sin(th)) * np.cos(el) + tn * np.sin(el) * .8
                P[i, k] = cen + dirv * r
        parts.append((P, 'dense', .3, (.008, .012), .4))
    elif sid == 'braid':
        K = 30; L = .33; n_per = 70; P_all = []
        down = np.array([0, -1, -.12]); down = unit(down); side = unit(np.cross(down, tn));
        for j in range(3):
            for i in range(n_per):
                P = np.zeros((K + 1, 3)); jit = rng.normal(0, .0035, 2)
                for k in range(K + 1):
                    t = k / K; s = t * L; ph = s / .045 * 3.14 + j * 2.094
                    w = .014 * (1 - .45 * t)
                    c = tie + down * s + tn * (.008 + .004 * np.sin(ph * 2))
                    P[k] = c + side * (np.sin(ph) * w + jit[0] * (1 - .5 * t)) + tn * (np.cos(ph) * w * .55 + jit[1] * (1 - .5 * t))
                P_all.append(P)
        parts.append((np.array(P_all), 'dense', .3, (.006, .009), .5))
        # طرف حر بعد الربطة
        n = 120; P = np.zeros((n, 7, 3))
        for i in range(n):
            st = tie + down * L
            for k in range(7): P[i, k] = st + down * k * .012 + rng.normal(0, .004, 3) * (k / 6)
        parts.append((P, 'medium', .2, (.005, .008), .5))
    return parts

# ------------------------------------------------------------------ قوائم التسريحات (الاسم المعروض في الواجهة)
BUZZ = {'crew': .85, 'fade': .8, 'crop': .65, 'pixie': .6, 'curly_top': .6, 'side_part': .5, 'slick_back': .55, 'quiff': .5, 'afro': .5, 'ponytail': .6, 'bun': .6, 'top_knot': .6, 'braid': .6, 'man_bun': .6}
MALE = ['crew', 'fade', 'crop', 'side_part', 'slick_back', 'quiff', 'curly_top', 'curtains', 'medium_wavy', 'afro', 'man_bun', 'shoulder']
FEMALE = ['long_straight', 'long_wavy', 'long_curly', 'bangs', 'lob', 'bob', 'ponytail', 'bun', 'top_knot', 'braid', 'afro', 'pixie']

def pack_strands(PK, meta, H, pid, kind, groups, smooth, log, alphaTest=.38, single=False):
    """groups: [(P (N,K1,3), cell, depth(N,), width(N,), seed, twist)] ⇒ «strands2» مضغوط جداً:
       • مواضع العمود الفقري بإحداثيات الرأس المرجعي (البنية المتوسطة لجنس المؤلف) بوحدة 0.1مم، ترميز تفاضلي من الدرجة الثانية لكل بطاقة
         (المنحنى الناعم ⇒ أعداد صغيرة تُضغط جيداً).
       • لكل نقطة أقرب رأس جسم (تفاضلي) — وقت العرض: الموضع = رأس_الآن + (الموضع_المرجعي − رأس_المرجع) × مقياس الرأس.
       • لكل بطاقة 3 بايت: الخلية، العرض (0.1مم)، العمق؛ القيم العشوائية (بداية/عرض U، طول V، التفاف، تنوّع اللون) من مولّد بذرة ثابت وقت العرض."""
    pts, cnt, card, tws = [], [], [], []
    for P, cell, depth, width, seed, twist in groups:
        if P.shape[1] > 6:
            idx = sorted(set(list(range(0, P.shape[1], 2)) + [P.shape[1] - 1])); P = P[:, idx]
        N, K1, _ = P.shape
        pts.append(P.reshape(-1, 3)); cnt.append(np.full(N, K1)); tws.append(np.full(N, twist))
        card.append(np.stack([np.full(N, AT.CELLS.index(cell)), np.clip(width * 1e4, 1, 255), np.clip(depth, 0, 1) * 255], 1))
    V = np.concatenate(pts); cn = np.concatenate(cnt); st = np.concatenate([[0], np.cumsum(cn)[:-1]])
    _, ri = H.vkd.query(V); ref = H.vid[ri]
    q = np.round(V / 2.5e-4).astype(np.int64); first = np.zeros(len(V), bool); first[st] = True
    second = np.zeros(len(V), bool); second[st + 1] = True
    d1 = q.copy(); d1[~first] = q[~first] - q[np.nonzero(~first)[0] - 1]
    d2 = d1.copy(); m2 = ~first & ~second; d2[m2] = d1[m2] - d1[np.nonzero(m2)[0] - 1]
    dr = ref.astype(np.int64).copy(); dr[~first] = ref[~first] - ref[np.nonzero(~first)[0] - 1]
    assert np.abs(d2).max() < 32767 and np.abs(dr).max() < 32767
    cd = np.concatenate(card); tw = np.concatenate(tws)
    p = {'kind': kind, 'id': pid, 'fmt': 'strands2', 'auth': H.sex, 'nc': int(len(cn)), 'np': int(len(V)), 'smooth': smooth, 'tex': meta['tex']['hairAtlas'],
         'alphaTest': alphaTest, 'single': 1 if single else 0, 'unit': 2.5e-4, 'twist': float(np.round(tw.max(), 3)),
         'cnt': PK.arr(pid + '.cnt', cn.astype(np.uint8)), 'pos': PK.arr(pid + '.pos', d2.astype(np.int16)), 'ref': PK.arr(pid + '.ref', dr.astype(np.int16)),
         'card': PK.arr(pid + '.card', np.round(cd).clip(0, 255).astype(np.uint8))}
    meta['proxies'].append(p)
    log(kind, pid, 'cards', p['nc'], 'points', p['np'])
    return p

def make_style(PK, meta, H, sid, log):
    layers = style_layers(H, sid if sid != 'pixie' else 'crop')
    groups = []; tie = None
    for Ly in layers:
        if Ly.get('kind') == 'tie': tie = Ly; continue
        rng = np.random.default_rng(Ly['seed'] + 5)
        L = Ly['L'] * rng.uniform(.88, 1.1, len(Ly['L']))
        P = H.grow(Ly['p0'], Ly['n0'], L, Ly['K'], Ly['field'], Ly['vol'], lift=Ly['lift'], grav=Ly['grav'], s_lift=Ly['s_lift'], clear=Ly['clear'], tie=Ly['tie'], gcap=Ly['gcap'])
        if Ly['wave']: P = H.wave(P, Ly['wave'][0], Ly['wave'][1], False, Ly['seed'])
        if Ly['curl']: P = H.wave(P, Ly['curl'][0], Ly['curl'][1], True, Ly['seed'] + 1)
        w = rng.uniform(*Ly['width'], len(P))
        dr = H.dsv[H.kds.query(Ly['p0'])[1]]                      # كثافة المنبت عند الجذر: الحافة أرقّ وأكثر تفرقاً
        w = w * (.55 + .45 * smoothstep(.1, .8, dr))                      # الحافة: بطاقات أضيق (منبت أنعم) بنفس الخامة
        groups.append((P, Ly['cell'], Ly['depth'], w, Ly['seed'] + 7, Ly['twist']))
    if tie is not None:
        for j, (P, cell, dep, wr, tap) in enumerate(tail(H, tie['tie'], tie['tn'], tie['sid'], 900)):
            rng = np.random.default_rng(950 + j); w = rng.uniform(*wr, len(P))
            groups.append((P, cell, np.full(len(P), dep), w, 960 + j, .5))
    pid = 'hair_%s_%s' % (H.sex[0], sid)
    pack_strands(PK, meta, H, pid, 'hair', groups, 2, log)
    roots = np.concatenate([Ly['p0'] for Ly in layers if 'p0' in Ly])
    kd = cKDTree(roots); dd, _ = kd.query(H.S[:NV])
    m = np.clip(1 - (dd - .004) / .008, 0, 1) * (H.dens > .02)
    meta['masks']['scalp_' + pid] = PK.arr('mask.scalp.' + pid, u8(m))
    meta.setdefault('hairInfo', {})[pid] = {'buzz': BUZZ.get(sid, .35), 'scalp': .9}
    return pid

# ------------------------------------------------------------------ اللحية: أقنعة مناطق من معالم الهيكل (الفم/الذقن/الفك/الأذنين) على الجسم الخام
def beard_regions():
    hw = HWB; x, y, z = _x, _y, _z; ax = _ax
    mU = joint('oris05'); mL = joint('oris01'); chin = joint('special04')
    ss = smoothstep
    y_cheek = 6.86 + ss(.2, .62, ax) * .24
    lips = (ax < .2) & (y > mL[1] - .02) & (y < mU[1] + .03) & (z > 1.38)
    mous = (ax < .3) & (y > mU[1] - .01) & (y < mU[1] + .2) & (z > 1.3)
    allb = (hw > .3) & (y < y_cheek + .02) & (y > 5.9) & (z > .48) & ~lips & (ax < .72)
    allb |= mous & (hw > .3) & ~lips
    soft = (1 - ss(y_cheek - .1, y_cheek + .02, y)) * ss(5.88, 6.05, y) * ss(.46, .62, z)
    soft = np.where(mous, np.maximum(soft, 1 - ss(mU[1] + .12, mU[1] + .2, y)), soft)
    chin_zone = (ax < .34 + (chin[1] + .25 - y).clip(0) * .2) & (z > .9) & (y < mU[1] + .02)
    jaw = allb & ((y < chin[1] + .32 + (ax - .3).clip(0) * .5) | (ax > .45)) & ~mous
    R = {'full': allb * soft, 'goatee': (allb & (chin_zone | mous)) * soft * (1 - ss(.26, .36, ax) * (~mous)),
         'chin': (allb & chin_zone & ~mous) * soft * (1 - ss(.24, .34, ax)), 'mustache': (mous & ~lips).astype(float) * (1 - ss(.22, .3, ax)),
         'strap': jaw * soft * ss(.5, .62, z)}
    return {k: np.clip(np.asarray(v, float), 0, 1) for k, v in R.items()}

# id: (المنطقة، الطول (م) [الخدان، الذقن]، عدد البطاقات، تجعّد، ظل الجلد)
BEARDS = {
    'stubble': ('full', None, 0, None, .5), 'shadow': ('full', None, 0, None, .78),
    'short': ('full', (.004, .007), 6500, (.0005, 40), .62), 'medium': ('full', (.009, .018), 6500, (.0012, 30), .62),
    'full': ('full', (.016, .036), 7200, (.002, 22), .66), 'goatee': ('goatee', (.007, .013), 2800, (.0008, 34), .5),
    'mustache': ('mustache', (.007, .01), 1500, (.0005, 40), .4), 'chin': ('chin', (.008, .014), 1600, (.0008, 34), .45),
    'strap': ('strap', (.005, .008), 2800, (.0006, 40), .5), 'mstubble': ('mustache', (.006, .009), 1500, (.0005, 40), .6),
}
def make_beard(PK, meta, H, bid, reg, log):
    key, Lr, n, curl, tint = BEARDS[bid]
    dens = reg[key] if bid != 'mstubble' else np.maximum(reg[key], reg['full'] * .7)
    meta['masks']['beard_' + bid] = PK.arr('mask.beard.' + bid, u8(dens))
    meta.setdefault('beardInfo', {})[bid] = {'tint': tint, 'cards': 'beard_' + bid if n else None}
    if not n: return
    dsv = sv_scalar(reg[key])
    p0, n0 = H.roots(n, None, 500 + n, dsv=dsv)
    chin = joint('special04', 'head', H.P); mU = joint('oris05', 'head', H.P)
    t = smoothstep(chin[1] + .03, chin[1] - .01, p0[:, 1])
    L = (Lr[0] + (Lr[1] - Lr[0]) * t) * np.random.default_rng(n).uniform(.75, 1.15, len(p0))
    def field(p, nn, s):
        r = p - np.array([0, mU[1], H.C[2]])
        mous = (np.abs(r[:, 0]) < .03) & (p[:, 1] > mU[1] - .002) & (p[:, 1] < mU[1] + .02) & (p[:, 2] > H.C[2] + .08)
        d = np.zeros_like(p); d[:, 1] = -1; d[:, 2] = .25 * smoothstep(chin[1] + .03, chin[1] - .01, p[:, 1])
        d[:, 0] = np.where(mous, np.sign(r[:, 0]) * .7, 0)
        under = nn[:, 1] < -.3; d[:, 2] = np.where(under, -.6, d[:, 2])
        return unit(d)
    P = H.grow(p0, n0, L, 4, field, L * .22 + .0006, lift=.3, s_lift=.004, clear=.0009)
    if curl: P = H.wave(P, curl[0], curl[1], True, n)
    w = np.random.default_rng(n + 1).uniform(.0011, .0019, len(P))
    pack_strands(PK, meta, H, 'beard_' + bid, 'beard', [(P, 'fine', np.full(len(P), .3), w, n + 2, .3)], 1, log)

# ------------------------------------------------------------------ الحواجب: شعيرات حقيقية بكثافة أشكال MakeHuman الاثني عشر (ألفا الخامة ⇒ أين تنبت)
def make_brow(PK, meta, H, k, log):
    from PIL import Image
    name = 'eyebrow%03d' % k; folder = os.path.join(SYS, 'eyebrows', name)
    mh = read_mhclo(os.path.join(folder, name + '.mhclo')); V, VT, F, FT, G = read_obj(os.path.join(folder, mh['obj']))
    R = np.array(mh['refs']); S = H.S
    sc = np.array([abs(S[mh['scale'][a][0], j] - S[mh['scale'][a][1], j]) / mh['scale'][a][2] if a in mh['scale'] else .1 for j, a in enumerate('xyz')])
    Pv = S[R[:, 0].astype(int)] * R[:, 3:4] + S[R[:, 1].astype(int)] * R[:, 4:5] + S[R[:, 2].astype(int)] * R[:, 5:6] + R[:, 6:9] * sc
    A = np.asarray(Image.open(os.path.join(folder, name + '.png')).convert('RGBA'))[..., 3].astype(float) / 255; Hh, Ww = A.shape
    rng = np.random.default_rng(800 + k); pts = []
    for f, ft in zip(F, FT):
        for j in range(1, len(f) - 1):
            a, b, c = f[0], f[j], f[j + 1]; ta, tb, tc = ft[0], ft[j], ft[j + 1]
            area = np.linalg.norm(np.cross(Pv[b] - Pv[a], Pv[c] - Pv[a])) / 2; m = int(area * 5.6e6) + 1
            u, v = rng.random(m), rng.random(m); fl = u + v > 1; u[fl], v[fl] = 1 - u[fl], 1 - v[fl]
            p = Pv[a] + (Pv[b] - Pv[a]) * u[:, None] + (Pv[c] - Pv[a]) * v[:, None]
            t = VT[ta] + (VT[tb] - VT[ta]) * u[:, None] + (VT[tc] - VT[ta]) * v[:, None]
            al = A[np.clip(((1 - t[:, 1]) * Hh).astype(int), 0, Hh - 1), np.clip((t[:, 0] * Ww).astype(int), 0, Ww - 1)]
            keep = rng.random(m) < al ** 1.3 * .9; pts.append(p[keep])
    p0 = np.concatenate(pts)
    sp, sn, _ = H.surf(p0); p0 = sp + sn * .0003; n0 = sn
    xin = np.abs(p0[:, 0]); x0, x1 = np.percentile(xin, 3), np.percentile(xin, 97)
    t = np.clip((xin - x0) / max(x1 - x0, 1e-6), 0, 1)
    def field(p, nn, s):
        tt = np.clip((np.abs(p[:, 0]) - x0) / max(x1 - x0, 1e-6), 0, 1); d = np.zeros_like(p)
        d[:, 0] = np.sign(p[:, 0]) * (.25 + .75 * smoothstep(0, .3, tt)); d[:, 1] = .95 * (1 - smoothstep(0, .35, tt)) + .12 - .5 * smoothstep(.65, 1, tt)
        return unit(d)
    L = (.0055 + .003 * smoothstep(.1, .5, t) - .002 * smoothstep(.75, 1, t)) * rng.uniform(.8, 1.15, len(p0))
    P = H.grow(p0, n0, L, 3, field, np.full(len(p0), .0005), lift=.3, s_lift=.002, clear=.0004)
    w = rng.uniform(.00036, .00054, len(P))
    pack_strands(PK, meta, H, 'brow_%02d' % k, 'brows', [(P, 'brow', np.full(len(P), .2), w, 820 + k, .15)], 1, log, alphaTest=.02, single=True)

def build(PK, meta, log):
    meta['tex']['hairAtlas'] = PK.img('tex.hairAtlas', AT.draw(), 'webp', 92); meta['atlas'] = {'cells': len(AT.CELLS)}
    meta['bindTri'] = PK.arr('bind.tri', BIND_TRI.astype(np.uint16))
    meta['hair'] = {}
    for sex, lst in (('male', MALE), ('female', FEMALE)):
        H = Head(sex); meta['hair'][sex] = []
        meta['masks']['scalp_buzz_' + sex] = PK.arr('mask.scalp.buzz.' + sex, u8(cap_mask(sex)))   # غطاء الفروة: «حلاقة قصيرة جداً» + الشعر القصير تحت كل تسريحة
        for sid in lst:
            meta['hair'][sex].append(make_style(PK, meta, H, sid, log))
        if sex == 'male':
            reg = beard_regions(); meta['beards'] = list(BEARDS)
            for bid in BEARDS: make_beard(PK, meta, H, bid, reg, log)
            meta['brows'] = []
            for k in range(1, 13): make_brow(PK, meta, H, k, log); meta['brows'].append('brow_%02d' % k)
