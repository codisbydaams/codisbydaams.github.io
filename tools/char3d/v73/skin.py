"""CODIS-V73 — خامات الجلد:
   • lut      : جدول التشتت المُدمج مسبقاً (Penner 2011) من ملف التشتت متعدد الغاوسيات (d'Eon & Luebke، GPU Gems 3 ف14)،
                التكامل على الدائرة كاملة (تصحيح Jon Moore لحدود −π/2..π/2). x = N·L×½+½ ، y = √(الانحناء/520م⁻¹).
   • region   : خريطة مناطق الجلد (خطية): R احمرار (خدّان/أنف/أذنان/مفاصل) · G خشونة (منطقة T أنعم، الشفتان أنعم، المرفقان أخشن)
                · B كثافة الشعر المرسوم على الفروة (حدود منبت طبيعية للحلاقة القصيرة) · A شدة اللمعان (التجاويف أقل).
   • detail   : خريطة عمودية دقيقة متكررة (مسام متعددة المقاييس + تشقق دقيق متقاطع).
   • stub     : نقش شعيرات متكرر (ظل اللحية/الحلاقة).
   • skins    : الألوان الأصلية (MakeHuman CC0) مع إزالة الشعر المرسوم على الفروة."""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
from common import *
from raster import raster

# ------------------------------------------------------------------ LUT
PROFILE = [(0.0064, (0.233, 0.455, 0.649)), (0.0484, (0.100, 0.336, 0.344)), (0.187, (0.118, 0.198, 0.0)),
           (0.567, (0.113, 0.007, 0.007)), (1.99, (0.358, 0.004, 0.0)), (7.41, (0.078, 0.0, 0.0))]
def profile(d):   # d بالمليمتر ⇒ (n,3)
    out = np.zeros(d.shape + (3,))
    for v, w in PROFILE: out += np.exp(-d[..., None] ** 2 / (2 * v)) / np.sqrt(2 * np.pi * v) * np.array(w)   # تطبيع أحادي البعد (التكامل على الحلقة)
    return out
def lut(W=256, H=64):
    img = np.zeros((H, W, 3))
    cos = np.linspace(-1, 1, W)
    th = np.arccos(cos)
    for j in range(H):
        y = j / (H - 1); k = (y * y) * 520.0
        if k < 1e-3: img[j] = np.clip(cos, 0, 1)[:, None]; continue
        r = 1000.0 / k                                         # mm
        amax = 2 * np.arcsin(min(1.0, 12.0 / (2 * r))) if r > 6 else np.pi
        a = np.linspace(-amax, amax, 721)
        R = profile(2 * r * np.abs(np.sin(a / 2)))            # (na,3)
        num = np.clip(np.cos(th[:, None] + a[None, :]), 0, None)[..., None] * R[None]   # (W,na,3)
        img[j] = np.trapezoid(num, a, axis=1) / np.trapezoid(R, a, axis=0)[None]
    return Image.fromarray(np.clip(np.round(img * 255), 0, 255).astype(np.uint8))

# ------------------------------------------------------------------ مناطق الوجه/الجسم (على الجسم المحايد الخام، dm)
V = BASE_V; x, y, z = V[:, 0], V[:, 1], V[:, 2]; ax = np.abs(x)
HW = bone_weight(r'^(head|jaw|neck03|levator|oculi|orbicularis|oris|risorius|temporalis|special0[13456]|eye\.|tongue)')
EYE = joint('eye.L'); MU = joint('oris05'); ML = joint('oris01'); CHIN = joint('special04')
def g3(c, s, sx=1, sy=1, sz=1):
    d2 = ((x - c[0]) / sx) ** 2 + ((y - c[1]) / sy) ** 2 + ((z - c[2]) / sz) ** 2; return np.exp(-d2 / (2 * s * s))
_nz = (HW > .5) & (ax < .12) & (y > MU[1] + .1) & (y < EYE[1] - .05); NOSE = V[np.nonzero(_nz)[0][np.argmax(z[_nz])]]
def face_pt(px, py):
    m = (HW > .5) & (np.abs(x - px) < .06) & (np.abs(y - py) < .06); i = np.nonzero(m)[0]; return V[i[np.argmax(z[i])]]
