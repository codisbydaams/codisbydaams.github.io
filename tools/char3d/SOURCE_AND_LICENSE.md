# أصول الشخصية ثلاثية الأبعاد — المصدر والترخيص

| البند | القيمة |
|---|---|
| الحزمة | **Universal Base Characters [Standard]** — Quaternius |
| الرابط | https://quaternius.itch.io/universal-base-characters · https://quaternius.com/packs/universalbasecharacters.html |
| الترخيص | **CC0 1.0 Universal (Public Domain Dedication)** — نص الترخيص الأصلي: `source/License_Standard.txt` |
| تاريخ التنزيل | 2026-11-18 (`Universal Base Characters[Standard].zip`، 128,968,391 بايت، النسخة المجانية) |
| ما استُعمل | `Superhero_Male_FullBody` · `Superhero_Female_FullBody` (glTF، هيكل UE بـ65 عظمة) + تسريحات «Origin at 0»: `Hair_SimpleParted` · `Hair_Buzzed` · `Hair_Long` · `Hair_Buns` · `Hair_BuzzedFemale` · `Hair_Beard` + خاماتها |

CC0 يسمح بالاستخدام والتعديل والتوزيع التجاري بلا شرط نسب؛ نذكر المصدر هنا للتوثيق فقط.

## ما تغيّر عن الأصل
- `build_assets.mjs`: حذف السمات غير المستعملة (TEXCOORD_1..4, COLOR_*)، تصغير الخامات إلى JPEG (`work/`، الجلد 2048، الخريطة العمودية 1024، الشعر 512)،
  حذف خامة الخشونة المحزومة (قيمة ثابتة)، دمج التسريحات في ملف واحد. **الهندسة والهيكل والأوزان كما هي.**
- وقت العرض (`tools/box3d/src/char.js`): وضعية الوقوف (دوران عظام الذراعين)، الوجوه = Morph Targets محسوبة من معاملات،
  الملابس = قناع مناطق تحليلي + إزاحة وتنعيم على الجسم نفسه، لون الشعر = لون المادة.

## إعادة البناء
```
cd tools/char3d && npm i        # @gltf-transform/core|functions|extensions 4.1.1
py -3 make_textures.py          # الخامات المصغّرة ← work/*.jpg
node build_assets.mjs           # ← dist/char_male.glb · char_female.glb · char_hair.glb
```

> المستودع على GitHub لا يضم `source/` الخام (53MB). نزّل الحزمة من الرابط أعلاه وضع ملفاتها في `tools/char3d/source/` (body/ و hair/ كما في build_assets.mjs) قبل إعادة البناء. الناتج المضمَّن `dist/*.glb` والخامات `work/*.jpg` موجودة بالمستودع.
