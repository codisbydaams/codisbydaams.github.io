// CODIS-V54 (boot): move the big pure-data statements (embedded base64 art, rigs, thumbs) out of the 11.6MB main <script>
// into their own small <script> elements placed right before it.
//
// Why: WebKit grows a <script>'s text node by re-copying it on every network chunk (cost ~ size²/chunk) and cannot paint
// while it does, so a cold load spent ~4.9s with a blank screen between "<script>" and the script's first statement
// (measured, real WebKit). Several small scripts cost ~Σ size² instead — and the parser can yield (paint) between them.
//
// Semantics are preserved and checked mechanically:
//  • only lines that are COMPLETE TOP-LEVEL statements are moved — proved with V8: the main-script prefix ending right before
//    the line must parse as a whole Script (=> not inside any block/function/object/template), and prefix+line must parse too;
//  • each moved group must evaluate in an EMPTY context (=> pure literals, no reference to anything else in the app);
//    the only allowed outside reference is a previously moved const (e.g. CODIS_SPECIAL_CARD_ART.teacher_gold = "…");
//  • top-level const/let in classic scripts share ONE global lexical scope, so the main script sees the same bindings;
//    they now exist earlier (no TDZ) — never later.
// Usage: node tools/boot_split.mjs <in.html> <out.html>
import fs from 'node:fs';
import vm from 'node:vm';
const [IN, OUT] = process.argv.slice(2);
const html = fs.readFileSync(IN, 'utf8');
const MARK = 'const CodisStorage = Object.freeze';
const at = html.indexOf(MARK); if (at < 0) throw new Error('main script marker not found');
const open = html.lastIndexOf('<script>', at); const bodyStart = open + '<script>'.length;
const close = html.indexOf('</script>', at);
if (html.slice(open, at).includes('</script>')) throw new Error('marker not inside the main script');
const main = html.slice(bodyStart, close);
const lines = main.split('\n');
const MIN = 60000;   // only statements bigger than this are worth a separate element
const parses = src => { try { new vm.Script(src); return true; } catch (e) { return false; } };
const candidates = [];
let off = 0; const offs = lines.map(l => { const o = off; off += l.length + 1; return o; });
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.length < MIN) continue;
  if (!/^(const [A-Z_][A-Z0-9_]* = |[A-Z_][A-Z0-9_]*\.[A-Za-z_][A-Za-z0-9_]* = )/.test(l)) continue;
  candidates.push(i);
}
const moved = []; const known = new Set();
for (const i of candidates) {
  const prefix = main.slice(0, offs[i]);
  const line = lines[i];
  if (!parses(prefix)) { console.log('skip (not top level) line', i + 1); continue; }
  if (!parses(prefix + line + '\n')) { console.log('skip (not a complete statement) line', i + 1); continue; }
  // purity: evaluate alone, with only the previously moved consts visible
  const ctx = vm.createContext({});
  try { new vm.Script(moved.map(m => m.line).join('\n') + '\n' + line).runInContext(ctx, { timeout:20000 }); }
  catch (e) { console.log('skip (not pure data: ' + e.message.slice(0, 60) + ') line', i + 1); continue; }
  const m = /^const ([A-Z_][A-Z0-9_]*) = /.exec(line) || /^([A-Z_][A-Z0-9_]*)\./.exec(line);
  if (!/^const /.test(line) && !known.has(m[1])) { console.log('skip (assigns to a non-moved binding) line', i + 1); continue; }
  known.add(m[1]);
  moved.push({ i, line, name:m[1] });
}
if (!moved.length) throw new Error('nothing to move');
const movedSet = new Set(moved.map(m => m.i));
// keep line numbers stable for diagnostics: the moved line becomes an empty line in the main script
const rest = lines.map((l, i) => movedSet.has(i) ? '/* CODIS-V54: ' + (/^const /.test(l) ? 'const ' + moved.find(m => m.i === i).name : moved.find(m => m.i === i).name + '.…') + ' → <script data-codis-data> قبل هذا السكربت */' : l).join('\n');
if (!parses(rest)) throw new Error('main script no longer parses');
// one element per statement (each text node stays small)
// each block also reports real parse progress to the splash bar: share of the document parsed so far (0 → .56); codisBoot continues from there
const total = open + moved.reduce((a, m) => a + m.line.length, 0) + main.length;
let acc = open;
const tags = moved.map(m => { acc += m.line.length; const f = Math.min(.56, .56 * acc / total).toFixed(3);
  return '<script data-codis-data="' + m.name + '">' + m.line + '\n;window.codisBootProgress&&window.codisBootProgress(' + f + ');</script>\n'; }).join('');
const out = html.slice(0, open) + '<!-- CODIS-V54: بيانات الصور المدفونة (نفس الملف) بعناصر صغيرة مستقلة: محلّل WebKit كان يعيد نسخ سكربت 11.6MB مع كل دفعة شبكة فلا يرسم شيئاً ~5ث -->\n' + tags + '<script>window.codisBootProgress&&window.codisBootProgress(.57);' + rest + html.slice(close);
fs.writeFileSync(OUT, out);
const sz = moved.reduce((a, m) => a + m.line.length, 0);
console.log('boot_split: moved', moved.length, 'statements,', (sz / 1e6).toFixed(2), 'M chars; main script', (main.length / 1e6).toFixed(2), '→', (rest.length / 1e6).toFixed(2), 'M chars');
console.log(moved.map(m => '  line ' + (m.i + 1) + ' ' + m.name + ' ' + m.line.length).join('\n'));
