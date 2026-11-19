"""CODIS-V73 — تعريفات الجسم: البنيات (6 لكل جنس) ومكتبة الأهداف المتفرقة (الوجه + الجسم) والأهداف المشتقة.
   كل بنية = أوزان «ماكرو» MakeHuman الأصلية (عضل/وزن/تناسب/صدر) + أهداف تشريحية أصلية (bodyshapes/measure/torso…) بأوزان معتدلة.
   لا تكبير/تصغير عام: كل فرق شكلي من أهداف صمّمها فنانو MakeHuman (CC0)."""
import numpy as np
from common import *

def _lr(n, w): return {'armslegs/%s-%s' % (s, n): w for s in 'lr'}
BUILDS = {
    'male': [
        ('slim',  dict(muscle=.38, weight=.06, prop=.62), {'measure/measure-waist-circ-decr': .2, 'torso/torso-scale-depth-decr': .15}),
        ('avg',   dict(muscle=.5, weight=.42, prop=.62), {}),
        ('athl',  dict(muscle=.8, weight=.4, prop=.85), dict({'torso/torso-vshape-incr': .35, 'torso/torso-muscle-pectoral-incr': .25, 'measure/measure-waist-circ-decr': .25,
                                                             'stomach/stomach-pregnant-decr': .35}, **_lr('upperarm-shoulder-muscle-incr', .3), **_lr('upperarm-muscle-incr', .2))),
        ('musc',  dict(muscle=1., weight=.58, prop=1.), dict({'torso/torso-vshape-incr': .6, 'torso/torso-muscle-pectoral-incr': .55, 'torso/torso-muscle-dorsi-incr': .45, 'neck/neck-scale-horiz-incr': .3,
                                                             'stomach/stomach-pregnant-decr': .4, 'measure/measure-waist-circ-decr': .15},
                                                            **_lr('upperarm-shoulder-muscle-incr', .55), **_lr('upperarm-muscle-incr', .5), **_lr('lowerarm-muscle-incr', .35),
                                                            **_lr('upperleg-muscle-incr', .4), **_lr('lowerleg-muscle-incr', .35))),
        ('broad', dict(muscle=.7, weight=.7, prop=.45), dict({'torso/torso-scale-horiz-incr': .3, 'torso/torso-scale-depth-incr': .2, 'measure/measure-shoulder-dist-incr': .35,
                                                             'neck/neck-scale-horiz-incr': .35, 'hip/hip-scale-horiz-incr': .12, 'bodyshapes/bodyshapes-elvs-man-rectangle': .35},
                                                            **_lr('upperarm-fat-incr', .2), **_lr('upperleg-fat-incr', .15))),
        ('heavy', dict(muscle=.45, weight=1., prop=.4), dict({'stomach/stomach-pregnant-incr': .4, 'bodyshapes/bodyshapes-elvs-man-apple': .35, 'neck/neck-double-incr': .3,
                                                             'measure/measure-waist-circ-incr': .2}, **_lr('upperarm-fat-incr', .35), **_lr('upperleg-fat-incr', .35))),
    ],
    'female': [
        ('slim',  dict(muscle=.38, weight=.06, prop=.65, cup=.35), {'measure/measure-waist-circ-decr': .15}),
        ('avg',   dict(muscle=.5, weight=.42, prop=.65, cup=.5), {}),
        ('athl',  dict(muscle=.8, weight=.38, prop=.9, cup=.42, firm=.8), dict({'stomach/stomach-pregnant-decr': .35, 'measure/measure-waist-circ-decr': .2, 'buttocks/buttocks-volume-incr': .15},
                                                                               **_lr('upperleg-muscle-incr', .3), **_lr('lowerleg-muscle-incr', .3), **_lr('upperarm-shoulder-muscle-incr', .2))),
        ('curvy', dict(muscle=.5, weight=.6, prop=.65, cup=.72), {'bodyshapes/bodyshapes-elvs-fem-full-hourglass': .7, 'measure/measure-waist-circ-decr': .25,
                                                                   'hip/hip-scale-horiz-incr': .2, 'buttocks/buttocks-volume-incr': .4}),
        ('full',  dict(muscle=.45, weight=1., prop=.45, cup=.8), {'stomach/stomach-pregnant-incr': .25, 'bodyshapes/bodyshapes-elvs-fem-apple': .25, 'neck/neck-double-incr': .2}),
        ('broad', dict(muscle=.7, weight=.6, prop=.5, cup=.5), dict({'measure/measure-shoulder-dist-incr': .4, 'torso/torso-scale-horiz-incr': .25, 'bodyshapes/bodyshapes-elvs-fem-rectangle': .45,
                                                                    'measure/measure-waist-circ-incr': .15}, **_lr('upperarm-shoulder-muscle-incr', .2))),
    ],
}
SEXG = {'male': 1.0, 'female': 0.0}

