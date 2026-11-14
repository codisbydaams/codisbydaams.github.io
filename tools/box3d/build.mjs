/* CODIS-BOX3D build: يجمّع Three.js (الأجزاء المستخدمة فقط) + الكود في سكربت كلاسيكي واحد مصغّر → dist/b3d.min.js
   تشغيل: node tools/box3d/build.mjs   (يحتاج npm i داخل tools/box3d) */
import { build } from 'esbuild';
import { statSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, 'dist'), { recursive: true });
const out = join(here, 'dist', 'b3d.min.js');
await build({
  entryPoints: [join(here, 'src', 'index.js')], bundle: true, minify: true, format: 'iife', globalName: 'CodisB3D', target: ['es2019'],
  outfile: out, legalComments: 'none', treeShaking: true, charset: 'utf8',
  footer: { js: 'CodisB3D=CodisB3D.default;' },
});
console.log('b3d.min.js', (statSync(out).size / 1024).toFixed(0) + 'KB');
