/* CODIS-BOX3D — سيناريو فتح ×10 (إخراج مستقل عن الصندوق الواحد): عشرة نسخ حقيقية من مجسّم المستوى على منصّة معرض كبيرة، تدخل بتتابع، تُفتح واحداً واحداً
   بترتيب القيمة التصاعدي (الأفضل أخيراً) بكاميرا تنتقل بين الصناديق، وكل مكافأة تطير لخانتها بصف النتائج. المجسّم/الخامات/الهندسة تُبنى مرة وتُشارَك بين النسخ. */
import { Group, Mesh, Vector3, Quaternion, Euler, Object3D, Color, PlaneGeometry, MeshBasicMaterial, AdditiveBlending } from 'three';
import { Runner } from './runner.js';
import { buildBox, instantiate, Lib, TINT } from './models.js';
import { makeCard } from './card.js';
import { tex, glowCanvas } from './tex.js';
import { E, clamp, lerp, noise1, rad } from './util.js';

/* مدد كل صندوق حسب مجموعة القيمة (ثانية) */
const P = [null,
  { cam: .5, ant: .22, open: .55, rise: .5, hold: .3, fly: .42 },
  { cam: .65, ant: .5, open: .7, rise: .7, hold: .42, fly: .46 },
  { cam: .8, ant: 1.0, open: .9, rise: .95, hold: .65, fly: .5 },
  { cam: .95, ant: 1.6, open: 1.15, rise: 1.3, hold: 1.0, fly: .55 },
  { cam: 1.15, ant: 2.3, open: 1.5, rise: 1.9, hold: 1.5, fly: .6 }];
const sph = (az, el, d, l) => { const a = rad(az), e = rad(el); return [l[0] + d * Math.sin(a) * Math.cos(e), l[1] + d * Math.sin(e), l[2] + d * Math.cos(a) * Math.cos(e)]; };

export function bulkSeconds(items, calm) {
  if (calm) return 3.2; let t = 3.0; items.forEach((it, k) => { const q = P[Math.max(it.g, k === items.length - 1 ? 3 : 1)]; t += q.cam * .6 + q.ant + q.open * .5 + q.rise + q.hold * .3 + (k === items.length - 1 ? .9 + q.hold * .7 + q.fly : 0); }); return t + 3.4;
}

