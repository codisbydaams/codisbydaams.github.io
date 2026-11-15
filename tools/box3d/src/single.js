/* CODIS-BOX3D v2 — مشهد الصندوق الواحد.
   الإخراج من مستويين منفصلين:
   • مستوى الصندوق n (1..5): المجسّم والخامات ووزن الغطاء (تردد الزنبرك) ولون ضوء البداية.
   • مستوى الكشف lv (1..9، من القيمة الفعلية للجائزة عبر CodisRevealLevels): مدة الترقّب وعدد نبضاته، الإضاءة، الكسوف، الإبطاء، الوميض، الأشعة، القصاصات، دورات البطاقة، والصوت.
   التسلسل: دخول (سقوط بوزن + ضغط) ← تقديم (دوران المنصة) ← ترقّب (نبضات تتسارع، ضوء الدرزة يتحوّل من لون الصندوق إلى لون الجائزة الحقيقي فقط) ←
   تحرّر القفل ← الغطاء يدور على مفصلاته بزنبرك مخمَّد يرتطم بحدّه ويرتد ← الكشف ← البطاقة تخرج من داخل التجويف (مقصوصة بحافته) وتدور إلى وضعية البطل
   (معرّفة بمستطيل شاشة داخل المساحة الآمنة) ← تحليق ← تهبط في بطاقة النتيجة الحقيقية (Runner.handoff). لا خداع: لا لون ولا شدة أعلى من مستوى الجائزة الفعلية. */
import { Group, Vector3, Quaternion, Euler, Color } from 'three';
import { Runner } from './runner.js';
import { buildBox, instantiate, Lib, TINT } from './models.js';
import { makeCard } from './card.js';
import { E, clamp, lerp, noise1, rad, spring } from './util.js';

/* جدول المستويات التسعة */
const LV = [null];
for (let l = 1; l <= 9; l++) LV.push({
  ant: [0, .7, .85, 1.0, 1.2, 1.4, 1.7, 2.0, 2.4, 2.9][l], pulses: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5][l], rise: [0, .85, .9, 1.0, 1.1, 1.2, 1.35, 1.5, 1.65, 1.9][l],
  spins: [0, .5, .5, 1, 1, 1, 1.5, 2, 2, 3][l], hold: [0, .7, .75, .85, .95, 1.1, 1.3, 1.5, 1.8, 2.2][l], pres: .5 + l * .045,
  eclipse: l >= 9 ? .78 : l >= 8 ? .62 : l >= 7 ? .45 : 0, slow: l >= 8 ? (l === 9 ? .45 : .6) : 1, flash: l >= 3 ? .06 + l * .045 : 0, rays: l >= 5, shock: l >= 6, confetti: l >= 7,
  beam: .18 + l * .07, sparks: 10 + l * 9, glow: .35 + l * .09,
});
const WEIGHT = [0, .9, 1.0, 1.2, 1.1, 1.3];
export function sceneSeconds(lv, calm) { const L = LV[clamp(lv | 0, 1, 9)]; return calm ? 2.8 : 1.0 + L.pres + L.ant + .4 + L.rise + L.hold + (L.slow < 1 ? .8 : 0); }
const sph = (az, el, d, l) => { const a = rad(az), e = rad(el); return [l[0] + d * Math.sin(a) * Math.cos(e), l[1] + d * Math.sin(e), l[2] + d * Math.cos(a) * Math.cos(e)]; };