CHEEK = [face_pt(s * .42, EYE[1] - .45) for s in (1, -1)]
EAR = (HW > .4) & (ax > .6) & (y > EYE[1] - .62) & (y < EYE[1] + .25) & (z < .55) & (z > -.45)
LIPS = (HW > .5) & (((x / .27) ** 2 + ((y - (MU[1] + ML[1]) / 2) / .11) ** 2) < 1) & (z > MU[2] - .2)
def jw(pat): return bone_weight(pat)
HAND = jw(r'^(finger|metacarpal|wrist)'); FING = jw(r'^finger\d-3'); KNEE = g3(joint('lowerleg01.L'), .28, sz=.8) + g3(joint('lowerleg01.R'), .28, sz=.8)
ELB = g3(joint('lowerarm01.L'), .22) + g3(joint('lowerarm01.R'), .22)

def region_values():
    red = np.zeros(len(V)); rough = np.full(len(V), .56); spec = np.ones(len(V))
    face = HW > .5
    rough[face] = .48
    tz = face & (ax < .2) & (y > EYE[1] + .12)                                     # الجبهة الوسطى
    rough = np.where(tz, .45, rough)
    rough -= .1 * g3(NOSE, .14) * face                                              # الأنف أنعم (دهني)
    rough -= .04 * (g3(CHIN, .16) * face)
    rough = np.where(LIPS, .42, rough)
    rough += .06 * EAR + .08 * np.clip(ELB, 0, 1) + .08 * np.clip(KNEE, 0, 1)
    rough += .04 * (HW < .2) * (y > 4.0)                                            # الجذع/الذراعان أخشن قليلاً
    red += .45 * sum(g3(c, .18, sz=.7) for c in CHEEK) * face
    red += .5 * g3(NOSE, .1) * face + .25 * g3(NOSE, .2) * face
    red += .6 * EAR + .2 * g3(CHIN, .14) * face
    red += .45 * FING + .2 * HAND + .3 * np.clip(ELB, 0, 1) + .3 * np.clip(KNEE, 0, 1)
    lid = g3(EYE, .13, sz=1.5) + g3(EYE * [-1, 1, 1], .13, sz=1.5)
    red *= 1 - np.clip(lid, 0, 1) * .8                                              # الجفنان: لا احمرار إضافي
    spec[LIPS] = 1.0
    return np.clip(red, 0, 1), np.clip(rough, .25, .8), spec

def region(skin_ref, size=1024):
    """skin_ref: صورة الجلد الفاتح (لاستخراج كثافة الشعر المرسوم على الفروة)."""
    red, rough, spec = region_values()
    tri = BODY_Q[:, [0, 1, 2, 0, 2, 3]].reshape(-1, 3); trit = BODY_QT[:, [0, 1, 2, 0, 2, 3]].reshape(-1, 3)
    vals = np.stack([red, rough, spec], 1)
    img = raster(BASE_VT[trit], vals[tri], size)
    # كثافة شعر الفروة المرسوم: الأغمق من لون الجبهة النظيف داخل منطقة الرأس العليا فقط
    A = np.asarray(skin_ref.convert('RGB').resize((size, size), Image.LANCZOS)).astype(np.float64) / 255
    L = A.mean(2); scalpv = ((HW > .45) & (y > EYE[1] + .25) & ~EAR).astype(float)
    scalp = raster(BASE_VT[trit], scalpv[tri][..., None], size)[..., 0]
    fore = raster(BASE_VT[trit], (((HW > .8) & (z > 1.0) & (ax < .3) & (y > EYE[1] + .18) & (y < EYE[1] + .36)).astype(float))[tri][..., None], size)[..., 0] > .5
    Lf = np.median(L[fore]); dens = np.clip((Lf - gaussian_filter(L, 1.2)) / .16, 0, 1) * gaussian_filter(scalp, 3)
    dens = np.clip(gaussian_filter(dens, 2.5) * 1.35, 0, 1)
    # التجاويف: لمعان أقل حيث الخريطة اللونية أغمق من محيطها (طيات/مسام)
    cav = np.clip(1 - (gaussian_filter(L, 6) - L) * 5, .55, 1)
    out = np.dstack([img[..., 0], img[..., 1], dens, np.clip(img[..., 2] * cav, .5, 1)])
    return Image.fromarray(np.clip(np.round(out * 255), 0, 255).astype(np.uint8), 'RGBA'), dens

