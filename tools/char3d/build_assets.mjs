/* CODIS-V71 — بناء أصول الشخصية ثلاثية الأبعاد من حزمة Quaternius «Universal Base Characters [Standard]» (CC0 1.0).
   المصدر: tools/char3d/source/* (كما نُزّلت من quaternius.itch.io، الترخيص: source/License_Standard.txt).
   الناتج: tools/char3d/dist/char_male.glb · char_female.glb · char_hair.glb (تُدفن داخل CODIS_FINAL.html بـ patch_v71.py).
   ما يفعله: يحذف السمات غير المستخدمة (TEXCOORD_1..4 / COLOR_*) ويستبدل الخامات بـ JPEG مصغّرة (work/ ← make_textures بالـPIL)
   ويحذف خامة الخشونة المحزومة (قيمة ثابتة بدلها). الهندسة والهيكل العظمي والأوزان كما هي حرفياً.
   تشغيل: (cd tools/char3d && npm i) ثم  py -3 tools/char3d/make_textures.py && node tools/char3d/build_assets.mjs */
import { NodeIO, VertexLayout } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import { readFileSync, statSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const src = p => join(here, 'source', p), work = p => join(here, 'work', p), out = p => join(here, 'dist', p);
mkdirSync(join(here, 'dist'), { recursive: true });
const io = new NodeIO().setVertexLayout(VertexLayout.SEPARATE);   /* سمات منفصلة: العارض يقرأ المصفوفات مباشرة */
const KEEP = new Set(['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0']);

function strip(doc) {
  for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives())
    for (const s of p.listSemantics()) if (!KEEP.has(s)) p.setAttribute(s, null);
}
function jpg(doc, tex, file) { tex.setImage(new Uint8Array(readFileSync(work(file)))).setMimeType('image/jpeg').setURI(''); }
function mat(doc, name, o) {
  const m = doc.getRoot().listMaterials().find(x => x.getName() === name); if (!m) throw new Error('material ' + name);
  if (o.base) jpg(doc, m.getBaseColorTexture(), o.base);
  if (o.normal) jpg(doc, m.getNormalTexture(), o.normal); else m.setNormalTexture(null);
  m.setMetallicRoughnessTexture(null).setMetallicFactor(0).setRoughnessFactor(o.rough).setOcclusionTexture(null).setEmissiveTexture(null);
  return m;
}
async function finish(doc, file) {
  for (const b of doc.getRoot().listBuffers().slice(1)) b.dispose();
  const buf = doc.getRoot().listBuffers()[0] || doc.createBuffer();
  for (const a of doc.getRoot().listAccessors()) a.setBuffer(buf);
  await doc.transform(prune(), dedup());
  await io.write(out(file), doc);
  console.log(file, (statSync(out(file)).size / 1024).toFixed(0) + 'KB');
}

/* الجسمان: الجسم + العينان + الحاجبان على هيكل واحد (65 عظمة، UE-style) */
for (const [g, base, nrm, body, brow] of [['male', 'm_base.jpg', 'm_nrm.jpg', 'MI_Superhero_Male', 'MI_Hair_1'], ['female', 'f_base.jpg', 'f_nrm.jpg', 'MI_Superhero_Female', 'MI_Hair_2']]) {
  const doc = await io.read(src(`body/Superhero_${g === 'male' ? 'Male' : 'Female'}_FullBody.gltf`));
  strip(doc);
  mat(doc, body, { base, normal: nrm, rough: 0.62 });
  mat(doc, 'MI_Eyes', { base: 'eye.jpg', rough: 0.18 });
  mat(doc, brow, { base: g === 'male' ? 'h1_base.jpg' : 'h2_base.jpg', rough: 0.7 });
  for (const t of doc.getRoot().listTextures()) if (!t.getMimeType() || t.getMimeType() === 'image/png') { /* اليتيمة تُحذف بـprune */ }
  await finish(doc, `char_${g}.glb`);
}

/* الشعر: كل التسريحات + اللحية في ملف واحد بخامتين مشتركتين (رمادية ⇒ تُلوَّن باللون المختار وقت العرض) */
{
  const files = ['Hair_SimpleParted', 'Hair_Buzzed', 'Hair_Long', 'Hair_Buns', 'Hair_BuzzedFemale', 'Hair_Beard'];
  const docs = await Promise.all(files.map(f => io.read(src('hair/' + f + '.gltf'))));
  const doc = docs[0];
  const { mergeDocuments } = await import('@gltf-transform/functions');
  for (const d of docs.slice(1)) mergeDocuments(doc, d);
  strip(doc);
  const scenes = doc.getRoot().listScenes(), main = scenes[0];
  for (const s of scenes.slice(1)) { for (const n of s.listChildren()) main.addChild(n); s.dispose(); }
  doc.getRoot().setDefaultScene(main);
  /* المادتان MI_Hair_1/MI_Hair_2 مكررتان بعد الدمج ⇒ أعطِ كل واحدة خامتها المصغّرة ثم dedup يوحّدها */
  for (const m of doc.getRoot().listMaterials()) {
    const two = m.getName() === 'MI_Hair_2';
    jpg(doc, m.getBaseColorTexture(), two ? 'h2_base.jpg' : 'h1_base.jpg');
    if (m.getNormalTexture()) jpg(doc, m.getNormalTexture(), two ? 'h2_nrm.jpg' : 'h1_nrm.jpg');
    m.setMetallicRoughnessTexture(null).setMetallicFactor(0).setRoughnessFactor(0.66);
  }
  for (const n of main.listChildren()) if (n.getMesh()) n.getMesh().setName(n.getName());
  await finish(doc, 'char_hair.glb');
}