export function playSingle(o) {
  const lv = clamp(o.lv | 0, 1, 9), L = LV[lv], n = clamp(o.n | 0, 1, 5), calm = !!o.calm, T = TINT[n];
  const run = new Runner({ host: o.host, theme: o.theme, tier: o.tier, hooks: o.hooks, preserve: o.preserve });
  const st = run.stage, tl = run.tl, lib = new Lib(run.q.texS);
  const model = instantiate(buildBox(n, lib));
  run.extra.push(() => { try { model.dispose(); lib.disposeAll(); } catch (e) {} });
  const s = clamp(2.4 / Math.max(model.dims.w, model.dims.d, model.top * .95), .55, 1.15);
  const rig = new Group(); rig.add(model.root); model.root.scale.setScalar(s); model.root.position.y = -model.baseY * s; st.scene.add(rig);
  const H = model.dims.h * s, LID = model.dims.lidH * s, cy = H * .5 + LID * .25;
  st.contact.scale.set(model.dims.w * s * 1.6, model.dims.d * s * 1.6, 1); if (n === 5) st.contact.scale.set(3.4, 3.4, 1);
  st.key.target.position.set(0, H * .5, 0); st.spot.position.set(.6, 9, 3.2); st.spot.target.position.set(0, H * .6, 0);
  const rl = (o.reward.rgb || [255, 214, 120]), r2 = o.reward.rgb2 || rl;
  const cBox = new Color(`rgb(${T.light[0]},${T.light[1]},${T.light[2]})`), cRew = new Color(`rgb(${rl[0]},${rl[1]},${rl[2]})`), cRew2 = new Color(`rgb(${r2[0]},${r2[1]},${r2[2]})`), cEdge = new Color(`rgb(${T.edge[0]},${T.edge[1]},${T.edge[2]})`);
  const cMix = new Color(), cSeam = new Color(), rewHex = cRew.getHex();
  const base = { hemi: st.hemi.intensity, key: st.key.intensity, rim: st.rim.intensity, fill: st.fill.intensity, env: st.scene.environmentIntensity };
  const AMAX = rad(n === 2 ? 102 : n === 5 ? 112 : 106);
  const S = { angle: 0, seam: 0, light: 0, charge: 0, jolt: 0, cu: 0, cardOn: false, yaw: 0, hold: 0, drop: 0, squash: 0, lockOut: 0, halo: 0, rays: 0, rel: false, mixC: 0, beam: 0, pool: 0, eclipse: 0 };
  /* البطاقة: الوجه الحقيقي (DOM) + جسم ثلاثي الأبعاد للحافة والظل */
  const domCard = o.reward.face ? run.dom.add(o.reward.face) : null, ar = domCard ? domCard.ar : 1.25;
  const card = makeCard({ title: o.reward.title, sub: o.reward.sub, tag: o.reward.tag, rgb: rl, font: o.reward.font }, st.theme, ar); card.visible = false; st.scene.add(card);
  if (domCard) { card.userData.face.visible = false; card.children[1].visible = false; }
  run.extra.push(() => { try { card.userData.texs.forEach(t => t.dispose()); card.userData.mats.forEach(m => m.dispose()); } catch (e) {} });
  if (domCard) run.landables.push({ key: '0', obj: card, dom: domCard, ar });
  const rimA = new Vector3(), rimB = new Vector3(), clipObj = { a: rimA, b: rimB }, hw = (model.kind === 'rect' ? model.dims.w : model.dims.ap * 2) * s / 2, zf = (model.kind === 'rect' ? model.dims.d / 2 : model.dims.ap) * s + .03;
  const sfx = (a, b) => run.sfx(a, Object.assign({ n, lv }, b || {})), hap = p => run.haptic(p);

  /* ---------- مواقيت ---------- */
  const enter = calm ? .45 : 1.0, tA = enter + (calm ? 0 : L.pres), tL = tA + (calm ? .15 : L.ant), tO = tL + (calm ? .1 : .16), tRv = tO + .12, tR = tO + (calm ? .2 : .26), rise = calm ? .75 : L.rise, tH = tR + rise, tEnd = tH + (calm ? .55 : L.hold);
  run.total = tEnd;
  const wgt = WEIGHT[n], wn = 10.5 / wgt, zz = .36, wd = wn * Math.sqrt(1 - zz * zz), tStop = tO + Math.PI / wd * .62;

  /* ---------- الكاميرا ---------- */
  const look0 = [0, cy, 0], lookOpen = [0, H + LID * .2, 0], lookHero = [0, H + 1.05 * Math.max(.9, s), 0];
  const track = run.track, io = E.io;
  if (calm) track.key(0, sph(10, 20, 8.6, look0), look0, 34, io).key(tO, sph(4, 22, 8.2, lookOpen), lookOpen, 34, io).key(tEnd, sph(0, 16, 8.4, lookHero), lookHero, 34, io);
  else {
    const low = lv >= 6;
    track.key(0, sph(low ? 42 : 30, low ? 10 : 30, 12.5, look0), look0, 38, io);
    track.key(enter, sph(low ? 22 : 16, low ? 16 : 22, 9.2, look0), look0, 34, E.out);
    track.key(tA, sph(-10, 20, 8.6, look0), look0, 34, io);
    track.key(tL, sph(lv >= 5 ? -2 : 4, 24, lv >= 7 ? 6.4 : 7.0, [0, cy + LID * .3, 0]), [0, cy + LID * .3, 0], lv >= 7 ? 31 : 33, E.in);
    track.key(tO + .5, sph(0, 20, lv >= 7 ? 8.6 : 7.8, lookOpen), lookOpen, lv >= 7 ? 30 : 33, E.out);
    track.key(tH, sph(lv >= 5 ? 5 : 0, 14, 8.8, lookHero), lookHero, 34, io);
    track.key(tEnd, sph(lv >= 5 ? -3 : 0, 12, 8.4, lookHero), lookHero, 33, E.lin);
  }

  /* ---------- دخول ---------- */
  run.blackEl.style.opacity = '1'; tl.tw(0, calm ? .4 : .5, e => { run.blackEl.style.opacity = String(1 - e); }, E.out);
  tl.cue(0, () => sfx('chest.touch'));
  if (!calm) {
    tl.tw(0, .58, e => { S.drop = 1 - e; }, E.in);
    tl.tw(.58, .4, (e, p) => { S.squash = Math.sin(p * Math.PI) * Math.exp(-2.4 * p); }, E.lin);
    tl.cue(.56, () => { sfx('chest.drop', { g: 1 }); run.shake(.05 + wgt * .03); hap([12]); st.emitSparks(new Vector3(0, .05, 0), 22, { sp: [.8, 2.4], up: .4, spread: Math.max(1.2, model.dims.w * s), life: [.4, .9], color: 0xd9c4a0, size: .035, grav: 3 }); });
    tl.tw(0, enter + L.pres, e => { S.yaw = lerp(-.55, .14, e); }, E.io);
    tl.cue(enter + .05, () => sfx('chest.shift'));
  }
  /* ---------- ترقّب ---------- */
  if (!calm) {
    tl.cue(tA, () => sfx('chest.charge', { dur: L.ant }));
    tl.tw(tA, L.ant, e => { S.charge = e; S.seam = .15 + e * e * .8; S.light = e * e * (.4 + lv * .08); S.mixC = E.io(clamp(e * 1.15)); S.yaw = lerp(.14, 0, E.io(Math.min(1, e * 2))); }, E.lin);
    for (let i = 0; i < L.pulses; i++) {
      const f = Math.pow((i + 1) / (L.pulses + 1), .75), tp = tA + L.ant * f, k = (i + 1) / L.pulses;
      tl.cue(tp, () => { S.jolt = 1; S.joltK = .5 + k * .7; sfx('chest.rattle', { i, of: L.pulses }); run.shake(.012 + k * .02 * wgt); hap([6 + i * 2]); st.emitSparks(new Vector3((Math.random() - .5) * hw * 1.6, H + .02, zf - .05), 4 + i * 3 + lv, { sp: [.4, 1.2], up: .9, spread: .3, life: [.4, .9], color: cSeam.clone(), size: .04 }); });
    }
    if (L.eclipse) {
      tl.tw(tA + L.ant * .35, L.ant * .6, e => { S.eclipse = e * L.eclipse; }, E.io);
      tl.tw(tRv, .9, e => { S.eclipse = L.eclipse * (1 - e); }, E.out);
    }
    if (L.slow < 1) { tl.tw(tL - .2, .3, e => { tl.speed = lerp(1, L.slow, e); }, E.io); tl.tw(tRv + .25, .7, e => { tl.speed = lerp(L.slow, 1, e); }, E.io); }
  } else { tl.tw(0, .5, e => { S.light = .4 * e; S.mixC = e; S.seam = .3 * e; }, E.lin); }
  /* ---------- القفل والغطاء ---------- */
  tl.cue(tL, () => { S.rel = true; sfx('chest.unlatch'); hap([10]); const lp = new Vector3(0, H - .1 * s, zf + .05); st.emitSparks(lp, 8 + lv, { sp: [1, 2.4], up: .6, spread: .1, life: [.3, .7], color: 0xffe2b0, size: .03 }); });
  tl.tw(tL, .32, e => { S.lockOut = e; }, E.outBack);
  tl.tw(tL, tO - tL, e => { S.angle = rad(3) * e; }, E.out);
  if (calm) tl.tw(tO, .55, e => { S.angle = lerp(rad(3), AMAX, e); }, E.outq);
  else {
    tl.tw(tO, 2.4, (e, p) => { const tt = p * 2.4; let x = spring(tt, zz, wn) * (AMAX - rad(3)) + rad(3); if (x > AMAX) x = AMAX - (x - AMAX) * .35; S.angle = x; }, E.lin);
    tl.cue(tO, () => sfx('chest.lid', { w: wgt }));
    tl.cue(tStop, () => { sfx('chest.lidstop', { w: wgt }); run.shake(.02 * wgt); });
  }
  /* ---------- الكشف ---------- */
  tl.cue(tRv, () => {
    sfx('chest.reveal'); if (calm) return;
    run.shake(.02 + lv * .012); hap(lv >= 7 ? [18, 40, 28, 40, 50] : lv >= 4 ? [14, 30, 20] : [12]);
    const m = new Vector3(0, H * .95, 0);
    st.emitSparks(m, L.sparks, { sp: [1.4, 3.2 + lv * .25], up: 2.2 + lv * .3, spread: hw * 1.2, life: [.7, 1.4 + lv * .08], color: cRew.clone(), size: .045 + lv * .004 });
    st.emitSparks(m, Math.round(L.sparks * .5), { sp: [.8, 2], up: 1.6, spread: hw, life: [.5, 1.1], color: cMix.clone(), size: .035 });
    if (L.flash) run.flash(L.flash, 380 + lv * 70, `rgb(${Math.round(255 * .6 + rl[0] * .4)},${Math.round(255 * .6 + rl[1] * .4)},${Math.round(255 * .6 + rl[2] * .4)})`);
    if (L.shock) { st.shock.userData.t0 = tl.t; st.shock.userData.on = true; }
    if (L.confetti) st.burstPaper(m, 10 + (lv - 6) * 12, { sp: [2, 4.5], colors: [rewHex, cRew2.getHex(), 0xf3e2b8], life: 2.8 });
  });
  tl.tw(tRv - .05, .7, e => { S.light = lerp(S.light, 1.4 + lv * .32, e); S.beam = e; S.pool = e; S.seam = Math.max(0, S.seam * (1 - e)); }, E.out);
  /* ---------- البطاقة ---------- */
  tl.cue(tR - .02, () => { card.visible = true; S.cardOn = true; sfx('chest.rise', { dur: rise }); });
  tl.tw(tR, rise, e => { S.cu = e; }, E.lin);
  tl.tw(tR, rise, e => { S.halo = e; }, E.out);
  if (!calm) { const turns = Math.round(L.spins * 2); for (let i = 0; i < turns; i++) { const f = .35 + .55 * Math.pow((i + .5) / turns, 1.3); tl.cue(tR + rise * f, () => sfx('chest.spin', { i, of: turns })); } }
  tl.cue(tH - .06, () => { sfx('chest.settle'); hap([8]); });
  tl.tw(tH, tEnd - tH, (e, p) => { S.hold = p; }, E.lin);
  if (lv >= 6 && !calm) tl.cue(tH + .12, () => { sfx('chest.rare'); const cp = card.position.clone(); st.emitSparks(cp, 18 + lv * 4, { sp: [.5, 1.6], up: .2, spread: .8, life: [.8, 1.6], color: cRew.clone(), size: .04, grav: .3, drag: 2.2 }); });
  tl.tw(tH, tEnd - tH, e => { S.beam = 1 - e * .6; }, E.lin);
  tl.cue(tEnd, () => { run.handoff(false); });

  /* ---------- وضعية البطل: مستطيل شاشة داخل المساحة الآمنة ---------- */
  const heroRect = () => { const W = run.W, Hh = run.H, top = run.safe.t + 18, bot = Hh - run.safe.b - 18, usable = bot - top, w = Math.min(W * .62, usable * .5 / ar, 330), h = w * ar, cyy = top + usable * .4; return { x: (W - w) / 2, y: cyy - h / 2, w, h }; };
  const pA = new Vector3(), qA = new Quaternion(), sA = new Vector3(), pB = new Vector3(), qB = new Quaternion(), sB = new Vector3(), qFlat = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)), qSpin = new Quaternion(), up = new Vector3(0, 1, 0), tmp = new Vector3(), boxC = new Vector3();
  run.post = () => { if (!domCard) return; if (!S.cardOn) { run.dom.hide(domCard); return; } const ry = H - model.baseY * s; rimA.set(-hw, ry, zf); rimB.set(hw, ry, zf); run.dom.place(domCard, card, st.camera, run.W, run.H, S.cu < .42 ? clipObj : null, 1, S.cardOn ? (S.hold ? .35 + .25 * Math.sin(run.tAbs * 1.3) : .55) : 0); };
  run.onFrame = (dt, t) => {
    const ta = run.tAbs || t; let jx = 0, jz = 0, jr = 0;
    S.jolt = Math.max(0, S.jolt - dt * 4.5);
    if (!calm && !S.rel && S.charge > 0) { const a = (S.charge * S.charge * .006 + S.jolt * .03 * (S.joltK || 1)) * wgt; jx = noise1(t * 23, 1) * a; jz = noise1(t * 19, 2) * a * .6; jr = noise1(t * 17, 3) * a * 1.3; }
    const sq = S.squash || 0, drop = S.drop;
    rig.position.set(jx, drop * drop * 3.2 + S.jolt * .04 * (S.joltK || 1), jz); rig.rotation.set(0, S.yaw, jr * .6);
    rig.scale.set(1 + sq * .055, 1 - sq * .09, 1 + sq * .055);
    const lidKick = (!S.rel && S.jolt > 0) ? rad(2.6) * S.jolt * (S.joltK || 1) : 0;
    model.lidPivot.rotation.x = -(S.angle + lidKick);
    model.lockPivot.rotation.x = -S.lockOut * 1.3;
    cMix.copy(cBox).lerp(cRew, S.mixC); cSeam.copy(cEdge).lerp(cRew, S.mixC);
    model.setSeamColor(cSeam); model.setSeam(clamp((S.seam + S.jolt * .5) * (1 + noise1(t * 14, 9) * .1), 0, 1)); model.setGems(.9 + S.charge * 1.4 + S.light * .3 + S.jolt);
    st.inner.color.copy(cMix); st.inner.position.set(0, H * .78, 0); st.inner.intensity = S.light * (lv >= 5 ? 7 : 5) * s;
    st.contact.material.opacity = .85 * (1 - clamp(drop * 1.4)); st.contact.position.y = (n === 5 ? -.16 * s : 0) + .004;
    /* كسوف: الإضاءة العامة تخفت ويبقى تركيز على الصندوق */
    const ec = S.eclipse, mm = 1 - ec; st.hemi.intensity = base.hemi * mm; st.key.intensity = base.key * (1 - ec * .7); st.rim.intensity = base.rim * mm; st.fill.intensity = base.fill * mm; st.scene.environmentIntensity = base.env * (1 - ec * .5); st.spot.intensity = 70 * ec; st.spot.color.copy(cMix);
    /* عمود الضوء + بركة الأرض */
    const bm = st.beam.material.uniforms; bm.uColor.value.copy(cMix).lerp(cRew, .6); bm.uI.value = S.beam * L.beam * (1 - S.hold * .35); st.beam.position.set(0, H * .82, 0); st.beam.scale.set(hw * .95, 6.5, (model.kind === 'rect' ? model.dims.d : model.dims.ap * 2) * s * .42);
    st.pool.material.color.copy(cRew); st.pool.material.opacity = S.pool * (.18 + lv * .03); st.pool.scale.setScalar(hw * 2.4);
    if (S.cardOn) {
      const u = S.cu, cam = st.camera;
      /* المرحلة A: من قاع التجويف (مستلقية) إلى فوق الحافة بقليل */
      const ua = clamp(u / .38), ea = E.out(ua), ub = clamp((u - .3) / .7), eb = E.io(ub);
      pA.set(0, lerp(H * .32, H + .32, ea), lerp(0, .04, ea)); const sIn = Math.min(hw * 1.15, .95) * lerp(.85, 1, ea);
      qA.copy(qFlat).slerp(qTmpFace(card, pA, cam), ea * .55); sA.set(sIn, sIn, sIn);
      /* المرحلة B: وضعية البطل المعرَّفة بمستطيل الشاشة */
      boxC.set(0, H * .6, 0); const D = Math.max(1.6, tmp.copy(boxC).applyMatrix4(cam.matrixWorldInverse).z * -1 * .58);
      run.poseForRect(heroRect(), D, ar, pB, qB, sB);
      const hov = S.hold ? Math.sin(ta * 1.6) * .018 : 0;
      card.position.copy(pA).lerp(pB, eb); card.position.y += Math.sin(eb * Math.PI) * .22 + hov;
      card.quaternion.copy(qA).slerp(qB, eb);
      const spin = calm ? 0 : Math.pow(1 - eb, 1.7) * L.spins * Math.PI * 2 * (ub > 0 ? 1 : 0); qSpin.setFromAxisAngle(up, spin); card.quaternion.multiply(qSpin);
      if (S.hold) { qSpin.setFromAxisAngle(up, Math.sin(ta * 1.1) * .06); card.quaternion.multiply(qSpin); }
      card.scale.copy(sA).lerp(sB, eb);
      st.halo.position.copy(card.position); st.halo.quaternion.copy(cam.quaternion); st.halo.translateZ(-.08); st.halo.scale.setScalar(sB.x * (1.6 + lv * .14) * S.halo); st.halo.material.opacity = S.halo * L.glow * .5; st.halo.material.color.copy(cRew);
      if (L.rays && !calm) { st.raysM.position.copy(card.position); st.raysM.quaternion.copy(cam.quaternion); st.raysM.translateZ(-.12); st.raysM.rotateZ(ta * .22); st.raysM.scale.setScalar(sB.x * (2.6 + lv * .25) * S.halo); st.raysM.material.opacity = S.halo * (.05 + (lv - 4) * .03); st.raysM.material.color.copy(cRew); }
      const em = card.userData.mats[2]; em.emissiveIntensity = .2 + S.halo * .5;
    }
    if (st.shock.userData.on) { const p = clamp((tl.t - st.shock.userData.t0) / 1.0); st.shock.scale.setScalar(.6 + p * 4.2 * Math.max(1, s)); st.shock.material.opacity = (1 - p) * .6; st.shock.material.color.copy(cRew); if (p >= 1) st.shock.userData.on = false; }
  };
  if (!o.manual) run.start();
  return { run, abort: () => run.abort(), skip: () => run.skip(), total: tEnd, seek: t => run.seek(t) };
}
/* اتجاه يواجه الكاميرا من نقطة (مساعد للمرحلة A) */
const _q = new Quaternion(), _o = new Group();
function qTmpFace(card, p, cam) { _o.position.copy(p); _o.lookAt(cam.position.x, Math.max(cam.position.y * .5, p.y), cam.position.z); _q.copy(_o.quaternion); return _q; }
