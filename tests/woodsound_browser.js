/* CODIS-V64 — تصيير كل أصوات «الخشب المعتّق» بالمحرك نفسه (OfflineAudioContext، Chrome): مسموعة، بلا تشبّع، ومختلفة عن الأصل وعن بعضها.
   TEST=tests/woodsound_browser.js node tools/prof/cdp.mjs http://127.0.0.1:8766/app/CODIS_FINAL.html tools/prof/s_evaltest.mjs --cpu 1 */
(async ()=>{
  const results = [];
  const T = (name, ok, info)=>results.push({ name, ok:!!ok, info:info === undefined ? '' : JSON.stringify(info).slice(0, 400) });
  const stat = async (n, opts)=>{ const buf = await CodisAudio.render(n, Object.assign({ dur:.3, kind:'check', pct:50 }, opts || {}), 1.6); let pk = 0, e = 0, c0 = 0, n0 = 0;
    for(let c = 0; c < buf.numberOfChannels; c++){ const d = buf.getChannelData(c); for(let i = 0; i < d.length; i++){ const a = Math.abs(d[i]); if(a > pk) pk = a; e += d[i] * d[i]; if(a > .0005){ n0 = i; if(!c0) c0 = i; } } }
    return { pk:+pk.toFixed(4), rms:+Math.sqrt(e / (buf.length * buf.numberOfChannels)).toFixed(5), len:+((n0 - c0) / buf.sampleRate).toFixed(3) }; };
  const names = CodisAudio.events().filter(k=>/@agedWood$/.test(k)).map(k=>k.replace('@agedWood', ''));
  T('16 wood sounds registered in the existing SOUNDS registry', names.length === 16, names);
  const W = {}, O = {};
  for(const n of names){ try{ W[n] = await stat(n, { ctx:'agedWood' }); O[n] = await stat(n); }catch(e){ W[n] = 'ERR ' + e.message; } }
  T('every wood sound is audible and does not clip', names.every(n=>W[n].pk > .002 && W[n].pk < .95), W);
  T('wood sounds are short (≤ .9 s audible tail; pen layers follow their stroke duration)', names.every(n=>/^pen\./.test(n) || W[n].len <= .9), W);
  T('each wood sound differs from the original it replaces', names.every(n=>Math.abs(W[n].rms - O[n].rms) > 1e-5 || Math.abs(W[n].pk - O[n].pk) > 1e-4), { W, O });
  const st = ['task.done', 'task.half', 'task.none', 'task.undo'].map(n=>W[n].rms);
  T('the four task-state wood sounds are distinct from each other', new Set(st.map(x=>x.toFixed(5))).size === 4, st);
  const def = k=>CodisAudio.def(k), pairs = names.map(n=>{ const a = def(n + '@agedWood'), b = def(n); return a.ch === b.ch && a.p === b.p && a.cd === b.cd; });
  T('same channel / priority / cooldown as the originals (mute, channel volume, voice limits behave the same)', pairs.every(Boolean), names.filter((n, i)=>!pairs[i]));
  return JSON.stringify({ results });
})()
