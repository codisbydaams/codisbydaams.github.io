/* CODIS-BOX3D — سيناريو الصندوق الواحد (إخراج مستقل): دخول ← تقديم ← ترقّب ← فتح بمفصلات حقيقية ← خروج المكافأة ← لقطة البطل ← تسليم.
   مستوى الصندوق (n) يحدد المجسّم والخامات والألوان؛ مستوى الكشف (lv→g من قيمة الجائزة الفعلية) يحدد الإخراج: مدد الترقّب، حركة الكاميرا، الإضاءة، الإبطاء، الصدمة. */
import { Group, Vector3, Quaternion, Euler, Object3D, Color } from 'three';
import { Runner } from './runner.js';
import { buildBox, instantiate, Lib, TINT } from './models.js';
import { makeCard } from './card.js';
import { E, clamp, lerp, sstep, noise1, rad } from './util.js';

/* مدد المجموعات (ثانية): enter دخول · pres تقديم · ant ترقّب · open فتح · rise خروج المكافأة · hold لقطة البطل */
const G = [null,
  { enter: 1.2, pres: .55, ant: .95, open: .95, rise: 1.15, hold: .75, turns: 1.0 },
  { enter: 1.35, pres: .85, ant: 1.4, open: 1.05, rise: 1.35, hold: .95, turns: 1.4 },
  { enter: 1.5, pres: 1.2, ant: 2.1, open: 1.25, rise: 1.7, hold: 1.25, turns: 1.9 },
  { enter: 1.6, pres: 1.5, ant: 2.9, open: 1.7, rise: 2.2, hold: 1.7, turns: 2.4 },
  { enter: 1.8, pres: 1.9, ant: 3.8, open: 2.2, rise: 2.8, hold: 2.3, turns: 3.0 }];

export function sceneSeconds(g, calm) { const D = G[g]; return calm ? 3.2 : D.enter + D.pres + D.ant + D.open * .55 + D.rise + D.hold; }
const sph = (az, el, d, l) => { const a = rad(az), e = rad(el); return [l[0] + d * Math.sin(a) * Math.cos(e), l[1] + d * Math.sin(e), l[2] + d * Math.cos(a) * Math.cos(e)]; };

