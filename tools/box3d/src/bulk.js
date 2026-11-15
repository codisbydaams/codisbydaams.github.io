/* CODIS-BOX3D v2 — مشهد فتح ×10 (إخراج مستقل لا تكرار للصندوق الواحد).
   • الخانات = بطاقات شبكة النتائج الحقيقية (#econ-bulk-modal .bk-card) مرسومة تحت الطبقة وتُقاس مباشرة: كل بطاقة تهبط في خانة رقم صندوقها الأصلي
     بإسقاط عكسي دقيق ⇒ لا انحراف ولا نزول، والتسليم يكشف الشبكة بالبكسلات نفسها. إطارات الخانات تظهر في المشهد قبل امتلائها.
   • المسرح يُؤطَّر داخل المساحة فوق الشبكة (setViewOffset + مسافة محسوبة) فلا تتداخل الصناديق مع الخانات على أي مقاس.
   • الترتيب = econBulkOrder (تصاعدي بالقيمة، الأفضل أخيراً). الإيقاع من مستوى كل جائزة: العادية سريعة ومتداخلة، النادرة تأخذ وقفة وكاميرا وضوءاً،
     والأفضل تُسبق بلحظة هدوء ثم إبراز خانتها. نقرة = تسريع، نقرتان = تخطٍّ صامت. */
import { Group, Mesh, Vector3, Quaternion, Euler, Color, PlaneGeometry, MeshBasicMaterial, AdditiveBlending } from 'three';
import { Runner } from './runner.js';
import { buildBox, instantiate, Lib, TINT } from './models.js';
import { makeCard } from './card.js';
import { E, clamp, lerp, noise1, rad } from './util.js';

const PACE = l => ({ cam: .32 + l * .05, ant: l <= 2 ? .22 : .3 + l * .14, pulses: l >= 7 ? 3 : l >= 5 ? 2 : l >= 3 ? 1 : 0, open: .34 + l * .03, rise: .42 + l * .07, hover: .22 + l * .1, fly: .46 + l * .015 });
const sph = (az, el, d, l) => { const a = rad(az), e = rad(el); return [l[0] + d * Math.sin(a) * Math.cos(e), l[1] + d * Math.sin(e), l[2] + d * Math.cos(a) * Math.cos(e)]; };
export function bulkSeconds(items, calm) { if (calm) return 3.6; let t = 2.4; items.forEach((it, k) => { const P = PACE(clamp(it.lv | 0, 1, 9)), last = k === items.length - 1; t += P.cam * .5 + P.ant + P.open * .4 + P.rise + P.hover + (last ? .6 + P.fly + 1.2 : 0); }); return t + 2.4; }

