"""CODIS-V73 — الملابس المولّدة من سطح الجسم: لكل قطعة «حقل قص» لكل رأس أصلي (سالب = داخل القطعة) + «إزاحة» (بعد القماش عن الجلد).
   العارض (char.js) يقسّم الحقل مع الجسم ثم يقصّ الرباعيات المقسّمة عند خط الصفر بدقة (حواف مستقيمة نظيفة عند الكم/الياقة/الحاشية)،
   ويضيف سماكة الحافة، ويزيح القماش على العمودي مع تنعيم يجسر التجاويف ⇒ ملابس تتبع كل بنية/منزلق بلا اختراق، وتُظهر شكل الجسم.
   الحقول من معالم الهيكل (الرقبة/الكتف/المرفق/الورك/الكاحل) على الجسم المحايد ⇒ صالحة للجنسين. وحدة الحقل 0.5مم (int16)، الإزاحة 0.25مم (uint8)."""
import numpy as np
from common import *

V = BASE_V * DM; x, y, z = V[:, 0], V[:, 1], V[:, 2]; ax = np.abs(x)
ss = smoothstep
ARM = bone_weight(r'^(upperarm|lowerarm|wrist|finger|metacarpal)')
LEG_LOW = bone_weight(r'^(foot|toe)')
def J(n, e='head'): return joint(n, e) * DM

def tee(scoop=False):
    nk = J('neck01'); sh = J('upperarm01.L'); el = J('lowerarm01.L')
    back = ss(.0, -.07, z - nk[2])
    y_nl = nk[1] - (.04 if scoop else .014) * (1 - back) + .02 * back + .012 * ss(.03, .075, ax)
    f_neck = np.where(ax < .13, y - y_nl, -1.0)
    d = (el - sh) / np.linalg.norm(el - sh); p = V.copy(); p[:, 0] = ax
    t = (p - sh) @ d
    f_slv = np.where(ARM > .3, t - (.085 if scoop else .1), -1.0)
    f_hem = (.025 if not scoop else .045) - y
    f = np.maximum.reduce([f_neck, f_slv, f_hem])
    f = np.where((ARM > .6) & (t > .14), np.maximum(f, .05), f)
    off = .0028 + .0032 * ss(.24, .06, y) * (ARM < .3) + .0018 * (ARM > .3)
    if scoop:   # الصدر: القماش يجسر ولا يلتصق (لا تظهر الحلمات)
        br = bone_weight(r'^breast'); off = off + .0045 * np.clip(br * 1.5, 0, 1) + .002 * ss(.1, .0, ax) * ss(.3, .36, y) * ss(.47, .4, y)
    return f, off

def pants(rise=.105, ankle=.06):
    ft = J('foot.L')
    f_w = y - rise
    f_a = (ft[1] + ankle) - y
    f = np.maximum.reduce([f_w, f_a, np.where(ARM > .4, .05, -1.0), np.where(LEG_LOW > .5, .03, -1.0)])
    off = .0024 + .0016 * ss(.0, -.25, y) * ss(-.62, -.4, y) + .003 * ss(.1, .0, ax) * ss(.06, -.04, y) * ss(-.12, -.04, y)
    return f, off

def nipple_relax():
    """الجلد تحت التيشيرت مخفي ⇒ يُسمح للقماش بالمرور «داخل» نتوء الحلمة (حتى 7مم، حول الهالة فقط) فيجسرها التنعيم
       بدل أن يلتصق بها ويُظهرها (كان يظهر نتوءان على صدر البنية العضلية). المنطقة = رؤوس هدف MakeHuman nipple-size."""
    i, _ = target('breast/nipple-size-decr'); r = np.zeros(len(V))
    for sg in (1, -1):
        sel = i[np.sign(V[i, 0]) == sg]
        if len(sel): r = np.maximum(r, .007 * (1 - ss(.012, .032, np.linalg.norm(V - V[sel].mean(0), axis=1))))
    return r

GARMENTS = [
    ('tee_m', 'top', tee(False), 9, '#5d6266', 110),
    ('pants_m', 'bottom', pants(.105), 8, '#2f343a', 120),
    ('tee_f', 'top', tee(True), 12, '#8a7f78', 110),
    ('pants_f', 'bottom', pants(.13), 8, '#2e3136', 120),
]

def knit(N=256, seed=75):
    """نسيج محبوك متكرر (خريطة عمودية خطية): أعمدة حلقات + ضجيج ألياف."""
    rng = np.random.default_rng(seed); yy, xx = np.mgrid[0:N, 0:N] / N
    h = .5 * np.abs(np.sin(xx * np.pi * 32)) ** .8 + .25 * np.sin(yy * np.pi * 64 + np.sin(xx * np.pi * 32) * 1.4) * .5
    G = np.fft.fft2(rng.standard_normal((N, N))); f = np.fft.fftfreq(N); fr = np.sqrt(f[None] ** 2 + f[:, None] ** 2)
    h += np.real(np.fft.ifft2(G * (fr > .08) * (fr < .3))) * .08
    gy, gx = np.gradient(h); s = 2.2
    n = np.dstack([-gx * s, -gy * s, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    from PIL import Image
    return Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8))

def build(PK, meta, log):
    meta['tex']['knit'] = PK.img('tex.knit', knit(), 'jpeg', 90)
    meta['garments'] = {}
    for gid, slot, (f, off), smooth, col, rep in GARMENTS:
        meta['proxies'].append({'kind': 'garment', 'id': gid, 'slot': slot, 'smooth': smooth, 'color': col, 'knitRep': rep, 'hideMargin': .012,
                                'field': PK.arr('gar.%s.f' % gid, np.clip(np.round(f / 5e-4), -32767, 32767).astype(np.int16)),
                                'off': PK.arr('gar.%s.o' % gid, np.clip(np.round(off / 2.5e-4), 0, 255).astype(np.uint8)),
                                **({'relax': PK.arr('gar.%s.r' % gid, np.clip(np.round(nipple_relax() / 2.5e-4), 0, 255).astype(np.uint8))} if slot == 'top' else {})})
        meta['garments'][gid] = slot
        log('garment', gid, 'inside verts', int((f < 0).sum()))
