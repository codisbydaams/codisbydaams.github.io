/* CODIS-BOX3D — نقطة الدخول: واجهة CodisB3D (تُعرَّف كمتغير عام بعد تشغيل الحزمة) */
import { Stage, quality } from './stage.js';
import { buildBox, instantiate, Lib, TINT } from './models.js';
import { makeCard } from './card.js';
import { playSingle as _ps, sceneSeconds } from './single.js';
import { REG } from './runner.js';
import { playBulk as _pb, bulkSeconds } from './bulk.js';
import { create as charCreate } from './char.js';   /* CODIS-V71: عارض الشخصية — نفس نسخة Three */
const guard = fn => o => { const before = REG.last; try { return fn(o); } catch (e) { if (REG.last && REG.last !== before) { try { REG.last.abort(); } catch (x) {} } throw e; } };
const playSingle = guard(_ps), playBulk = guard(_pb);

function supported() {
  try {
    const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false; const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); return true;
  } catch (e) { return false; }
}

/* معاينة تطويرية: مجسّم واحد بزاوية فتح محددة (للاختبار البصري فقط) */
function preview(host, o) {
  const q = quality(o.low ? 'low' : 'hi'); q.preserve = true;
  const st = new Stage({ host, q, theme: o.theme || 'paper', w: o.w || host.clientWidth, h: o.h || host.clientHeight, hooks: {} });
  const lib = new Lib(q.texS), m = instantiate(buildBox(o.n || 1, lib));
  st.scene.add(m.root); m.root.position.y = -m.baseY; st.contact.scale.set(m.dims.w * 1.5, m.dims.d * 1.5, 1);
  m.lidPivot.rotation.x = -(o.open || 0) * Math.PI / 180;
  m.setSeam(o.seam || 0); m.setGems(o.gems == null ? 1 : o.gems); st.inner.position.set(0, m.dims.h * .7, 0); st.inner.intensity = o.light || 0;
  const cam = st.camera, c = o.cam || [3.2, 3.0, 5.4]; cam.position.set(c[0], c[1], c[2]); const lk = o.look || [0, m.dims.h * .55, 0]; cam.lookAt(lk[0], lk[1], lk[2]); cam.fov = o.fov || 34; cam.updateProjectionMatrix();
  st.key.target.position.set(0, 0, 0);
  st.tick(.016, 1); st.render();
  return { st, m, lib, dispose() { st.dispose(); lib.disposeAll(); } };
}

export default { supported, playSingle, playBulk, preview, TINT, sceneSeconds, bulkSeconds, version: '2', char: { create: charCreate, version: '2' } };