def builds(sex):
    out = []
    for bid, mac, det in BUILDS[sex]:
        P = macro(SEXG[sex], **mac)
        for rel, w in det.items(): add(P, rel, w)
        # الجلد تحت التيشيرت مخفي دائماً (الزي ثابت) ⇒ تسطيح الحلمة بأهداف MakeHuman نفسها كي يتدلّى القماش ناعماً
        # فوق الصدر كما يحدث مع حمّالة الصدر (كان التيشيرت المطابق يُظهر نتوء الحلمة)
        add(P, 'breast/nipple-point-decr', 1); add(P, 'breast/nipple-size-decr', .6)
        out.append((bid, P))
    return out

# ------------------------------------------------------------------ مكتبة الأهداف المتفرقة (وقت العرض: مجموع موزون)
SPARSE = []
def S(rel): assert exists(rel), rel; SPARSE.append(rel)
for n in ['head/head-oval', 'head/head-round', 'head/head-rectangular', 'head/head-square', 'head/head-triangular', 'head/head-invertedtriangular', 'head/head-diamond',
          'head/head-fat-decr', 'head/head-fat-incr', 'head/head-scale-horiz-decr', 'head/head-scale-horiz-incr', 'head/head-scale-vert-decr', 'head/head-scale-vert-incr',
          'head/head-scale-depth-decr', 'head/head-scale-depth-incr', 'head/head-back-scale-depth-decr', 'head/head-back-scale-depth-incr', 'head/head-age-decr', 'head/head-age-incr',
          'head/head-angle-in', 'head/head-angle-out', 'head/head-trans-down', 'head/head-trans-up', 'head/head-trans-forward', 'head/head-trans-backward',
          'forehead/forehead-scale-vert-decr', 'forehead/forehead-scale-vert-incr', 'forehead/forehead-trans-backward', 'forehead/forehead-trans-forward',
          'forehead/forehead-temple-decr', 'forehead/forehead-temple-incr', 'forehead/forehead-nubian-decr', 'forehead/forehead-nubian-incr',
          'eyebrows/eyebrows-trans-up', 'eyebrows/eyebrows-trans-down', 'eyebrows/eyebrows-angle-up', 'eyebrows/eyebrows-angle-down', 'eyebrows/eyebrows-trans-forward', 'eyebrows/eyebrows-trans-backward',
          'chin/chin-width-decr', 'chin/chin-width-incr', 'chin/chin-height-decr', 'chin/chin-height-incr', 'chin/chin-prominent-decr', 'chin/chin-prominent-incr',
          'chin/chin-bones-decr', 'chin/chin-bones-incr', 'chin/chin-jaw-drop-decr', 'chin/chin-jaw-drop-incr', 'chin/chin-cleft-incr', 'chin/chin-prognathism-decr', 'chin/chin-prognathism-incr', 'chin/chin-triangle',
          'nose/nose-scale-horiz-decr', 'nose/nose-scale-horiz-incr', 'nose/nose-scale-vert-decr', 'nose/nose-scale-vert-incr', 'nose/nose-scale-depth-decr', 'nose/nose-scale-depth-incr',
          'nose/nose-trans-up', 'nose/nose-trans-down', 'nose/nose-trans-forward', 'nose/nose-trans-backward', 'nose/nose-nostrils-width-decr', 'nose/nose-nostrils-width-incr',
          'nose/nose-point-width-decr', 'nose/nose-point-width-incr', 'nose/nose-point-up', 'nose/nose-point-down', 'nose/nose-hump-decr', 'nose/nose-hump-incr',
          'nose/nose-curve-concave', 'nose/nose-curve-convex', 'nose/nose-greek-incr', 'nose/nose-greek-decr', 'nose/nose-volume-decr', 'nose/nose-volume-incr',
          'nose/nose-flaring-decr', 'nose/nose-flaring-incr', 'nose/nose-width1-decr', 'nose/nose-width1-incr', 'nose/nose-width2-decr', 'nose/nose-width2-incr', 'nose/nose-width3-decr', 'nose/nose-width3-incr',
          'nose/nose-base-up', 'nose/nose-base-down', 'nose/nose-septumangle-decr', 'nose/nose-septumangle-incr', 'nose/nose-compression-compress', 'nose/nose-compression-uncompress',
          'nose/nose-nostrils-angle-up', 'nose/nose-nostrils-angle-down',
          'mouth/mouth-scale-horiz-decr', 'mouth/mouth-scale-horiz-incr', 'mouth/mouth-scale-vert-decr', 'mouth/mouth-scale-vert-incr', 'mouth/mouth-scale-depth-decr', 'mouth/mouth-scale-depth-incr',
          'mouth/mouth-upperlip-volume-decr', 'mouth/mouth-upperlip-volume-incr', 'mouth/mouth-lowerlip-volume-decr', 'mouth/mouth-lowerlip-volume-incr',
          'mouth/mouth-upperlip-height-decr', 'mouth/mouth-upperlip-height-incr', 'mouth/mouth-lowerlip-height-decr', 'mouth/mouth-lowerlip-height-incr',
          'mouth/mouth-upperlip-width-decr', 'mouth/mouth-upperlip-width-incr', 'mouth/mouth-lowerlip-width-decr', 'mouth/mouth-lowerlip-width-incr',
          'mouth/mouth-cupidsbow-decr', 'mouth/mouth-cupidsbow-incr', 'mouth/mouth-cupidsbow-width-decr', 'mouth/mouth-cupidsbow-width-incr',
          'mouth/mouth-angles-up', 'mouth/mouth-angles-down', 'mouth/mouth-trans-forward', 'mouth/mouth-trans-backward',
          'mouth/mouth-trans-up', 'mouth/mouth-trans-down', 'mouth/mouth-philtrum-volume-incr', 'mouth/mouth-philtrum-volume-decr', 'mouth/mouth-dimples-in', 'mouth/mouth-laugh-lines-in',
          'mouth/mouth-lowerlip-ext-up', 'mouth/mouth-lowerlip-ext-down', 'mouth/mouth-upperlip-ext-up', 'mouth/mouth-upperlip-ext-down', 'mouth/mouth-lowerlip-middle-up', 'mouth/mouth-lowerlip-middle-down',
          'neck/neck-scale-horiz-decr', 'neck/neck-scale-horiz-incr', 'neck/neck-scale-depth-decr', 'neck/neck-scale-depth-incr', 'neck/neck-double-incr', 'neck/neck-double-decr',
          'torso/torso-vshape-decr', 'torso/torso-vshape-incr', 'torso/torso-scale-horiz-decr', 'torso/torso-scale-horiz-incr', 'torso/torso-scale-depth-decr', 'torso/torso-scale-depth-incr',
          'torso/torso-muscle-pectoral-incr', 'torso/torso-muscle-pectoral-decr', 'torso/torso-muscle-dorsi-incr', 'torso/torso-muscle-dorsi-decr',
          'hip/hip-scale-horiz-decr', 'hip/hip-scale-horiz-incr', 'hip/hip-scale-depth-decr', 'hip/hip-scale-depth-incr', 'hip/hip-waist-up', 'hip/hip-waist-down',
          'stomach/stomach-pregnant-decr', 'stomach/stomach-pregnant-incr', 'stomach/stomach-navel-in', 'stomach/stomach-navel-out',
          'buttocks/buttocks-volume-decr', 'buttocks/buttocks-volume-incr',
          'breast/breast-dist-decr', 'breast/breast-dist-incr', 'breast/breast-point-decr', 'breast/breast-point-incr', 'breast/breast-trans-down', 'breast/breast-trans-up',
          'breast/breast-volume-vert-down', 'breast/breast-volume-vert-up',
          'armslegs/upperlegs-height-decr', 'armslegs/upperlegs-height-incr', 'armslegs/lowerlegs-height-decr', 'armslegs/lowerlegs-height-incr']:
    S(n)