# ------------------------------------------------------------------ تفاصيل دقيقة
def detail(N=512, seed=73):
    rng = np.random.default_rng(seed)
    def tile_noise(scale, octaves=4, gain=.55):
        h = np.zeros((N, N))
        for o in range(octaves):
            f = scale * 2 ** o; G = np.fft.fft2(rng.standard_normal((f, f))); up = np.zeros((N, N), complex); k = f // 2
            up[:k, :k] = G[:k, :k]; up[:k, -k:] = G[:k, -k:]; up[-k:, :k] = G[-k:, :k]; up[-k:, -k:] = G[-k:, -k:]
            h += np.real(np.fft.ifft2(up)) * (gain ** o)
        return (h - h.mean()) / (h.std() + 1e-9)
    pores = np.zeros((N, N))
    for scale, cnt, rr, dep in ((1, 6500, (.7, 1.5), (.5, 1.0)), (1, 1400, (1.6, 2.6), (.4, .8))):
        for _ in range(cnt):
            px, py = rng.integers(0, N, 2); r = rng.uniform(*rr); R = int(np.ceil(r * 3))
            yy, xx = np.ogrid[-R:R + 1, -R:R + 1]; d = np.exp(-(xx * xx + yy * yy) / (2 * r * r))
            pores[(np.arange(py - R, py + R + 1) % N)[:, None], (np.arange(px - R, px + R + 1) % N)[None, :]] -= d * rng.uniform(*dep)
    # تشقق دقيق متقاطع (أخاديد رفيعة باتجاهين)
    cross = np.zeros((N, N))
    for ang in (.6, -.75, 1.9):
        u = np.cos(ang) * np.arange(N)[None, :] + np.sin(ang) * np.arange(N)[:, None]
        cross += np.abs(np.sin(u / N * np.pi * rng.integers(70, 95) + tile_noise(8, 2) * 1.6)) ** 6
    h = pores * .85 - cross * .22 + tile_noise(28, 4) * .3 + tile_noise(110, 2) * .2
    gy, gx = np.gradient(h); s = 1.5
    n = np.dstack([-gx * s, -gy * s, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    return Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8))

def stubble(N=512, seed=74):
    rng = np.random.default_rng(seed); R = np.zeros((N, N))
    for _ in range(14000):
        px, py = rng.integers(0, N, 2); L = rng.integers(2, 6); ang = rng.normal(1.57, .5); v = rng.uniform(.45, 1)
        for k in range(L):
            xx = int(round(px + np.cos(ang) * k)) % N; yy = int(round(py + np.sin(ang) * k)) % N
            R[yy, xx] = max(R[yy, xx], v * (1 - k * .12))
    R = np.clip(gaussian_filter(R, .55) * 1.6, 0, 1)
    return Image.fromarray((np.dstack([R, R, R]) * 255).astype(np.uint8))

