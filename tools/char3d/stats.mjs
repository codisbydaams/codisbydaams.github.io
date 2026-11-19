/* تقرير أصل: المجسمات/الرؤوس/المثلثات/العظام/المواد/الخامات/المورف/الحركات/الحجم */
import { NodeIO } from '@gltf-transform/core';
import { statSync } from 'fs';
const io = new NodeIO();
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f), r = doc.getRoot();
  let size = 0; try { size = statSync(f).size; if (f.endsWith('.gltf')) size += statSync(f.replace('.gltf', '.bin')).size; } catch (e) {}
  const out = { file: f.split(/[\/]/).pop(), kb: Math.round(size / 1024), meshes: [], skins: r.listSkins().map(s => s.listJoints().length), anims: r.listAnimations().map(a => a.getName()), mats: r.listMaterials().map(m => m.getName() + '[' + ['BaseColor', 'Normal', 'MetallicRoughness', 'Occlusion', 'Emissive'].filter(k => m['get' + k + 'Texture']()).join(',') + ']'), textures: r.listTextures().map(t => (t.getName() || t.getURI()) + ' ' + (t.getSize() || []).join('x')) };
  for (const n of r.listNodes()) { const m = n.getMesh(); if (!m) continue; for (const p of m.listPrimitives()) { const pos = p.getAttribute('POSITION'), idx = p.getIndices(); out.meshes.push({ node: n.getName(), verts: pos.getCount(), tris: (idx ? idx.getCount() : pos.getCount()) / 3, attrs: p.listSemantics().join(' '), morphs: p.listTargets().length, mat: p.getMaterial() && p.getMaterial().getName(), skin: !!n.getSkin() }); } }
  console.log(JSON.stringify(out));
}