for n in ['ankle-circ', 'bust-circ', 'calf-circ', 'frontchest-dist', 'hips-circ', 'knee-circ', 'lowerarm-length', 'lowerleg-height', 'napetowaist-dist', 'neck-circ', 'neck-height',
          'shoulder-dist', 'thigh-circ', 'underbust-circ', 'upperarm-circ', 'upperarm-length', 'upperleg-height', 'waist-circ', 'waisttohip-dist', 'wrist-circ']:
    S('measure/measure-%s-decr' % n); S('measure/measure-%s-incr' % n)
for side in 'lr':
    for n in ['eyes/%s-eye-scale-decr', 'eyes/%s-eye-scale-incr', 'eyes/%s-eye-trans-in', 'eyes/%s-eye-trans-out', 'eyes/%s-eye-trans-up', 'eyes/%s-eye-trans-down',
              'eyes/%s-eye-height1-decr', 'eyes/%s-eye-height1-incr', 'eyes/%s-eye-height2-decr', 'eyes/%s-eye-height2-incr', 'eyes/%s-eye-height3-decr', 'eyes/%s-eye-height3-incr',
              'eyes/%s-eye-push1-in', 'eyes/%s-eye-push1-out', 'eyes/%s-eye-push2-in', 'eyes/%s-eye-push2-out', 'eyes/%s-eye-corner1-up', 'eyes/%s-eye-corner1-down',
              'eyes/%s-eye-corner2-up', 'eyes/%s-eye-corner2-down', 'eyes/%s-eye-eyefold-down', 'eyes/%s-eye-eyefold-up', 'eyes/%s-eye-eyefold-angle-up', 'eyes/%s-eye-eyefold-angle-down',
              'eyes/%s-eye-epicanthus-in', 'eyes/%s-eye-epicanthus-out', 'eyes/%s-eye-bag-decr', 'eyes/%s-eye-bag-incr', 'eyes/%s-eye-move-in', 'eyes/%s-eye-move-out',
              'cheek/%s-cheek-bones-decr', 'cheek/%s-cheek-bones-incr', 'cheek/%s-cheek-volume-decr', 'cheek/%s-cheek-volume-incr', 'cheek/%s-cheek-inner-decr', 'cheek/%s-cheek-inner-incr',
              'cheek/%s-cheek-trans-up', 'cheek/%s-cheek-trans-down',
              'ears/%s-ear-scale-decr', 'ears/%s-ear-scale-incr', 'ears/%s-ear-wing-decr', 'ears/%s-ear-wing-incr', 'ears/%s-ear-lobe-decr', 'ears/%s-ear-lobe-incr',
              'ears/%s-ear-shape-pointed', 'ears/%s-ear-shape-round', 'ears/%s-ear-shape-square', 'ears/%s-ear-shape-triangle', 'ears/%s-ear-flap-decr', 'ears/%s-ear-flap-incr', 'ears/%s-ear-trans-up', 'ears/%s-ear-trans-down',
              'armslegs/%s-upperarm-fat-incr', 'armslegs/%s-upperarm-fat-decr', 'armslegs/%s-upperarm-muscle-incr', 'armslegs/%s-upperarm-muscle-decr',
              'armslegs/%s-upperarm-shoulder-muscle-incr', 'armslegs/%s-upperarm-shoulder-muscle-decr', 'armslegs/%s-lowerarm-fat-incr', 'armslegs/%s-lowerarm-fat-decr',
              'armslegs/%s-lowerarm-muscle-incr', 'armslegs/%s-lowerarm-muscle-decr',
              'armslegs/%s-upperleg-fat-incr', 'armslegs/%s-upperleg-fat-decr', 'armslegs/%s-upperleg-muscle-incr', 'armslegs/%s-upperleg-muscle-decr',
              'armslegs/%s-lowerleg-fat-incr', 'armslegs/%s-lowerleg-fat-decr', 'armslegs/%s-lowerleg-muscle-incr', 'armslegs/%s-lowerleg-muscle-decr',
              'armslegs/%s-hand-scale-decr', 'armslegs/%s-hand-scale-incr', 'armslegs/%s-foot-scale-decr', 'armslegs/%s-foot-scale-incr']:
        if exists(n % side): S(n % side)
        else: print('skip target', n % side)

