"""Contact sheet: py -3 sheet.py <out.png> <cols> <cellW> <img1> [img2...]  (label = filename)"""
import sys, os
from PIL import Image, ImageDraw
out, cols, cw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); fs = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in fs]
ch = int(cw * ims[0].height / ims[0].width); lab = 18
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * cw, rows * (ch + lab)), (245, 242, 236)); d = ImageDraw.Draw(S)
for i, (im, f) in enumerate(zip(ims, fs)):
    x, y = (i % cols) * cw, (i // cols) * (ch + lab)
    S.paste(im.resize((cw, ch), Image.LANCZOS), (x, y + lab)); d.text((x + 4, y + 3), os.path.splitext(os.path.basename(f))[0], fill=(40, 30, 20))
S.save(out); print(out, S.size)
