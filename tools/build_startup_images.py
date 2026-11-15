"""CODIS-V54: صور إقلاع iOS (apple-touch-startup-image) مطابقة لخلفية #codis-startup بالمظهر الورقي.
iOS يعرض هذه الصورة الثابتة من لحظة الضغط على الأيقونة حتى أول رسم للصفحة (قبل أي JavaScript)، ثم تظهر شاشة البداية
الداخلية فوق الخلفية نفسها بكسلياً ⇒ لا قفزة لون. الصورة خلفية فقط (بلا شعار): الشعار يُرسم بحركته داخل الصفحة،
ولو وُضع بالصورة لظهر كاملاً ثم اختفى وأعاد رسم نفسه.
الخلفية = نفس طبقات CSS حرفياً:
  radial-gradient(60% 42% at 50% 42%, rgb(28 92 87 / .09), transparent 72%),
  radial-gradient(90% 60% at 50% 110%, rgb(166 120 40 / .035), transparent 70%), #E8DFCC
يكتب tools/identity/v54_startup.html (وسوم <link> بصور PNG مدفونة — الملف الواحد يبقى ملفاً واحداً).
  py -3 tools/build_startup_images.py [--preview مجلد]"""
import io, os, sys, base64
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
BG = np.array([0xE8, 0xDF, 0xCC], dtype=np.float64)
LAYERS = [  # من الأسفل إلى الأعلى (CSS: الأولى بالقائمة هي العليا)
    dict(rx=.90, ry=.60, cx=.50, cy=1.10, rgb=(166, 120, 40), a=.035, stop=.70),
    dict(rx=.60, ry=.42, cx=.50, cy=.42, rgb=(28, 92, 87), a=.09, stop=.72),
]
# (عرض CSS، ارتفاع CSS، نسبة البكسل) — أجهزة iPhone بوضع عمودي (التطبيق orientation: portrait)
DEVICES = [
    (320, 568, 2), (375, 667, 2), (414, 736, 3), (375, 812, 3), (414, 896, 2), (414, 896, 3), (390, 844, 3),
    (428, 926, 3), (393, 852, 3), (430, 932, 3), (402, 874, 3), (440, 956, 3), (420, 912, 3),
]
def render(w, h):
    y, x = np.mgrid[0:h, 0:w].astype(np.float64)
    x = (x + .5) / w; y = (y + .5) / h
    out = np.broadcast_to(BG, (h, w, 3)).copy()
    for L in LAYERS:
        # نصف قطر CSS بالنسبة المئوية: rx من العرض وry من الارتفاع؛ t = المسافة الإهليلجية (0 بالمركز، 1 عند الحافة)
        t = np.sqrt(((x - L['cx']) / L['rx']) ** 2 * (w * w) / (w * w) + ((y - L['cy']) / L['ry']) ** 2)
        a = L['a'] * np.clip(1 - t / L['stop'], 0, 1)   # تدرّج خطي مسبق الضرب: اللون ← شفاف
        out = out * (1 - a[..., None]) + np.array(L['rgb'], dtype=np.float64) * a[..., None]
    return Image.fromarray(np.clip(np.round(out), 0, 255).astype(np.uint8), 'RGB')
def png(img):
    # التدرّج خافت جداً (أقل من 256 لوناً فعلياً) ⇒ صورة بلوحة ألوان مبنية من الألوان نفسها: نفس البكسلات حرفياً بحجم صغير يُدفن بالصفحة
    a = np.asarray(img); flat = a.reshape(-1, 3)
    cols, idx = np.unique(flat, axis=0, return_inverse=True)
    assert len(cols) <= 256, len(cols)
    q = Image.fromarray(idx.reshape(a.shape[:2]).astype(np.uint8), 'P')
    q.putpalette(cols.astype(np.uint8).flatten().tolist())
    assert np.array_equal(np.asarray(q.convert('RGB')), a), 'palette must be lossless'
    b = io.BytesIO(); q.save(b, 'PNG', optimize=True); return b.getvalue()
prev = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
tags, total = [], 0
for w, h, d in DEVICES:
    img = render(w * d, h * d)
    data = png(img); total += len(data)
    if prev: os.makedirs(prev, exist_ok=True); open(os.path.join(prev, '%dx%d@%d.png' % (w, h, d)), 'wb').write(data)
    mq = '(device-width: %dpx) and (device-height: %dpx) and (-webkit-device-pixel-ratio: %d) and (orientation: portrait)' % (w, h, d)
    tags.append('<link rel="apple-touch-startup-image" media="%s" href="data:image/png;base64,%s">' % (mq, base64.b64encode(data).decode()))
out = os.path.join(HERE, 'identity', 'v54_startup.html')
open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(tags) + '\n')
print('startup images:', len(tags), 'total PNG bytes', total, '->', out)