def derived():
    """الطول (فرق كامل لكل جنس من البنية المتوسطة) + فروق وجه الأعراق (على الرأس فقط، بلا إزاحة صلبة) + حجم الرأس."""
    out = []
    for sex in ('male', 'female'):
        mac = dict(BUILDS[sex][1][1]); P0 = macro(1.0 if sex == 'male' else 0.0, **mac)
        for h, v in (('min', 0.0), ('max', 1.0)):
            out.append(('height-%s-%s' % (sex, h), macro(1.0 if sex == 'male' else 0.0, height=v, **mac) - P0))
    hw = bone_weight(r'^(head|jaw|neck03|levator|oculi|orbicularis|oris|risorius|temporalis|special0[13456]|eye\.|tongue)')
    fall = np.clip((hw - .35) / .45, 0, 1); fall = fall * fall * (3 - 2 * fall); core = hw > .95
    for sex in ('male', 'female'):
        T = {e: dense('macrodetails/%s-%s-young' % (e, sex)) for e in ETH}; mean = sum(T.values()) / 3
        for e in ETH:
            Dd = T[e] - mean; Dd = Dd - Dd[core].mean(0); out.append(('face-%s-%s' % (e, sex), Dd * fall[:, None]))
    # حجم الرأس النسبي: تكبير/تصغير حول مركز الرأس بتلاشٍ ناعم عند الرقبة (للمنزلق «حجم الرأس»)
    c = joint('head'); w = fall
    for nm, k in (('head-size-incr', .1), ('head-size-decr', -.1)):
        Dd = (BASE_V - c) * k * w[:, None]; out.append((nm, Dd))
    return out