# ------------------------------------------------------------------ ألوان الجلد (MakeHuman CC0) بلا الشعر المرسوم على الفروة
SKIN_SRC = {
    'male': [('light', 'young_caucasian_male/young_lightskinned_male_diffuse.png'), ('mid', 'young_asian_male/young_lightskinned_male_diffuse3.png'), ('dark', 'young_african_male/young_darkskinned_male_diffuse.png')],
    'female': [('light', 'young_caucasian_female/young_lightskinned_female_diffuse.png'), ('mid', 'young_asian_female/young_lightskinned_female_diffuse3.png'), ('dark', 'young_african_female/young_darkskinned_female_diffuse.png')],
}
def seam_match(A, tri, trit, S):
    """مطابقة لون جزيرة الرأس مع الجسم عند خط الدرز (الرأس/الرقبة): نسبة اللون بين جانبي الدرز لكل رأس درز ⇒ حقل تصحيح ناعم
       على رؤوس الرأس (تلاشٍ 3سم من الدرز) ⇒ راستر بفضاء UV ⇒ ضرب جزيرة الرأس فقط."""
    from scipy.spatial import cKDTree
    Ab = np.dstack([gaussian_filter(A[..., c], 4) for c in range(3)])
    def samp(uv): return Ab[np.clip(((1 - uv[:, 1]) * S).astype(int), 0, S - 1), np.clip((uv[:, 0] * S).astype(int), 0, S - 1)]
    head_uv = BASE_VT[:, 0] > .615                                   # جزيرة الرأس بتخطيط MakeHuman (يمين الخامة)
    vu = {}
    for q, qt in zip(BODY_Q, BODY_QT):
        for v, t in zip(q, qt): vu.setdefault(int(v), set()).add(int(t))
    sv, rh = [], []
    for v, ts in vu.items():
        h = [t for t in ts if head_uv[t]]; b = [t for t in ts if not head_uv[t]]
        mouth = np.linalg.norm(V[v] - (MU + ML) / 2) < .45
        if h and b and HW[v] > .2 and V[v, 1] < EYE[1] - .5 and not mouth:   # درز الرأس/الرقبة فقط (لا جزر الجفن/باطن الفم)
            ch = samp(BASE_VT[h]).mean(0); cb = samp(BASE_VT[b]).mean(0); sv.append(v); rh.append(np.clip(cb / np.maximum(ch, 1), .75, 1.33))
    if len(sv) < 10: return A
    sv = np.array(sv); rh = np.array(rh); kd = cKDTree(V[sv]); d, i = kd.query(V, k=6)
    w = 1 / np.maximum(d, 1e-3) ** 2; r = (rh[i] * w[..., None]).sum(1) / w.sum(1)[:, None]
    fall = (np.exp(-(d[:, 0] / .3) ** 2) * (V[:, 1] < EYE[1] - .2))[:, None]   # 3سم، ولا شيء فوق منتصف الأنف
    corr = 1 + (r - 1) * fall
    img = raster(BASE_VT[trit], corr[tri], S); img = np.where(img <= 1e-6, 1.0, img)   # خارج الجزر: بلا تغيير
    U = (np.arange(S) + .5) / S; mask = (U[None, :] > .615).astype(float)[..., None]
    return A * (1 + (img - 1) * mask)

SAT = {'male': {'light': .78, 'mid': .9, 'dark': .92}, 'female': {'light': .86, 'mid': .9, 'dark': .92}}
def skins(size=1536):
    tri = BODY_Q[:, [0, 1, 2, 0, 2, 3]].reshape(-1, 3); trit = BODY_QT[:, [0, 1, 2, 0, 2, 3]].reshape(-1, 3)
    scalp_line = EYE[1] + .38 + smoothstep(.1, .6, ax) * .18
    bald = ~EAR & (((HW > .45) & (y > scalp_line)) | ((HW > .2) & (z < .28) & (y > EYE[1] - .95)) | ((HW > .45) & (z < .5) & (y > EYE[1] - .1)))
    fore = (HW > .8) & (z > 1.0) & (ax < .3) & (y > EYE[1] + .18) & (y < EYE[1] + .34)
    out = {}
    for sex, lst in SKIN_SRC.items():
        out[sex] = []
        for k, f in lst:
            im = Image.open(os.path.join(SYS, 'skins', f)).convert('RGB'); S = im.size[0]
            A = np.asarray(im).astype(np.float64)
            M = np.clip(gaussian_filter(raster(BASE_VT[trit], bald.astype(float)[tri][..., None], S)[..., 0], S / 300) * 1.25, 0, 1)
            F = raster(BASE_VT[trit], fore.astype(float)[tri][..., None], S)[..., 0] > .5
            fc = np.median(A[F], 0); hf = A - np.dstack([gaussian_filter(A[..., c], 6) for c in range(3)])
            A = A * (1 - M[..., None]) + (fc[None, None, :] + hf * .35) * M[..., None]
            A = seam_match(A, tri, trit, S)                                                       # لا خط لوني عند حدّ جزيرة الرأس/الرقبة
            L = (A * [.2126, .7152, .0722]).sum(2, keepdims=True); A = L + (A - L) * SAT[sex][k]   # الأصول مشبعة (برتقالية) ⇒ تشبّع أهدأ
            out[sex].append((k, Image.fromarray(np.clip(A, 0, 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)))
    return out