export function playBulk(o) {
  const items = o.items.slice(), N = items.length, n = clamp(o.n | 0, 1, 5), T = TINT[n], calm = !!o.calm;
  const run = new Runner({ host: o.host, theme: o.theme, tier: o.tier, hooks: o.hooks, preserve: o.preserve }); run.fitAspect = 0;
  const st = run.stage, tl = run.tl, lib = new Lib(run.q.tier === 'low' ? 512 : 768);
  const base = buildBox(n, lib); run.extra.push(() => { try { lib.disposeAll(); } catch (e) {} });
  const sfx = (a, b) => run.sfx(a, Object.assign({ n, bulk: true }, b || {})), hap = p => run.haptic(p);
  const key = it => String(it.i);
  /* ---------- مساحة المسرح فوق الشبكة ---------- */
  const area = () => { let top = run.safe.t + 10, bot = run.H * .6; let gt = Infinity; items.forEach(it => { const r = run.targetRect(key(it)); if (r) gt = Math.min(gt, r.y); }); if (isFinite(gt) && gt > run.H * .35) bot = gt - 12; return { top, bot, h: Math.max(120, bot - top) }; };
  let A = area();
  const aspA = run.W / A.h, rows = aspA > 1.7 ? [5, 5] : aspA > 1.1 ? [4, 3, 3] : [3, 4, 3];
  const s0 = clamp(2.4 / Math.max(base.dims.w, base.dims.d, base.top * .95), .55, 1.15), sb = s0 * .62;
  const foot = (n === 5 ? 2.95 : Math.max(base.dims.w, base.dims.d) + .1) * sb;
  const dx = Math.max(1.6, foot + .28), dz = Math.max(1.8, (n === 5 ? 2.95 : base.dims.d + .1) * sb + .5);
  const slots = []; rows.forEach((c, r) => { for (let i = 0; i < c; i++) slots.push({ x: (i - (c - 1) / 2) * dx + (r % 2 ? 0 : 0), z: (r - (rows.length - 1) / 2) * dz, r }); });
  /* الأفضل (آخر عنصر) بمنتصف الصف الأمامي */
  const front = slots.map((q, i) => i).filter(i => slots[i].r === rows.length - 1), ci = front[Math.floor(front.length / 2)]; const sw = slots[ci]; slots[ci] = slots[N - 1]; slots[N - 1] = sw;
  const LW = Math.max.apply(null, rows) * dx, LD = rows.length * dz, kScale = Math.max(1.4, Math.max(LW, LD) / 3.8);
  [st.platform, st.rimM, st.stepM].forEach(m => m.scale.set(kScale, 1, kScale)); st.contact.visible = false; st.scene.fog.density *= .3;
  st.key.target.position.set(0, 0, 0); { const sc = st.key.shadow.camera; sc.left = sc.bottom = -5 - kScale * 2.2; sc.right = sc.top = 5 + kScale * 2.2; sc.updateProjectionMatrix(); } st.key.position.set(-5 * kScale * .7, 9 + kScale, 6 * kScale * .7);
  const shMat = new MeshBasicMaterial({ map: st.contact.material.map, transparent: true, depthWrite: false, opacity: .8 });
  const H = base.dims.h * sb, LID = base.dims.lidH * sb, cyb = H * .55 + LID * .3, hw = (base.kind === 'rect' ? base.dims.w : base.dims.ap * 2) * sb / 2, zf = (base.kind === 'rect' ? base.dims.d / 2 : base.dims.ap) * sb + .03;
  const cBox = new Color(`rgb(${T.light[0]},${T.light[1]},${T.light[2]})`), cEdge = new Color(`rgb(${T.edge[0]},${T.edge[1]},${T.edge[2]})`);
  const B = items.map((it, k) => {
    const m = instantiate(base), rig = new Group(); rig.add(m.root); m.root.scale.setScalar(sb); m.root.position.y = -m.baseY * sb; const sl = slots[k]; rig.position.set(sl.x, 0, sl.z); st.scene.add(rig);
    const sh = new Mesh(new PlaneGeometry(1, 1), shMat); sh.rotation.x = -Math.PI / 2; sh.position.set(sl.x, (n === 5 ? -.16 * sb : 0) + .004, sl.z); sh.scale.set(m.dims.w * sb * 1.6, m.dims.d * sb * 1.6, 1); if (n === 5) sh.scale.set(3.1 * sb, 3.1 * sb, 1); st.scene.add(sh);
    const rl = it.reward.rgb || [255, 214, 120], cr = new Color(`rgb(${rl[0]},${rl[1]},${rl[2]})`);
    const gm = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: st.glowTex, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: cr, fog: false, toneMapped: false })); gm.rotation.x = -Math.PI / 2; gm.position.set(sl.x, .02, sl.z); gm.scale.setScalar(m.dims.w * sb * 1.8); st.scene.add(gm);
    const lv = clamp(it.lv | 0, 1, 9);
    return { it, k, m, rig, sl, sh, gm, lv, P: PACE(lv), cr, seamC: new Color(), S: { angle: 0, seam: 0, light: 0, charge: 0, jolt: 0, lockOut: 0, drop: 1, squash: 0, cu: 0, fly: 0, phase: 0, glow: 0, mix: 0, landed: false } };
  });
  run.extra.push(() => { try { shMat.dispose(); B.forEach(b => { b.gm.material.dispose(); b.m.dispose(); if (b.card) { b.card.userData.texs.forEach(t => t.dispose()); b.card.userData.mats.forEach(m => m.dispose()); } }); } catch (e) {} });
  /* ---------- إطارات الخانات (DOM فوق المشهد، تحت البطاقات) ---------- */
  const slotLayer = document.createElement('div'); slotLayer.className = 'b3d-slots'; run.root.insertBefore(slotLayer, run.dom.layer);
  const slotEl = {}; items.forEach(it => { const e = document.createElement('div'); e.className = 'b3d-slot'; e.innerHTML = '<b>' + (it.i + 1) + '</b>'; e.style.setProperty('--c', (it.reward.rgb || [255, 214, 120]).join(',')); slotLayer.appendChild(e); slotEl[key(it)] = e; });
  const placeSlots = () => { items.forEach(it => { const r = run.targetRect(key(it)), e = slotEl[key(it)]; if (!r) { e.style.display = 'none'; return; } const s = `${r.x.toFixed(1)},${r.y.toFixed(1)},${r.w.toFixed(1)},${r.h.toFixed(1)}`; if (e._s !== s) { e._s = s; e.style.display = ''; e.style.transform = `translate(${r.x}px,${r.y}px)`; e.style.width = r.w + 'px'; e.style.height = r.h + 'px'; } }); };
  /* ---------- الكاميرا: إطار المسرح داخل المساحة فوق الشبكة ---------- */
  const fov = 34, el0 = calm ? 48 : 46;
  const frameCam = () => {
    A = area(); const W = run.W, Hh = run.H, cyA = (A.top + A.bot) / 2; st.camera.setViewOffset(W, Hh, 0, Hh / 2 - cyA, W, Hh);
    const tv = Math.tan(rad(fov) / 2), frac = A.h / Hh, needV = (LD * Math.sin(rad(el0)) + (H + LID) * Math.cos(rad(el0)) + .9) / 2 / (tv * frac), needH = (LW + 1.2) / 2 / (tv * W / Hh) + LD * .5 * Math.cos(rad(el0));
    return Math.max(needV * .86, needH * 1.04);
  };
  let ovD = frameCam();
  run.onResize = () => { ovD = frameCam(); run._tg = null; };
  const ovPos = () => sph(0, el0, ovD, [0, .1, 0]);
  const track = run.track, io = E.io, up = new Vector3(0, 1, 0);
  run.blackEl.style.opacity = '1'; tl.tw(0, .5, e => { run.blackEl.style.opacity = String(1 - e); }, E.out);
  tl.cue(0, () => sfx('chest.touch'));
  items.forEach((it, j) => { tl.cue(.35 + j * .05, () => { slotEl[key(it)].classList.add('is-in'); }); });
  const order = B.map((b, i) => i).sort((a, c) => (slots[a].z - slots[c].z) || (slots[a].x - slots[c].x));
  function mkCard(b) {
    const face = b.it.reward.face, dc = face ? run.dom.add(face, { K: Math.min(2, run.dom.K) }) : null, ar = dc ? dc.ar : 1.25;
    const c = makeCard(b.it.reward, st.theme, ar); c.visible = false; c.traverse(x => { if (x.isMesh) x.castShadow = false; }); st.scene.add(c);
    if (dc) { c.userData.face.visible = false; c.children[1].visible = false; run.landables.push({ key: key(b.it), obj: c, dom: dc, ar }); }
    b.card = c; b.dc = dc; b.ar = ar; return c;
  }
  let total;
  if (calm) {
    track.key(0, ovPos(), [0, .1, 0], fov, io).key(3.6, sph(0, el0 - 2, ovD * .98, [0, .1, 0]), [0, .1, 0], fov, io);
    B.forEach(b => { b.S.drop = 0; });
    tl.tw(.5, .7, e => { B.forEach(b => { b.S.angle = lerp(0, rad(104), e); b.S.glow = e * .5; b.S.light = e * .6; }); }, E.outq);
    tl.cue(.6, () => sfx('chest.reveal', { lv: 1 }));
    B.forEach((b, k) => { const t0 = .9 + k * .12; tl.cue(t0, () => { mkCard(b).visible = true; b.S.cardOn = true; }); tl.tw(t0, .5, e => { b.S.cu = e; }, E.lin); tl.cue(t0 + .5, () => { b.S.phase = 3; }); tl.tw(t0 + .5, .55, e => { b.S.fly = e; }, E.lin); tl.cue(t0 + 1.02, () => { b.S.landed = true; slotEl[key(b.it)].classList.add('is-on'); sfx('chest.slot', { k, lv: b.lv, pan: panOf(b) }); }); });
    total = 3.6; tl.cue(total, () => run.handoff(false));
  } else {
    track.key(0, sph(25, 68, ovD * 1.22, [0, .1, 0]), [0, .1, 0], fov + 4, io).key(2.2, ovPos(), [0, .1, 0], fov, E.out);
    order.forEach((bi, j) => { const b = B[bi], t0 = .3 + j * .1; tl.tw(t0, .5, e => { b.S.drop = 1 - e; }, E.in); tl.tw(t0 + .5, .32, (e, p) => { b.S.squash = Math.sin(p * Math.PI) * Math.exp(-2 * p); }, E.lin); if (j % 3 === 0) tl.cue(t0 + .5, () => { sfx('chest.drop', { g: .45 }); run.shake(.02); st.emitSparks(new Vector3(b.sl.x, .05, b.sl.z), 8, { sp: [.5, 1.4], up: .3, spread: 1, life: [.4, .8], color: 0xd9c4a0, size: .03 }); }); });
    let t = 2.3, prevP = ovPos(), prevL = [0, .1, 0], maxLv = 1;
    B.forEach((b, k) => {
      const P = b.P, last = k === N - 1, S = b.S, lv = b.lv; maxLv = Math.max(maxLv, lv);
      if (last && N > 1) { tl.cue(t, () => { sfx('chest.hush'); }); t += .55; }
      const tc = t, ta = tc + P.cam * .6, tL = ta + P.ant, tO = tL + .1, tR = tO + .14, th = tR + P.rise, tf = th + P.hover, te = tf + P.fly;
      const look = [b.sl.x * .5, cyb, b.sl.z * .5], dist = ovD * (last ? .5 : lv >= 6 ? .58 : lv >= 3 ? .72 : .86), az = clamp(-b.sl.x * 4, -18, 18), el = el0 - (last ? 14 : lv >= 5 ? 10 : 4);
      track.key(tc, prevP, prevL, fov, io); const pose = sph(az, el, dist, look); track.key(tc + P.cam, pose, look, fov - (lv >= 6 ? 3 : 0), io);
      track.key(tf, pose, look, fov - (lv >= 6 ? 3 : 0), io); prevP = pose; prevL = look;
      S.t = { tc, ta, tL, tO, tR, th, tf, te };
      tl.cue(tc, () => { S.phase = 1; S.focus = true; sfx('chest.focus', { k, pan: b.sl.x / (LW / 2) * .5 }); });
      if (lv >= 4) tl.cue(ta, () => sfx('chest.charge', { dur: P.ant, lv, bulk: true }));
      tl.tw(ta, P.ant, e => { S.charge = e; S.seam = .15 + e * e * .8; S.light = e * e * (.3 + lv * .07); S.mix = E.io(clamp(e * 1.2)); }, E.lin);
      for (let i = 0; i < P.pulses; i++) { const tp = ta + P.ant * Math.pow((i + 1) / (P.pulses + 1), .75); tl.cue(tp, () => { S.jolt = 1; sfx('chest.rattle', { i, of: P.pulses, lv, g: .7 }); run.shake(.01 + i * .006); }); }
      tl.cue(tL, () => { S.rel = true; sfx('chest.unlatch', { g: .55 + lv * .04 }); });
      tl.tw(tL, .28, e => { S.lockOut = e; }, E.outBack);
      tl.tw(tO, P.open, e => { S.angle = lerp(rad(3), rad(n === 2 ? 102 : 106), e); }, E.outBack);
      tl.cue(tO, () => {
        sfx('chest.reveal', { lv, k }); run.shake(.01 + lv * .008); if (lv >= 6) hap(lv >= 8 ? [16, 40, 24, 40, 40] : [12, 30, 18]);
        const m = new Vector3(b.sl.x, H * .95, b.sl.z); st.emitSparks(m, 8 + lv * 7, { sp: [1, 2.4 + lv * .2], up: 1.8 + lv * .25, spread: hw, life: [.6, 1.2 + lv * .06], color: b.cr.clone(), size: .035 + lv * .003 });
        if (lv >= 5) run.flash(.05 + lv * .03, 380 + lv * 50, `rgba(${b.it.reward.rgb.join(',')},.9)`);
        if (lv >= 7) st.burstPaper(m, 8 + (lv - 6) * 8, { sp: [1.6, 3.6], colors: [b.cr.getHex(), 0xf3e2b8], life: 2.4 });
      });
      tl.tw(tO - .04, .5, e => { S.light = lerp(S.light, 1.2 + lv * .25, e); S.glow = e; S.seam *= (1 - e); }, E.out);
      tl.cue(tR - .02, () => { mkCard(b).visible = true; S.cardOn = true; if (lv >= 3) sfx('chest.rise', { dur: P.rise, lv, g: .6 }); });
      tl.tw(tR, P.rise, e => { S.cu = e; }, E.lin);
      if (lv >= 6) tl.cue(th, () => sfx('chest.rare', { lv, bulk: true }));
      tl.cue(tf, () => { S.phase = 3; sfx('chest.fly', { k, pan: panOf(b), lv }); });
      tl.tw(tf, P.fly, e => { S.fly = e; }, E.lin);
      tl.cue(te - .03, () => { S.landed = true; slotEl[key(b.it)].classList.add('is-on'); sfx('chest.slot', { k, lv, pan: panOf(b) }); hap([6]); });
      tl.tw(te, .8, e => { S.glow = lerp(1, .25, e); S.light = lerp(S.light, 0, e); }, E.out);
      /* العادية تتداخل: الصندوق التالي يبدأ أثناء تحليق البطاقة */
      t = last ? te : (lv <= 2 ? tf - .05 : lv <= 4 ? tf + .1 : te + .15);
      if (last) total = te;
    });
    const tB = total + .15, tOv = tB + (N > 1 ? .9 : .3), tEnd = tOv + 1.25;
    if (N > 1) tl.cue(tB, () => { const lb = B[N - 1]; slotEl[key(lb.it)].classList.add('is-best'); sfx('chest.best', { lv: lb.lv, pan: panOf(lb) }); });
    track.key(tOv - .2, prevP, prevL, fov, io).key(tOv + 1.1, sph(0, el0 - 2, ovD, [0, .1, 0]), [0, .1, 0], fov, io);
    tl.cue(tOv, () => { sfx('chest.finale', { lv: maxLv }); slotLayer.classList.add('is-done'); });
    tl.tw(tOv, 1, e => { B.forEach(b => { b.S.glow = lerp(b.S.glow, .4, e); }); }, E.io);
    total = tEnd; tl.cue(tEnd, () => run.handoff(false));
  }
  function panOf(b) { const r = run.targetRect(key(b.it)); return r ? clamp(((r.x + r.w / 2) / run.W) * 2 - 1, -1, 1) * .6 : 0; }
  run.total = total;
  /* ---------- كل إطار ---------- */
  const hp = new Vector3(), hq = new Quaternion(), hs = new Vector3(), sp2 = new Vector3(), sq2 = new Quaternion(), ss2 = new Vector3(), pin = new Vector3(), qFlat = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)), qs = new Quaternion(), v3 = new Vector3(), tmp = new Vector3();
  const rA = new Vector3(), rB = new Vector3(), rimC = { a: rA, b: rB };
  const baseL = { hemi: st.hemi.intensity, key: st.key.intensity, fill: st.fill.intensity };
  run.post = () => {
    placeSlots();
    B.forEach(b => { const S = b.S; if (!b.dc) return; if (!b.card || !b.card.visible) { run.dom.hide(b.dc); return; } let clip = null; if (!S.fly && S.cu < .45) { const ry = H - base.baseY * sb; rA.set(b.sl.x - hw, ry, b.sl.z + zf); rB.set(b.sl.x + hw, ry, b.sl.z + zf); clip = rimC; } run.dom.place(b.dc, b.card, st.camera, run.W, run.H, clip, 1, S.landed ? .12 : .5); });
  };
  run.onFrame = (dt, t) => {
    let active = null; B.forEach(b => { if (b.S.phase === 1 || (b.S.phase === 3 && !b.S.landed)) active = b; if (b.S.phase === 1 && b.S.cardOn && !b.S.fly && !active) active = b; });
    const lvA = active ? active.lv : 1, dim = calm ? 1 : active ? (lvA >= 6 ? .45 : .7) : 1, dm = lerp(1, dim, clamp((t - 2.2) / .5));
    st.hemi.intensity = lerp(st.hemi.intensity, baseL.hemi * dm, .1); st.key.intensity = lerp(st.key.intensity, baseL.key * (.5 + dm * .5), .1); st.fill.intensity = baseL.fill * dm;
    const cam = st.camera;
    B.forEach((b, k) => {
      const S = b.S, m = b.m; S.jolt = Math.max(0, S.jolt - dt * 5);
      let jx = 0, jz = 0, jr = 0; if (!calm && S.charge > 0 && !S.rel) { const a = S.charge * S.charge * .004 + S.jolt * .02; jx = noise1(t * 21 + k, 1) * a; jz = noise1(t * 19 + k, 2) * a * .6; jr = noise1(t * 17 + k, 3) * a; }
      b.rig.position.set(b.sl.x + jx, S.drop * S.drop * 4 + S.jolt * .03, b.sl.z + jz); b.rig.rotation.set(0, 0, jr * .6); b.rig.scale.set(1 + S.squash * .06, 1 - S.squash * .1, 1 + S.squash * .06);
      m.lidPivot.rotation.x = -(S.angle + (!S.rel ? rad(2) * S.jolt : 0)); m.lockPivot.rotation.x = -S.lockOut * 1.3;
      b.seamC.copy(cEdge).lerp(b.cr, S.mix); m.setSeamColor(b.seamC); m.setSeam(clamp(S.seam + S.jolt * .4, 0, 1)); m.setGems(.9 + S.charge * 1.2 + S.light * .3);
      b.sh.visible = S.drop < .4; b.gm.material.opacity = S.glow * (.25 + b.lv * .035);
      if (b.card && b.card.visible) {
        const c = b.card, u = S.cu;
        if (S.landed) { const r = run.targetRect(key(b.it)); if (r) { run.poseForRect(r, 1.4, b.ar, c.position, c.quaternion, c.scale); } c.children[2].visible = false; return; }
        /* داخل الصندوق → فوقه */
        const ua = clamp(u / .4), ea = E.out(ua), ub = clamp((u - .3) / .7), eb = E.io(ub);
        pin.set(b.sl.x, lerp(H * .3, H + .25, ea), b.sl.z + lerp(0, .03, ea)); const sIn = Math.min(hw * 1.15, .8) * lerp(.8, 1, ea);
        /* وضعية التحليق فوق الصندوق: مستطيل حول إسقاط قمّته */
        v3.set(b.sl.x, H + LID + .2, b.sl.z).project(cam); const px = (v3.x * .5 + .5) * run.W, py = (-v3.y * .5 + .5) * run.H;
        const w = clamp(run.W * (.22 + b.lv * .022), 70, Math.min(run.W * .46, A.h * .55 / b.ar)), h = w * b.ar;
        const rx = clamp(px - w / 2, 10, run.W - w - 10), ry = clamp(py - h * .85, A.top + 4, A.bot - h - 4);
        const D = Math.max(1.2, tmp.set(b.sl.x, H, b.sl.z).applyMatrix4(cam.matrixWorldInverse).z * -.75);
        run.poseForRect({ x: rx, y: ry, w, h }, D, b.ar, hp, hq, hs);
        c.position.copy(pin).lerp(hp, eb); c.position.y += Math.sin(eb * Math.PI) * .12;
        c.quaternion.copy(qFlat).slerp(hq, Math.max(ea * .4, eb)); qs.setFromAxisAngle(up, calm ? 0 : Math.pow(1 - eb, 1.6) * (b.lv >= 6 ? 2 : 1) * Math.PI * 2 * (ub > 0 ? 1 : 0)); c.quaternion.multiply(qs);
        c.scale.set(sIn, sIn, sIn).lerp(hs, eb);
        if (S.fly > 0) {
          const r = run.targetRect(key(b.it));
          if (r) { const f = E.io(S.fly); run.poseForRect(r, lerp(D, 1.4, f), b.ar, sp2, sq2, ss2); c.position.lerp(sp2, f); c.position.addScaledVector(up, Math.sin(f * Math.PI) * .35 * (1 - f * .4)); c.quaternion.slerp(sq2, E.io(clamp(S.fly * 1.3))); c.scale.lerp(ss2, f); }
        }
        c.userData.mats[2].emissiveIntensity = .2 + S.glow * .4;
      }
    });
    if (active) {
      const b = active, S = b.S;
      st.inner.position.set(b.sl.x, H * .8, b.sl.z); st.inner.intensity = S.light * (b.lv >= 5 ? 6 : 4.5) * sb * 1.6; st.inner.color.copy(cBox).lerp(b.cr, S.mix);
      st.spot.position.set(b.sl.x - .8, 8.5, b.sl.z + 3); st.spot.target.position.set(b.sl.x, H * .6, b.sl.z); st.spot.intensity = lerp(st.spot.intensity, b.lv >= 5 ? 46 : 26, .12); st.spot.color.copy(b.cr).lerp(new Color(1, 1, 1), .5);
      const bm = st.beam.material.uniforms; bm.uColor.value.copy(b.cr); bm.uI.value = lerp(bm.uI.value, S.glow * (S.landed ? 0 : .12 + b.lv * .05), .2); st.beam.position.set(b.sl.x, H * .82, b.sl.z); st.beam.scale.set(hw * .95, 5, hw * .7);
    } else { st.inner.intensity *= .9; st.spot.intensity *= .9; st.beam.material.uniforms.uI.value *= .9; }
  };
  if (!o.manual) run.start();
  return { run, abort: () => run.abort(), skip: () => run.skip(), total, seek: t => run.seek(t) };
}
