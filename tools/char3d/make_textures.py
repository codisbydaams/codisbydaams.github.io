"""CODIS-V71: خامات الشخصية المصغّرة (JPEG) من حزمة Quaternius الأصلية ← tools/char3d/work/*.jpg (يقرؤها build_assets.mjs).
   py -3 tools/char3d/make_textures.py"""
import os
from PIL import Image
H = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(H, 'work'), exist_ok=True)
J = [('source/body/T_Superhero_Male_Dark.png', 'm_base.jpg', 2048, 84), ('source/body/T_Superhero_Male_Normal.png', 'm_nrm.jpg', 1024, 88),
     ('source/body/T_Superhero_Female_Dark_BaseColor.png', 'f_base.jpg', 2048, 84), ('source/body/T_Superhero_Female_Normal.png', 'f_nrm.jpg', 1024, 88),
     ('source/hair/T_Hair_1_BaseColor.png', 'h1_base.jpg', 512, 86), ('source/hair/T_Hair_1_Normal.png', 'h1_nrm.jpg', 512, 88),
     ('source/hair/T_Hair_2_BaseColor.png', 'h2_base.jpg', 512, 86), ('source/hair/T_Hair_2_Normal.png', 'h2_nrm.jpg', 512, 88),
     ('source/body/T_Eye_Brown.png', 'eye.jpg', 128, 90)]
for s, d, n, q in J:
    out = os.path.join(H, 'work', d)
    Image.open(os.path.join(H, s)).convert('RGB').resize((n, n), Image.LANCZOS).save(out, quality=q, optimize=True)
    print(d, os.path.getsize(out) // 1024, 'KB')