export function playSingle(o) {
  const g = clamp(o.g | 0, 1, 5), D = G[g], n = clamp(o.n | 0, 1, 5), calm = !!o.calm, T = TINT[n];
  const run = new Runner({ host: o.host, theme: o.theme, low: o.low, hooks: o.hooks, preserve: o.preserve });
  const st = run.stage, tl = run.tl, lib = new Lib();
  run.extra.push(() => { try { lib.disposeAll(); } catch (e) {} });
  const model = instantiate(buildBox(n, lib));
  const s = clamp(2.5 / Math.max(model.dims.w, model.dims.d, model.top * .95), .55, 1.15);
  const rig = new Group(); rig.add(model.root); model.root.scale.setScalar(s); model.root.position.y = -model.baseY * s; st.scene.add(rig);
  const H = model.dims.h * s, LID = model.dims.lidH * s, cy = H * .55 + LID * .3, yF = H + LID * .5 + 1.2 * Math.max(.9, s);
  st.contact.scale.set(model.dims.w * s * 1.55, model.dims.d * s * 1.55, 1);
  if (n === 5) st.contact.scale.set(3.3, 3.3, 1);
  st.key.target.position.set(0, H * .5, 0); st.spot.position.set(0, 9, 3); st.spot.target.position.set(0, H, 0);
  const lc = new Color(`rgb(${T.light[0]},${T.light[1]},${T.light[2]})`); st.inner.color.copy(lc);
  const rl = o.reward.rgb || [255, 214, 120], rc = (rl[0] << 16) | (rl[1] << 8) | rl[2];
  const base = { hemi: st.hemi.intensity, key: st.key.intensity, rim: st.rim.intensity, env: st.scene.environmentIntensity };
  const AMAX = rad(n === 2 ? 100 : n === 5 ? 112 : 108);
  const S = { angle: 0, rattle: 0, seam: 0, light: 0, shaft: 0, cu: 0, cardOn: false, yaw: 0, hold: 0, dropY: 0, drop: 0, lockOut: 0, halo: 0, rays: 0, rel: false, rr: 0 };
  const card = makeCard({ title: o.reward.title, sub: o.reward.sub, tag: o.reward.tag, rgb: rl, font: o.reward.font }, st.theme); card.visible = false; st.scene.add(card);
  /* البطاقة الفعلية للجائزة (DOM حقيقي) تحل محل الرسم البديل إن توفر وجهها */
  const domCard = o.reward.face ? run.dom.add(o.reward.face) : null; if (domCard) card.userData.face.visible = false, card.children.forEach(c => { c.visible = false; });
  const rimA = new Vector3(), rimB = new Vector3(), clipObj = { a: rimA, b: rimB }, hw = (model.kind === 'rect' ? model.dims.w : model.dims.ap * 2) * s / 2, zf = (model.kind === 'rect' ? model.dims.d / 2 : model.dims.ap) * s + .03;
  run.extra.push(() => { try { card.userData.texs.forEach(t => t.dispose()); card.userData.mats.forEach(m => m.dispose()); } catch (e) {} });
  const sfx = (a, b) => { try { if (o.hooks.sfx) o.hooks.sfx(a, b); } catch (e) {} };
  const hap = p => { try { if (o.hooks.haptic) o.hooks.haptic(p); } catch (e) {} };
  const mouth = () => new Vector3(0, H * .92, .0);
  const qFace = new Quaternion(), qFlat = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0)), qTmp = new Quaternion(), qSpin = new Quaternion(), up = new Vector3(0, 1, 0), tmpO = new Object3D();

  /* ---------- مواقيت ---------- */
  const enter = calm ? .5 : D.enter, tA = enter + (calm ? 0 : D.pres), tL = tA + (calm ? 0 : D.ant), tO = tL, tR = tO + D.open * (calm ? .6 : .55), tH = tR + (calm ? 1.0 : D.rise), tEnd = tH + (calm ? .7 : D.hold);
  run.total = tEnd;

  /* ---------- الكاميرا ---------- */
  const look0 = [0, cy, 0], lookTop = [0, yF * .86, 0];
  const track = run.track, io = E.io;
  if (calm) {
    track.key(0, sph(14, 22, 8.2, look0), look0, 34, io).key(tEnd, sph(8, 20, 7.6, look0), look0, 34, io);
  } else {
    const lowCrane = g >= 3;
    track.key(0, sph(lowCrane ? 55 : 38, lowCrane ? 7 : 42, lowCrane ? 11 : 14, look0), look0, lowCrane ? 38 : 42, io);
    track.key(enter, sph(lowCrane ? 24 : 18, lowCrane ? 16 : 25, 8.4, look0), look0, 34, E.out);
    track.key(tA, sph(g >= 2 ? -16 : 10, 20, 7.6, look0), look0, 34, io);
    track.key(tL - .25, sph(g >= 3 ? -3 : 5, 24, g >= 4 ? 6.0 : 6.5, [0, cy + LID * .3, 0]), [0, cy + LID * .3, 0], 33, io);
    track.key(tO + D.open * .9, sph(0, 17, g >= 4 ? 8.6 : 6.4, [0, cy + .45, 0]), [0, cy + .45, 0], g >= 4 ? 26 : 33, io);
    track.key(tH, sph(g >= 3 ? 5 : 0, 10, 6.6, lookTop), lookTop, 34, io);
    track.key(tEnd, sph(g >= 3 ? -4 : 0, 8, 5.4, lookTop), lookTop, 32, E.lin);
  }

  /* ---------- دخول: الفلاش الأسود يتلاشى، الصندوق يسقط على المنصّة بضغط ---------- */
  run.blackEl.style.opacity = '1';
  tl.tw(0, calm ? .5 : .7, e => { run.blackEl.style.opacity = String(1 - e); }, E.out);
  if (!calm) {
    tl.tw(0, .62, e => { S.drop = 1 - e; }, E.in);
    tl.tw(.62, .34, (e, p) => { S.squash = Math.sin(p * Math.PI) * Math.exp(-2.2 * p); }, E.lin);
    tl.cue(.6, () => { sfx('box.thud', { n, g: .8 }); run.shake(.05 + g * .01); st.emitSparks(new Vector3(0, .1, 0), 14 + g * 4, { sp: [.8, 2.2], up: .6, spread: Math.max(1.2, model.dims.w * s * .9), life: [.5, 1.1], color: 0xf1dfb0 }); st.burstPaper(new Vector3(0, .1, 0), 4 + g * 2, { sp: [1, 2.4], life: 1.8 }); });
    tl.tw(enter - .1, D.pres + .1, e => { S.yaw = lerp(-.55, .22, e); }, E.io);
    tl.tw(.0, enter, e => { if (e < 1) S.yaw = lerp(-.9, -.55, e); }, E.out);
    tl.tw(tA, .0001, () => {}, E.lin);
  }
  tl.tw(tA, calm ? .001 : D.ant, (e) => { S.rr = e; }, E.lin);
  /* ---------- ترقّب: درزة تضيء، اهتزاز يتصاعد، غبار/شرر، صوت شحن ---------- */
  if (!calm) {
    tl.cue(tA, () => { sfx('box.charge', { lv: g, dur: D.ant, n }); });
    tl.cue(tA + .3, () => { sfx('box.creak', { n }); hap([8]); });
    tl.tw(tA, D.ant, e => { S.seam = e * e * .95; S.light = e * e * (.6 + g * .12); S.gems = e; }, E.lin);
    tl.tw(tA + D.pres * 0, D.ant, e => { S.yaw = lerp(.22, 0, E.io(Math.min(1, e * 2.2))); }, E.lin);
    const nb = Math.max(4, Math.round(D.ant * 4));
    for (let i = 0; i < nb; i++) { const t = tA + (i + 1) * D.ant / (nb + 1); tl.cue(t, () => { st.emitSparks(new Vector3((Math.random() - .5) * model.dims.w * s * .8, H * .96, (Math.random() - .5) * model.dims.d * s * .5), 2 + g, { sp: [.3, .9], up: .9, spread: .2, life: [.7, 1.3], color: (T.edge[0] << 16) | (T.edge[1] << 8) | T.edge[2] }); }); }
    /* كسوف: المستويات العليا تخفت الإضاءة قبيل الفتح فتبقى بقعة ضوء على الصندوق */
    if (g >= 4) {
      const k = g === 5 ? .78 : .5;
      tl.tw(tA + D.ant * .5, D.ant * .45, e => { const m = 1 - k * e; st.hemi.intensity = base.hemi * m; st.key.intensity = base.key * m; st.rim.intensity = base.rim * m; st.scene.environmentIntensity = base.env * (1 - .6 * e); st.spot.intensity = 60 * e * (g === 5 ? 1.3 : .8); }, E.io);
      tl.tw(tO, .5, e => { const m = 1 - k * (1 - e); st.hemi.intensity = base.hemi * m; st.key.intensity = base.key * m; st.rim.intensity = base.rim * m; st.scene.environmentIntensity = base.env * (1 - .6 * (1 - e)); st.spot.intensity = 60 * (1 - e * .6); }, E.out);
    }
    if (g >= 4) { tl.tw(tO - .25, .35, e => { tl.speed = 1 - .58 * e; }, E.io); tl.tw(tO + D.open * .55, .7, e => { tl.speed = .42 + .58 * e; }, E.io); }
  } else {
    tl.tw(tA, .001, () => { S.light = .5; }, E.lin);
  }
  /* ---------- تحرير القفل ثم الفتح بالمفصلات ---------- */
  const tLock = tL - (calm ? 0 : .4);
  tl.cue(tLock, () => { S.rel = true; sfx(g >= 3 ? 'box.release' : 'box.unlock', { lv: g, n, g: g === 1 ? .55 : .85 }); hap(g >= 4 ? [14, 30, 20] : [10]); });
  tl.tw(tLock, calm ? .3 : .38, e => { S.lockOut = e; }, E.out);
  tl.tw(tLock, calm ? .3 : .4, e => { S.angle = lerp(0, rad(2.6), e); }, E.io);
  tl.tw(tO, D.open, e => { S.angle = lerp(rad(2.6), AMAX, e); }, g >= 4 ? E.io : E.io);
  tl.tw(tO + D.open, .9, (e, p) => { S.angle = AMAX + AMAX * .035 * Math.exp(-6.5 * p) * Math.sin(p * 17); }, E.lin);
  tl.cue(tO + .05, () => {
    sfx('box.reveal', { lv: g, n }); if (!calm) { run.shake(.02 + g * .018); }
    const m = mouth(); const col = (T.light[0] << 16) | (T.light[1] << 8) | T.light[2];
    if (!calm) { st.emitSparks(m, 18 + g * 16, { sp: [1.2, 3.4], up: 2.4 + g * .5, spread: model.dims.w * s * .6, life: [1, 2], color: col }); st.burstPaper(m, 8 + g * 12, { sp: [2, 4.5], colors: g >= 3 ? [0xf0e0b8, 0xd9b36a, rc, 0xffffff] : [0xf0e0b8, 0xd9b36a, 0xc74a36, 0x2f6c9f], life: 2.8 }); }
    if (g >= 3 && !calm) run.flash(.14 + g * .06, 520 + g * 120);
    if (g >= 4) hap(g >= 5 ? [18, 40, 28, 40, 40] : [14, 40, 24]);
  });
  tl.tw(tO, D.open * .8, e => { S.light = lerp(S.light, 1.6 + g * .5, e); S.shaft = e; S.seam = Math.max(0, S.seam * (1 - e)); }, E.out);
  if (g >= 4 && !calm) tl.cue(tO + D.open * .6, () => { st.shock.userData.t0 = tl.t; st.shock.userData.on = true; run.shake(.05); });
  /* ---------- خروج المكافأة ---------- */
  const spot = (calm ? 0 : 1);
  tl.cue(tR - .02, () => { card.visible = true; S.cardOn = true; });
  tl.tw(tR, tH - tR, e => { S.cu = e; }, E.io);
  tl.cue(tR + .3, () => { if (g >= 3 && !calm) sfx('reward.achievement'); if (g >= 4) hap([20, 30]); });
  tl.tw(tR, tH - tR, e => { S.halo = e; }, E.out);
  tl.tw(tH, tEnd - tH, (e, p) => { S.hold = p; }, E.lin);
  tl.cue(tH + .1, () => { if (!calm) { const m = new Vector3(0, yF, 0); st.emitSparks(m, 10 + g * 12, { sp: [.6, 2], up: .6, spread: 1.4, life: [1.2, 2.4], color: rc }); if (g >= 3) st.burstPaper(m, 10 + g * 6, { sp: [1.2, 3], colors: [rc, 0xffffff, 0xf0e0b8], life: 3 }); } });
  tl.cue(tEnd, () => { run.handoff(false); });

  /* ---------- حلقة التحديث المستمرة: تُطبّق الحالة S على المشهد ---------- */
  const mouthPos = new Vector3(), camP = new Vector3();
  run.post = () => { if (!domCard) return; if (!S.cardOn) { run.dom.hide(domCard); return; } const ry = H - model.baseY * s; rimA.set(-hw, ry, zf); rimB.set(hw, ry, zf); run.dom.place(domCard, card, st.camera, run.W, run.H, S.cu < 1 ? clipObj : null, 1); };
  run.onFrame = (dt, t) => {
    const rr = S.rr; let jx = 0, jz = 0, jr = 0;
    if (!calm && !S.rel && rr > 0) { const a = rr * rr * (.005 + g * .0025); jx = noise1(t * 21, 1) * a; jz = noise1(t * 19, 2) * a * .6; jr = noise1(t * 17, 3) * a * 1.2; }
    const sq = S.squash || 0, drop = S.drop;
    rig.position.set(jx, drop * drop * 3.4, jz); rig.rotation.set(0, S.yaw, jr * .6);
    rig.scale.set(1 + sq * .06, 1 - sq * .1, 1 + sq * .06);
    const lidRattle = (!calm && !S.rel && rr > 0) ? noise1(t * 26, 5) * rad(.9) * rr * rr * (.6 + g * .2) : 0;
    model.lidPivot.rotation.x = -(S.angle + Math.max(0, lidRattle));
    model.lockPivot.rotation.x = -S.lockOut * 1.25; model.lockPivot.position.z += 0;
    const fl = 1 + noise1(t * 14, 9) * .08 * S.seam;
    model.setSeam(clamp(S.seam * fl, 0, 1)); model.setGems(1.1 + (S.gems || 0) * 1.6 + S.light * .35);
    mouthPos.set(0, H * .8, 0); st.inner.position.copy(mouthPos); st.inner.intensity = S.light * (g >= 3 ? 7 : 5) * s;
    st.contact.material.opacity = .85 * (1 - clamp(drop * 1.4)); st.contact.position.y = (n === 5 ? -.16 * s + .004 : .004); const cs = 1 + drop * .4; st.contact.scale.z = 1;
    /* أعمدة الضوء */
    const pw = model.dims.w * s * .78, ph = 7;
    [st.pillar, st.pillar2].forEach((p, i) => { p.position.set(0, H + ph * .5 - .1, 0); p.scale.set(pw * (i ? .8 : 1), ph, 1); p.rotation.y = i ? Math.PI / 2 : 0; p.material.opacity = S.shaft * (.10 + g * .035) * (1 - S.hold * .75); p.material.color.setRGB(T.light[0] / 255, T.light[1] / 255, T.light[2] / 255).lerp(new Color(rc), g >= 3 ? .5 : .25); });
    /* بطاقة المكافأة */
    if (S.cardOn) {
      const u = S.cu, eu = E.io(u), cp = st.camera.position;
      const px = Math.sin(u * Math.PI) * .1, py = lerp(H * .42, yF, E.out(u)) + (S.hold ? Math.sin(t * 1.7) * .035 : 0), pz = lerp(0, .3, eu);
      card.position.set(px, py, pz);
      tmpO.position.copy(card.position); tmpO.lookAt(cp.x, Math.max(cp.y * .6, py), cp.z); qFace.copy(tmpO.quaternion);
      qTmp.slerpQuaternions(qFlat, qFace, E.io(clamp(u * 1.25))); qSpin.setFromAxisAngle(up, Math.pow(1 - u, 1.6) * D.turns * Math.PI * 2);
      card.quaternion.copy(qSpin).multiply(qTmp);
      if (S.hold) { const w = Math.sin(t * 1.1) * .07; qSpin.setFromAxisAngle(up, w); card.quaternion.premultiply(qSpin); }
      card.scale.setScalar(lerp(.4, (domCard ? 1.55 : 1.12) + S.hold * .08, E.out(u)));
      const cm = card.userData.mats[0]; cm.emissive.setRGB(rl[0] / 255, rl[1] / 255, rl[2] / 255); cm.emissiveIntensity = .06 + S.halo * .03 * g;
      st.halo.position.copy(card.position).add(new Vector3(0, 0, -.05)); st.halo.lookAt(cp); st.halo.scale.setScalar((2.2 + g * .8) * S.halo); st.halo.material.opacity = S.halo * (.16 + g * .05); st.halo.material.color.setHex(rc);
      if (g >= 3 && !calm) { st.raysM.position.copy(card.position); st.raysM.lookAt(cp); st.raysM.rotateZ(t * .25); st.raysM.scale.setScalar((3.2 + g * .9) * S.halo); st.raysM.material.opacity = S.halo * (.06 + g * .035); st.raysM.material.color.setHex(rc); }
    }
    if (st.shock.userData.on) { const p = clamp((tl.t - st.shock.userData.t0) / 1.1); st.shock.scale.setScalar(.6 + p * 4.2 * Math.max(1, s)); st.shock.material.opacity = (1 - p) * .7; if (p >= 1) st.shock.userData.on = false; }
  };
  if (!o.manual) run.start();
  return { run, abort: () => run.abort(), skip: () => run.skip(), total: tEnd, seek: t => run.seek(t) };
}