export function playBulk(o) {
  const items = o.items.slice(), N = items.length, n = clamp(o.n | 0, 1, 5), T = TINT[n], calm = !!o.calm;
  const run = new Runner({ host: o.host, theme: o.theme, low: o.low, hooks: o.hooks, preserve: o.preserve });
  const st = run.stage, tl = run.tl, lib = new Lib(); run.extra.push(() => { try { lib.disposeAll(); } catch (e) {} });
  const sfx = (a, b) => { try { if (o.hooks.sfx) o.hooks.sfx(a, b); } catch (e) {} };
  const hap = p => { try { if (o.hooks.haptic) o.hooks.haptic(p); } catch (e) {} };
  const aspect0 = run.aspect, portrait = aspect0 < .95, mid = aspect0 >= .95 && aspect0 < 1.35;
  const rows = portrait ? [3, 4, 3] : mid ? [4, 3, 3] : [5, 5];
  const base = buildBox(n, lib), s0 = clamp(2.5 / Math.max(base.dims.w, base.dims.d, base.top * .95), .55, 1.15), sb = s0 * .66;
  const foot = (n === 5 ? 2.95 : Math.max(base.dims.w, base.dims.d) + .1) * sb, fK = clamp(foot / 1.25, .9, 1.5);
  const dx = Math.max(1.75, foot + .3), dz = Math.max(portrait ? 1.95 : 2.1, (n === 5 ? 2.95 : base.dims.d + .1) * sb + .4);
  /* خانات الصناديق: صفوف من الخلف للأمام، والأخيرة (الأفضل) بمنتصف الصف الأمامي */
  const slots = []; rows.forEach((c, r) => { for (let i = 0; i < c; i++) slots.push({ x: (i - (c - 1) / 2) * dx, z: (r - (rows.length - 1) / 2) * dz, r }); });
  const frontIdx = []; slots.forEach((q, i) => { if (q.r === rows.length - 1) frontIdx.push(i); }); const cIdx = frontIdx[Math.floor(frontIdx.length / 2)];
  const tmp = slots[cIdx]; slots[cIdx] = slots[N - 1]; slots[N - 1] = tmp;
  const kScale = Math.max(1.55, Math.max(Math.max.apply(null, rows) * dx, rows.length * dz) / 3.9);
  [st.platform, st.rimM, st.stepM].forEach(m => m.scale.set(kScale, 1, kScale)); st.layers.forEach(l => { l.position.z = l.userData.z - 3 * kScale; l.scale.setScalar(1 + kScale * .35); });
  st.key.target.position.set(0, 0, 0); const sc = st.key.shadow.camera; sc.left = sc.bottom = -5 - kScale * 2.2; sc.right = sc.top = 5 + kScale * 2.2; sc.updateProjectionMatrix(); st.key.position.set(-5 * kScale * .7, 9 + kScale, 6 * kScale * .7); if (st.q.shadow) st.key.shadow.mapSize.set(st.q.shadowSize, st.q.shadowSize);
  st.contact.visible = false;
  const shadowTex = st.contact.material.map, shMat = new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: .8 });
  const glowMap = st.glowTex;
  const H = base.dims.h * sb, LID = base.dims.lidH * sb, cyb = H * .55 + LID * .3, yTop = H + LID * .5 + 1.0;
  const cardDesc = it => ({ title: it.reward.title, sub: it.reward.sub, tag: it.reward.tag, rgb: it.reward.rgb, font: it.reward.font });
  const B = items.map((it, k) => {
    const m = instantiate(base), rig = new Group(); rig.add(m.root); m.root.scale.setScalar(sb); m.root.position.y = -m.baseY * sb; const sl = slots[k]; rig.position.set(sl.x, 0, sl.z); st.scene.add(rig);
    const sh = new Mesh(new PlaneGeometry(1, 1), shMat); sh.rotation.x = -Math.PI / 2; sh.position.set(sl.x, (n === 5 ? -.16 * sb : 0) + .004, sl.z); sh.scale.set(m.dims.w * sb * 1.55, m.dims.d * sb * 1.55, 1); if (n === 5) sh.scale.set(3.1 * sb, 3.1 * sb, 1); st.scene.add(sh);
    const gm = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: glowMap, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, color: (T.light[0] << 16) | (T.light[1] << 8) | T.light[2], fog: false })); gm.rotation.x = -Math.PI / 2; gm.position.set(sl.x, H * .99, sl.z); gm.scale.setScalar(m.dims.w * sb * .95); st.scene.add(gm);
    return { it, k, m, rig, sl, sh, gm, st: { angle: 0, rattle: 0, seam: 0, gems: 0, light: 0, lockOut: 0, rel: false, rr: 0, drop: 1, squash: 0, cu: 0, card: null, fly: 0, phase: 0, glow: 0 } };
  });
  run.extra.push(() => { try { shMat.dispose(); B.forEach(b => b.gm.material.dispose()); B.forEach(b => { if (b.st.card) { b.st.card.userData.texs.forEach(t => t.dispose()); b.st.card.userData.mats.forEach(m => m.dispose()); } }); } catch (e) {} });
  st.scene.add(st.camera);
  const tray = new Group(); st.camera.add(tray);
  const traySlots = []; /* بمنظور الكاميرا: صف/صفان بأسفل الشاشة، الخانة بحسب رقم الصندوق الأصلي */
  function layoutTray() {
    const d = 3.2, fov = 34, vh = 2 * d * Math.tan(rad(fov) / 2), vw = vh * run.aspect, two = run.aspect < .95; traySlots.length = 0;
    const perRow = two ? 5 : 10, cw = Math.min(vw * .09, (vw * .92) / perRow * .86, .19), ch = cw * 1.25, gap = (vw * .94) / perRow;
    for (let i = 0; i < N; i++) {
      const r = two ? Math.floor(i / 5) : 0, c = two ? i % 5 : i, x = ((perRow - 1) / 2 - c) * gap;
      const y = -vh / 2 + ch * .72 + (two ? (1 - r) * (ch * 1.12) : 0) + vh * (two ? .035 : .045) - (portrait ? vh * .06 : 0);
      traySlots[i] = { p: new Vector3(x, y, -d), s: cw };
    }
  }
  run.onResize = () => { layoutTray(); B.forEach(b => { if (b.st.inTray) { const q = traySlots[b.it.i]; b.st.card.position.copy(q.p); b.st.card.scale.setScalar(q.s); } }); };
  layoutTray();
  if (portrait) st.camera.setViewOffset(run.W, run.H, 0, run.H * .06, run.W, run.H);
  /* ---------- ترتيب الزمن ---------- */
  const gOf = (it, k) => Math.max(clamp(it.g | 0, 1, 5), k === N - 1 ? 3 : 1);
  const track = run.track, io = E.io, up = new Vector3(0, 1, 0);
  const fitMul = Math.max(1, .85 / aspect0);
  const ovD = (Math.max(Math.max.apply(null, rows) * dx + 2, rows.length * dz * 1.5 + 3) / 2) / (Math.tan(rad(36) / 2) * Math.min(1, aspect0)) * (portrait ? .74 : .86), ovPos = sph(0, portrait ? 52 : 44, ovD / fitMul, [0, .2, 0]);
  run.fitOverview = () => {};
  /* مدخل: سقوط تتابعي */
  const order = B.map((b, i) => i).sort((a, c) => (slots[a].z - slots[c].z) || (slots[a].x - slots[c].x));
  run.blackEl.style.opacity = '1'; tl.tw(0, .6, e => { run.blackEl.style.opacity = String(1 - e); }, E.out);
  if (calm) {
    track.key(0, ovPos, [0, .2, 0], 36, io).key(3.2, sph(0, portrait ? 50 : 42, ovD / fitMul * .96, [0, .2, 0]), [0, .2, 0], 36, io);
    B.forEach(b => { b.st.drop = 0; });
    tl.tw(.8, 1.2, e => { B.forEach(b => { b.st.angle = lerp(0, rad(104), e); }); }, E.io);
    tl.cue(1.2, () => { B.forEach(b => { b.st.cardOn = true; b.st.card = mkCard(b); b.st.card.visible = true; }); });
    tl.tw(1.2, 1.2, e => { B.forEach(b => { b.st.cu = e; }); }, E.io);
    tl.cue(3.2, () => run.handoff(false)); run.total = 3.2;
  } else {
    track.key(0, sph(30, 70, ovD / fitMul * 1.15, [0, .2, 0]), [0, .2, 0], 40, io).key(2.7, ovPos, [0, .2, 0], 36, E.out);
    order.forEach((bi, j) => { const b = B[bi], t0 = .35 + j * .11; tl.tw(t0, .55, e => { b.st.drop = 1 - e; }, E.in); tl.tw(t0 + .55, .3, (e, p) => { b.st.squash = Math.sin(p * Math.PI) * Math.exp(-2 * p); }, E.lin); if (j % 3 === 0) tl.cue(t0 + .55, () => { sfx('box.thud', { n, g: .5 }); run.shake(.03); st.emitSparks(new Vector3(b.sl.x, .1, b.sl.z), 8, { sp: [.6, 1.6], up: .5, spread: 1.2, life: [.5, 1], color: 0xf1dfb0 }); }); });
    let t = 3.0, prev = ovPos.slice(), prevL = [0, .2, 0];
    run.total = 0;
    B.forEach((b, k) => {
      const g = gOf(b.it, k), Q = P[g], last = k === N - 1, S = b.st;
      if (last) { /* لحظة هدوء قبل أفضل جائزة: الإيقاع يتغير */ tl.cue(t, () => { sfx('bulk.advance'); }); t += .7; }
      const tc = t, ta = tc + Q.cam * .6, to = ta + Q.ant, tr = to + Q.open * .5, th = tr + Q.rise, tf = th + Q.hold, te = tf + Q.fly;
      const look = [b.sl.x, cyb, b.sl.z], dist = (portrait ? 9.8 : 7.0) * (g >= 4 ? .94 : 1) * fK / fitMul, az = clamp(-b.sl.x * 5, -24, 24) + (k % 2 ? 7 : -7), rf = (rows.length - 1 - b.sl.r) / Math.max(1, rows.length - 1), el = (g >= 3 ? 24 : 28) + rf * 20;
      track.key(tc, prev, prevL, 36, io); const pose = sph(az, el, dist, look);
      track.key(tc + Q.cam, pose, look, g >= 4 ? 30 : 34, io);
      const look2 = [b.sl.x, cyb + .35, b.sl.z]; track.key(to + Q.open * .9, sph(az * .4, el - 4, dist * (g >= 4 ? 1.12 : .96), look2), look2, g >= 4 ? 27 : 33, io);
      prev = sph(az * .4, el - 4, dist * (g >= 4 ? 1.12 : .96), look2); prevL = look2;
      S.t = { tc, ta, to, tr, th, tf, te, g, Q };
      tl.cue(tc, () => { S.phase = 1; S.focus = true; sfx('bulk.advance'); });
      tl.cue(ta, () => { S.phase = 2; if (g >= 2) sfx('box.charge', { lv: g, dur: Q.ant, n }); if (g >= 2) sfx('box.creak', { n }); });
      tl.tw(ta, Q.ant, e => { S.rr = e; S.seam = e * e * .95; S.light = e * e * (.5 + g * .1); S.gems = e; }, E.lin);
      const tLock = to - Math.min(.3, Q.ant * .5);
      tl.cue(tLock, () => { S.rel = true; sfx(g >= 3 ? 'box.release' : 'box.unlock', { lv: g, n, g: g === 1 ? .5 : .8 }); if (g >= 3) hap([10, 20, 14]); });
      tl.tw(tLock, .3, e => { S.lockOut = e; }, E.out); tl.tw(tLock, .3, e => { S.angle = lerp(0, rad(2.6), e); }, E.io);
      tl.tw(to, Q.open, e => { S.angle = lerp(rad(2.6), rad(n === 2 ? 100 : 106), e); }, E.io);
      tl.tw(to + Q.open, .7, (e, p) => { S.angle = rad(n === 2 ? 100 : 106) * (1 + .035 * Math.exp(-6.5 * p) * Math.sin(p * 17)); }, E.lin);
      tl.tw(to, Q.open * .8, e => { S.light = lerp(S.light, 1.5 + g * .4, e); S.shaft = e; S.seam *= (1 - e); S.glow = e; }, E.out);
      tl.cue(to + .05, () => {
        sfx(g >= 3 ? 'box.reveal' : 'bulk.reveal', { lv: g, g, n }); run.shake(.012 + g * .012);
        const m = new Vector3(b.sl.x, H * .95, b.sl.z), col = (T.light[0] << 16) | (T.light[1] << 8) | T.light[2];
        st.emitSparks(m, 10 + g * 12, { sp: [1, 3], up: 2 + g * .4, spread: .6, life: [.9, 1.8], color: col }); st.burstPaper(m, 5 + g * 9, { sp: [1.6, 4], life: 2.4, colors: [0xf0e0b8, 0xd9b36a, (b.it.reward.rgb[0] << 16) | (b.it.reward.rgb[1] << 8) | b.it.reward.rgb[2], 0xffffff] });
        if (g >= 3) run.flash(.1 + g * .05, 460 + g * 100); if (g >= 4) hap(g >= 5 ? [18, 40, 28, 40, 40] : [14, 40, 24]);
      });
      tl.cue(tr - .02, () => { S.card = mkCard(b); S.card.visible = true; S.cardOn = true; if (g >= 3) sfx('reward.achievement'); });
      tl.tw(tr, Q.rise, e => { S.cu = e; }, E.io);
      if (g >= 4) { tl.tw(to - .2, .35, e => { tl.speed = 1 - .5 * e; }, E.io); tl.tw(to + Q.open * .6, .6, e => { tl.speed = .5 + .5 * e; }, E.io); }
      tl.cue(tf, () => { S.phase = 3; sfx('bulk.fly', { g }); });
      tl.tw(tf, Q.fly, e => { S.fly = e; }, E.io);
      tl.cue(te - .04, () => { sfx('bulk.slot', { g }); S.landed = true; });
      tl.tw(te, .9, e => { S.glow = lerp(1, .22, e); S.light = lerp(S.light, 0, e); S.shaft = 1 - e; }, E.out);
      t = tr + Q.rise + Q.hold * .3 + (last ? Q.hold * .7 + Q.fly * .9 : 0);
      run.total = Math.max(run.total, te);
    });
    const tOv = Math.max(run.total + .2, t), tEnd = tOv + 2.0;
    track.key(tOv - .05, prev, prevL, 36, io).key(tOv + 1.5, sph(0, portrait ? 50 : 40, ovD / fitMul * 1.0, [0, .2, 0]), [0, .2, 0], 36, io);
    tl.cue(tOv, () => { sfx('bulk.finale', { g: Math.max.apply(null, B.map((b, k) => gOf(b.it, k))) }); });
    tl.tw(tOv, 1.2, e => { B.forEach(b => { if (b.st.focus) b.st.glow = lerp(b.st.glow, .45, e); }); }, E.io);
    tl.cue(tEnd, () => run.handoff(false)); run.total = tEnd;
  }
  function mkCard(b) { const c = makeCard(cardDesc(b.it), st.theme); c.visible = false; c.traverse(m => { if (m.isMesh) m.castShadow = false; }); st.scene.add(c); b.st.card = c; if (b.it.reward.face) { b.st.dom = run.dom.add(b.it.reward.face); c.children.forEach(m => { m.visible = false; }); } return c; }
  const hwB = (base.kind === 'rect' ? base.dims.w : base.dims.ap * 2) * sb / 2, zfB = (base.kind === 'rect' ? base.dims.d / 2 : base.dims.ap) * sb + .03, rA = new Vector3(), rB = new Vector3(), rimC = { a: rA, b: rB };
  run.post = () => { B.forEach(b => { const S = b.st; if (!S.dom) return; if (!S.card || !S.card.visible) { run.dom.hide(S.dom); return; } let clip = null; if (!S.inTray && !S.fly && S.cu < 1) { const ry = H - base.baseY * sb; rA.set(b.sl.x - hwB, ry, b.sl.z + zfB); rB.set(b.sl.x + hwB, ry, b.sl.z + zfB); clip = rimC; } run.dom.place(S.dom, S.card, st.camera, run.W, run.H, clip, 1); }); };
  /* ---------- حلقة التحديث ---------- */
  const qFace = new Quaternion(), qFlat = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)), qTmp = new Quaternion(), qSpin = new Quaternion(), tmpO = new Object3D(), v1 = new Vector3(), v2 = new Vector3();
  const baseL = { hemi: st.hemi.intensity, key: st.key.intensity };
  run.onFrame = (dt, t) => {
    let active = null; tray.scale.setScalar(Math.tan(rad(st.camera.fov) / 2) / Math.tan(rad(17)));
    B.forEach(b => { const S = b.st; if (S.phase === 1 || S.phase === 2 || (S.phase === 3 && !S.landed)) active = b; });
    const dim = active ? (active.st.t.g >= 4 ? .5 : .66) : 1; const dm = lerp(1, dim, clamp((t - 2.9) / .6));
    if (!calm) { st.hemi.intensity = baseL.hemi * (calm ? 1 : dm); st.key.intensity = baseL.key * dm; }
    B.forEach((b, k) => {
      const S = b.st, m = b.m, g = S.t ? S.t.g : 1;
      let jx = 0, jz = 0, jr = 0; if (!calm && S.rr > 0 && !S.rel) { const a = S.rr * S.rr * (.004 + g * .002); jx = noise1(t * 21 + k, 1) * a; jz = noise1(t * 19 + k, 2) * a * .6; jr = noise1(t * 17 + k, 3) * a; }
      b.rig.position.set(b.sl.x + jx, S.drop * S.drop * 4, b.sl.z + jz); b.rig.rotation.set(0, 0, jr * .6); b.rig.scale.set(1 + S.squash * .06, 1 - S.squash * .1, 1 + S.squash * .06);
      const rat = (!calm && S.rr > 0 && !S.rel) ? Math.max(0, noise1(t * 26 + k, 5)) * rad(.8) * S.rr * S.rr : 0;
      m.lidPivot.rotation.x = -(S.angle + rat); m.lockPivot.rotation.x = -S.lockOut * 1.25; m.setSeam(clamp(S.seam * (1 + noise1(t * 14 + k, 9) * .08), 0, 1)); m.setGems(1.1 + S.gems * 1.5 + S.light * .3);
      b.sh.material.opacity = .8; b.sh.visible = S.drop < .4;
      b.gm.material.opacity = S.glow * .45; b.gm.position.y = H * .99;
      if (S.card && S.card.visible) {
        const c = S.card, u = S.cu;
        if (!S.inTray) {
          const hold = S.phase === 3 || S.fly > 0, eu = E.io(u);
          let px = b.sl.x + Math.sin(u * Math.PI) * .06, py = lerp(H * .42, yTop, E.out(u)) + (u >= 1 && !S.fly ? Math.sin(t * 1.7 + k) * .03 : 0), pz = b.sl.z + lerp(0, .25, eu), sc = lerp(.4, calm ? .9 : (g >= 4 ? 1.5 : 1.25), E.out(u));
          const turns = calm ? 0 : .8 + g * .35;
          tmpO.position.set(px, py, pz); const cp = st.camera.position; tmpO.lookAt(cp.x, Math.max(cp.y * .6, py), cp.z); qFace.copy(tmpO.quaternion);
          qTmp.slerpQuaternions(qFlat, qFace, E.io(clamp(u * 1.25))); qSpin.setFromAxisAngle(up, Math.pow(1 - u, 1.6) * turns * Math.PI * 2); c.quaternion.copy(qSpin).multiply(qTmp);
          if (S.fly > 0) {
            const q = traySlots[b.it.i]; st.camera.updateMatrixWorld(); tray.updateMatrixWorld(true); v1.copy(q.p); tray.localToWorld(v1); const f = E.io(S.fly);
            v2.set(px, py, pz); v2.lerp(v1, f); px = v2.x; py = v2.y + Math.sin(f * Math.PI) * .45; pz = v2.z; sc = lerp(sc, q.s, E.in(S.fly));
            c.quaternion.slerp(st.camera.quaternion, E.io(S.fly));
            if (S.fly >= 1 && S.landed) { c.removeFromParent(); tray.add(c); c.position.copy(q.p); c.quaternion.identity(); c.scale.setScalar(q.s); c.children[2].visible = false; c.children[0].material.depthTest = false; c.children[0].renderOrder = 21; S.inTray = true; return; }
          }
          c.position.set(px, py, pz); c.scale.setScalar(sc);
          const cm = c.userData.mats[0]; cm.emissive.setRGB(b.it.reward.rgb[0] / 255, b.it.reward.rgb[1] / 255, b.it.reward.rgb[2] / 255); cm.emissiveIntensity = .05 + u * .03 * g;
        }
      }
    });
    /* إضاءة داخلية وأعمدة الضوء للصندوق النشط + بقعة تركيز */
    if (active) {
      const b = active, S = b.st, g = S.t.g;
      st.inner.position.set(b.sl.x, H * .8, b.sl.z); st.inner.intensity = S.light * (g >= 3 ? 6 : 4.5) * sb * 1.6; st.inner.color.setRGB(T.light[0] / 255, T.light[1] / 255, T.light[2] / 255);
      const pw = b.m.dims.w * sb * .8, ph = 6;
      [st.pillar, st.pillar2].forEach((p, i) => { p.position.set(b.sl.x, H + ph * .5 - .1, b.sl.z); p.scale.set(pw * (i ? .8 : 1), ph, 1); p.rotation.y = i ? Math.PI / 2 : 0; p.material.opacity = (S.shaft || 0) * (.08 + g * .03); p.material.color.setRGB(T.light[0] / 255, T.light[1] / 255, T.light[2] / 255); });
      st.spot.position.set(b.sl.x - 1, 8, b.sl.z + 3); st.spot.target.position.set(b.sl.x, H * .6, b.sl.z); st.spot.intensity = lerp(st.spot.intensity, g >= 3 ? 38 : 20, .12);
    } else { st.inner.intensity *= .9; st.spot.intensity *= .9; [st.pillar, st.pillar2].forEach(p => { p.material.opacity *= .9; }); }
  };
  run.start0 = () => {};
  if (!o.manual) run.start();
  return { run, abort: () => run.abort(), skip: () => run.skip(), total: run.total, seek: t => run.seek(t) };
}
