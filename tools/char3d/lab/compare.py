"""Before (V72) / after (V73) comparison pages: py -3 compare.py <base dir> <after dir> <out dir>"""
import sys, os
from PIL import Image, ImageDraw
base, after, out = sys.argv[1:4]
def load(p):
    im = Image.open(p)
    if im.mode == 'RGBA':
        bg = Image.new('RGB', im.size, (236, 230, 220)); bg.paste(im, mask=im.split()[3]); return bg
    return im.convert('RGB')
def page(name, sex, cells, cw):
    rows = []
    for tag, d, col in (('V72 before', base, (110, 30, 30)), ('V73 after', after, (20, 90, 50))):
        ims = [load(os.path.join(d, sex + '_' + c + '.png')) for c in cells]
        ims = [im.resize((cw, int(cw * im.height / im.width)), Image.LANCZOS) for im in ims]
        rows.append((tag, col, ims))
    lab = 22; H = sum(lab + max(i.height for i in r[2]) for r in rows); W = cw * len(cells)
    S = Image.new('RGB', (W, H), (236, 230, 220)); d = ImageDraw.Draw(S); y = 0
    for tag, col, ims in rows:
        d.rectangle([0, y, W, y + lab], fill=(245, 242, 236))
        for k, (im, c) in enumerate(zip(ims, cells)):
            d.text((k * cw + 4, y + 5), tag + ' - ' + c, fill=col); S.paste(im, (k * cw, y + lab))
        y += lab + max(i.height for i in ims)
    S.save(os.path.join(out, name + '_' + sex + '.png')); print(name, sex, S.size)
for sex in ('male', 'female'):
    page('compare_body', sex, ['body_front', 'body_45', 'body_side', 'body_back'], 252)
    page('compare_face', sex, ['face_front', 'face_45', 'face_side'], 420)
    page('compare_detail', sex, ['eyes', 'hair_back'], 390)
