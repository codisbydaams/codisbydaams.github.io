/* ===== CODIS-V69 · رسومات «بدايات الغرف» — أربعة مشاهد SVG مرسومة يدوياً بهوية «ورق عتيق كرتوني مودرن» =====
   كل مشهد لوحة 400×300 بإطار، بخامات من تدرجات فقط (لا فلاتر SVG — WebKit يرسمها بدقة منخفضة)، والظلال نسخ داكنة مزاحة.
   الحالة الافتراضية لكل عنصر = اللقطة الأخيرة (تُستعمل كصورة مصغّرة ثابتة بالمتجر). الحركة تُضاف فقط تحت .ri-scene.is-play من v69.css:
   المجموعات الخارجية تحمل الموضع الثابت (transform كسمة)، والداخلية k-* تحمل الحركة (CSS transform/opacity) ⇒ لا تعارض بين الاثنين.
   الخطوط المرسومة تدريجياً = .k-draw (طولها يُحسب عند التشغيل، لا pathLength). المعرّفات داخل SVG تُلحق بـuid فلا تتصادم النسخ. */
function codisRiSvgOpen(u, defs){
  return '<svg class="ri-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet"><defs>' +
    '<radialGradient id="' + u + 'vg" cx="50%" cy="46%" r="72%"><stop offset=".56" stop-color="#140A04" stop-opacity="0"/><stop offset="1" stop-color="#140A04" stop-opacity=".5"/></radialGradient>' +
    '<linearGradient id="' + u + 'pp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBF2DD"/><stop offset=".55" stop-color="#F1E2C1"/><stop offset="1" stop-color="#E4CFA4"/></linearGradient>' +
    '<linearGradient id="' + u + 'br" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6DE98"/><stop offset=".5" stop-color="#C9963A"/><stop offset="1" stop-color="#8A5E1A"/></linearGradient>' +
    defs + '</defs>';
}
/* الإطار المشترك: تظليل الحواف + خط ذهبي مزدوج رفيع */
function codisRiSvgClose(u){
  return '<rect x="0" y="0" width="400" height="300" rx="22" fill="url(#' + u + 'vg)"/>' +
    '<rect x="7.5" y="7.5" width="385" height="285" rx="17" fill="none" stroke="#E9C77A" stroke-opacity=".38"/>' +
    '<rect x="11.5" y="11.5" width="377" height="277" rx="14" fill="none" stroke="#E9C77A" stroke-opacity=".14"/></svg>';
}
/* أدوات صغيرة */
function codisRiStar(cx, cy, r, fill, op){
  const p = []; for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p.push((cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1)); }
  return '<path d="M' + p.join(' L') + 'Z" fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '/>';
}
function codisRiSpark(cx, cy, r, cls, d){
  return '<g transform="translate(' + cx + ' ' + cy + ')"><g class="k-spk ' + (cls || '') + '" style="--d:' + (d || 0) + 'ms"><path d="M0 ' + (-r) + ' Q1 -1 ' + r + ' 0 Q1 1 0 ' + r + ' Q-1 1 ' + (-r) + ' 0 Q-1 -1 0 ' + (-r) + 'Z" fill="#FFE7A8"/></g></g>';
}

/* ---------------- A · غرفة التخطيط: مكتب قديم، خريطة مطوية تنبسط، بوصلة نحاسية ترسم المسار، ختم شمعي ودبوس ---------------- */
function codisRiArtPlanning(u){
  const defs = '<linearGradient id="' + u + 'desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76513A"/><stop offset="1" stop-color="#4A3020"/></linearGradient>' +
    '<linearGradient id="' + u + 'pl" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#E5D2A9"/><stop offset=".18" stop-color="#F3E5C6"/><stop offset="1" stop-color="#EBD9B3"/></linearGradient>' +
    '<radialGradient id="' + u + 'wax" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#D2553F"/><stop offset=".6" stop-color="#9C2F22"/><stop offset="1" stop-color="#6E1D14"/></radialGradient>';
  const N = [[100, 200], [140, 128], [198, 176], [252, 118], [300, 190]], T = [900, 1053, 1193, 1340, 1500];
  let nodes = '';
  N.forEach((p, i)=>{
    const last = i === N.length - 1;
    nodes += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><g class="k-node" style="--d:' + T[i] + 'ms"><circle r="' + (last ? 8 : 7) + '" fill="#F8EED6" stroke="' + (last ? '#9C2F22' : '#2E4A6B') + '" stroke-width="2.2"/><circle r="2.8" fill="' + (last ? '#9C2F22' : '#2E4A6B') + '"/></g></g>' +
      (last ? '' : '<g class="k-lab" style="--d:' + (T[i] + 90) + 'ms"><path d="M' + (p[0] + 12) + ' ' + (p[1] - 3) + 'h22 M' + (p[0] + 12) + ' ' + (p[1] + 4) + 'h14" stroke="#7A5A3A" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/></g>');
  });
  return codisRiSvgOpen(u, defs) +
    '<rect x="0" y="0" width="400" height="300" rx="22" fill="url(#' + u + 'desk)"/>' +
    '<g fill="none" stroke="#FFE2B4" stroke-opacity=".07" stroke-width="1.4"><path d="M0 46 C120 38 250 58 400 44"/><path d="M0 112 C140 104 240 124 400 108"/><path d="M0 182 C110 174 280 196 400 178"/><path d="M0 252 C150 244 260 262 400 248"/></g>' +
    '<g fill="none" stroke="#1E1006" stroke-opacity=".18" stroke-width="1"><path d="M0 78 C130 70 260 92 400 76"/><path d="M0 218 C120 210 270 232 400 214"/></g>' +
    /* لفافة مطوية أعلى اليمين + محبرة وريشة أسفل اليسار (ثابتة) */
    '<g transform="translate(300 26) rotate(-8)"><rect x="3" y="6" width="74" height="16" rx="8" fill="#1E1006" opacity=".3"/><rect width="74" height="16" rx="8" fill="#E9D7AE"/><rect width="74" height="5" rx="2.5" y="3" fill="#FFF6DE" opacity=".6"/><ellipse cx="74" cy="8" rx="4" ry="8" fill="#CDB487"/><ellipse cx="74" cy="8" rx="1.6" ry="4" fill="#A88A5C"/><rect x="30" y="-1" width="8" height="18" fill="#9C2F22" opacity=".85"/></g>' +
    '<g transform="translate(40 240)"><ellipse cx="4" cy="30" rx="26" ry="6" fill="#1E1006" opacity=".35"/><path d="M-14 4 Q-16 28 0 30 Q16 28 14 4 Z" fill="#20283A"/><path d="M-14 4 Q-16 28 0 30 Q-6 22 -8 6Z" fill="#3A4660" opacity=".7"/><rect x="-7" y="-4" width="14" height="9" rx="2" fill="#2B3448"/><rect x="-8" y="-6" width="16" height="4" rx="2" fill="#C9963A"/>' +
    '<path d="M2 -4 C10 -30 26 -54 52 -74 C40 -52 26 -30 6 -4Z" fill="#F3E9D2"/><path d="M2 -4 C14 -34 30 -56 52 -74" stroke="#8A6A45" stroke-width="1.1" fill="none"/><path d="M14 -30 l-6 -3 M20 -40 l-7 -3 M27 -50 l-7 -3 M34 -58 l-6 -4" stroke="#C7B38F" stroke-width="1"/></g>' +
    /* الورقة: نصف أيمن ثابت + نصف أيسر ينبسط من خط الطي */
    '<g class="k-sheet"><g transform="rotate(-1.5 200 150)">' +
      '<path d="M200 70 L330 66 Q335 67 335 72 L338 233 Q338 238 333 238 L200 242Z" fill="#1E1006" opacity=".3"/>' +
      '<path d="M200 64 L326 60 Q331 61 331 66 L333 228 Q333 233 328 233 L200 236Z" fill="url(#' + u + 'pp)"/>' +
      '<g stroke="#8A6A45" stroke-opacity=".13" stroke-width="1"><path d="M214 92h110 M214 124h112 M214 156h114 M214 188h114 M214 220h114"/><path d="M232 66v166 M264 65v168 M296 64v168"/></g>' +
      '<g transform="translate(300 92)"><circle r="17" fill="none" stroke="#8A6A45" stroke-opacity=".55" stroke-width="1"/><circle r="12" fill="none" stroke="#8A6A45" stroke-opacity=".35" stroke-width=".8"/><path d="M0 -20 L3 -3 L0 0 L-3 -3Z M0 20 L3 3 L0 0 L-3 3Z" fill="#2E4A6B" opacity=".8"/><path d="M-20 0 L-3 3 L0 0 L-3 -3Z M20 0 L3 3 L0 0 L3 -3Z" fill="#8A6A45" opacity=".7"/></g>' +
      '<g transform="translate(214 74)"><path d="M0 4 Q4 0 8 4 L58 4 Q62 0 66 4 L66 14 Q62 10 58 14 L8 14 Q4 10 0 14Z" fill="#EAD8B0" stroke="#8A6A45" stroke-opacity=".55"/><path d="M14 9h38" stroke="#5A4128" stroke-width="1.6" stroke-linecap="round" opacity=".75"/></g>' +
      '<path d="M318 214 l8 0 l0 -8 M318 80 l8 0 l0 8" fill="none" stroke="#8A6A45" stroke-opacity=".6" stroke-width="1.2"/>' +
      '<g class="k-fold">' +
        '<path d="M200 70 L74 68 Q69 68 69 73 L66 235 Q66 240 71 240 L200 242Z" fill="#1E1006" opacity=".28"/>' +
        '<path d="M200 64 L74 62 Q69 62 69 67 L66 229 Q66 234 71 234 L200 236Z" fill="url(#' + u + 'pl)"/>' +
        '<g stroke="#8A6A45" stroke-opacity=".13" stroke-width="1"><path d="M72 92h126 M72 124h126 M71 156h127 M70 188h128 M70 220h128"/><path d="M104 63v170 M136 63v172 M168 64v172"/></g>' +
        '<g fill="none" stroke="#8A6A45" stroke-opacity=".38" stroke-width="1.1"><path d="M84 112 q10 -9 20 0 t20 0"/><path d="M88 120 q8 -6 16 0 t16 0"/><path d="M150 210 q12 -10 24 0"/><path d="M154 217 q8 -6 16 0"/></g>' +
        '<path d="M82 214 l-8 0 l0 -8 M82 80 l-8 0 l0 8" fill="none" stroke="#8A6A45" stroke-opacity=".6" stroke-width="1.2"/>' +
      '</g>' +
      '<g class="k-crease"><path d="M200 64 L200 236" stroke="#7A5A3A" stroke-opacity=".32" stroke-width="1.3"/><path d="M201.6 64 L201.6 236" stroke="#FFF8E6" stroke-opacity=".55" stroke-width="1"/></g>' +
      '<g class="k-guide"><path d="M100 200 L140 128 L198 176 L252 118 L300 190" fill="none" stroke="#2E4A6B" stroke-opacity=".28" stroke-width="1.4" stroke-dasharray="2 6" stroke-linecap="round"/></g>' +
      '<path class="k-draw k-route" data-len="326" d="M100 200 L140 128 L198 176 L252 118 L300 190" fill="none" stroke="#2E4A6B" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      nodes +
      '<g transform="translate(300 190)"><g class="k-flag"><path d="M0 -8 V-34" stroke="#3A2A1C" stroke-width="1.8" stroke-linecap="round"/><path d="M0 -34 L18 -29 L0 -23Z" fill="#9C2F22"/></g></g>' +
      /* البوصلة النحاسية (رأسها عند الأصل) تتبع المسار */
      '<g class="k-compw"><g class="k-comp">' +
        '<g transform="translate(4 5)" opacity=".28" fill="none" stroke="#1E1006" stroke-width="3.4" stroke-linecap="round"><path d="M0 0 L-7 -52 L-25 -8"/></g>' +
        '<path d="M0 0 L-7 -52" stroke="#6E4A14" stroke-width="4" stroke-linecap="round"/><path d="M0 0 L-7 -52" stroke="url(#' + u + 'br)" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M-25 -8 L-7 -52" stroke="#6E4A14" stroke-width="4" stroke-linecap="round"/><path d="M-25 -8 L-7 -52" stroke="url(#' + u + 'br)" stroke-width="2.6" stroke-linecap="round"/>' +
        '<rect x="-10" y="-66" width="6" height="12" rx="2" fill="#8A5E1A"/><circle cx="-7" cy="-52" r="5.2" fill="url(#' + u + 'br)" stroke="#6E4A14" stroke-width="1"/><circle cx="-7" cy="-52" r="1.6" fill="#6E4A14"/>' +
      '</g></g>' +
      '<g transform="translate(306 214)"><g class="k-seal"><path d="M0 -16 C8 -17 15 -10 16 -2 C17 7 11 15 2 16 C-7 17 -15 12 -16 3 C-17 -6 -9 -15 0 -16Z" fill="url(#' + u + 'wax)"/><circle r="10" fill="none" stroke="#6E1D14" stroke-width="1.4" opacity=".7"/>' + codisRiStar(0, 0, 6.5, '#6E1D14', '.75') + '<path d="M-9 -9 Q-6 -13 -1 -13" stroke="#F3A08F" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></g></g>' +
      '<g transform="translate(84 76)"><g class="k-pin"><ellipse cx="3" cy="4" rx="5" ry="2.4" fill="#1E1006" opacity=".3"/><path d="M0 0 L2 6" stroke="#6B6B6B" stroke-width="1.4"/><circle cx="0" cy="-2" r="6" fill="#B8862E"/><circle cx="-2" cy="-4" r="2" fill="#FBE3A2"/></g></g>' +
    '</g></g>' +
    codisRiSvgClose(u);
}

/* ---------------- B · غرفة العمليات: لوح مهام بإطار أنتيكا، بطاقات مثبتة، خيط أحمر، ختم «منجز»، ساعة تدق، شريط تنفيذ ---------------- */
function codisRiArtTasks(u){
  const defs = '<linearGradient id="' + u + 'wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34433C"/><stop offset="1" stop-color="#1B2521"/></linearGradient>' +
    '<linearGradient id="' + u + 'fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A5E3B"/><stop offset=".5" stop-color="#6A4429"/><stop offset="1" stop-color="#4A2F1C"/></linearGradient>' +
    '<linearGradient id="' + u + 'ck" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8D6AE"/><stop offset="1" stop-color="#D3BB8C"/></linearGradient>' +
    '<linearGradient id="' + u + 'cd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDF6E6"/><stop offset="1" stop-color="#EEDFC0"/></linearGradient>' +
    '<linearGradient id="' + u + 'wd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A9784A"/><stop offset="1" stop-color="#5E3E24"/></linearGradient>';
  const specks = [[92, 168], [118, 214], [150, 176], [176, 226], [214, 160], [236, 218], [262, 170], [300, 222], [318, 160], [104, 58], [228, 56], [326, 98], [140, 160], [282, 232]]
    .map(p=>'<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.3" fill="#6E5030" opacity=".28"/>').join('');
  const card = (x, y, r, tint, pin, d, k)=>'<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ' 35 42)"><g class="k-card" style="--d:' + d + 'ms">' +
    '<rect x="3" y="5" width="70" height="84" rx="3" fill="#2A1A0C" opacity=".3"/><rect width="70" height="84" rx="3" fill="url(#' + u + 'cd)"/>' +
    '<rect width="70" height="15" rx="3" fill="' + tint + '" opacity=".2"/><path d="M0 15h70" stroke="' + tint + '" stroke-opacity=".45"/>' +
    '<g stroke="#8A6A45" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"><path d="M60 30H18 M60 41H24 M60 52H14"/></g>' +
    '<rect x="9" y="62" width="13" height="13" rx="2.4" fill="#FFFBF0" stroke="#5A4128" stroke-width="1.4"/>' +
    (k ? '<path class="k-draw k-chk" data-len="19" style="--d:' + k + 'ms" d="M11.5 68.5 l3.5 3.6 l7.4 -9" fill="none" stroke="#2F5D4A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' : '') +
    '<path d="M60 68.5H30" stroke="#8A6A45" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="38" cy="7" rx="5" ry="2.4" fill="#2A1A0C" opacity=".28"/><circle cx="35" cy="4" r="5.2" fill="' + pin + '"/><circle cx="33.4" cy="2.4" r="1.7" fill="#fff" opacity=".55"/>' +
    '</g></g>';
  return codisRiSvgOpen(u, defs) +
    '<rect x="0" y="0" width="400" height="300" rx="22" fill="url(#' + u + 'wall)"/>' +
    '<g stroke-width="1"><path d="M80 0V300 M160 0V300 M240 0V300 M320 0V300" stroke="#000" stroke-opacity=".2"/><path d="M81.5 0V300 M161.5 0V300 M241.5 0V300 M321.5 0V300" stroke="#fff" stroke-opacity=".04"/></g>' +
    '<rect x="0" y="262" width="400" height="38" fill="#3E2A1B"/><rect x="0" y="262" width="400" height="3" fill="#7A5236" opacity=".7"/>' +
    '<g class="k-board">' +
      '<rect x="62" y="40" width="288" height="222" rx="10" fill="#000" opacity=".35"/>' +
      '<rect x="56" y="32" width="288" height="222" rx="10" fill="url(#' + u + 'fr)"/>' +
      '<rect x="62.5" y="38.5" width="275" height="209" rx="7" fill="none" stroke="#E2BE6E" stroke-opacity=".55"/>' +
      '<rect x="68" y="44" width="264" height="198" rx="4" fill="#3A2616"/><rect x="71" y="47" width="258" height="192" rx="3" fill="url(#' + u + 'ck)"/>' +
      '<path d="M71 47h258" stroke="#2A1A0C" stroke-opacity=".25" stroke-width="3"/>' + specks +
      '<g fill="url(#' + u + 'br)"><circle cx="62" cy="38" r="4"/><circle cx="338" cy="38" r="4"/><circle cx="62" cy="248" r="4"/><circle cx="338" cy="248" r="4"/></g>' +
      /* شريط التنفيذ */
      '<g transform="translate(92 180)"><rect x="2" y="3" width="216" height="44" rx="3" fill="#2A1A0C" opacity=".22"/><rect width="216" height="44" rx="3" fill="url(#' + u + 'cd)"/>' +
        '<path d="M204 12H140 M204 20H160" stroke="#5A4128" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>' +
        '<rect x="12" y="29" width="192" height="7" rx="3.5" fill="#5A4128" opacity=".16"/>' +
        '<g transform="translate(204 29)"><g class="k-prog"><rect x="-138" y="0" width="138" height="7" rx="3.5" fill="#2F5D4A"/><rect x="-138" y="1" width="138" height="2" rx="1" fill="#fff" opacity=".22"/></g></g>' +
        '<g fill="#FDF6E6" stroke="#5A4128" stroke-opacity=".5"><circle cx="156" cy="32.5" r="3"/><circle cx="108" cy="32.5" r="3"/><circle cx="60" cy="32.5" r="3"/></g>' +
        '<path d="M14 12 l6 0 M14 20 l12 0" stroke="#9C2F22" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/></g>' +
      card(244, 62, -1.5, '#2F5D4A', '#C99A2E', 420, 1450) + card(165, 70, 1.5, '#9C2F22', '#2E4A6B', 540, 0) + card(86, 64, -3, '#2E4A6B', '#B23A2A', 660, 1580) +
      '<path class="k-draw k-thread" data-len="169" d="M279 66 Q240 92 200 74 Q160 92 121 68" fill="none" stroke="#A8322A" stroke-width="1.5" stroke-linecap="round"/>' +
      /* حبر الختم على البطاقة الوسطى */
      '<g transform="translate(200 122) rotate(-12)"><g class="k-ink"><circle r="17" fill="none" stroke="#A8322A" stroke-width="2.2" opacity=".85"/><circle r="13" fill="none" stroke="#A8322A" stroke-width="1" opacity=".55" stroke-dasharray="2 2.4"/><path d="M-8 0 l5.5 5.5 l10.5 -12" fill="none" stroke="#A8322A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/></g></g>' +
      /* الساعة النحاسية */
      '<g transform="translate(200 32)"><circle cx="2" cy="3" r="17" fill="#000" opacity=".3"/><circle r="17" fill="url(#' + u + 'br)"/><circle r="13" fill="#FBF3E0"/>' +
        '<path d="M0 -11v3 M11 0h-3 M0 11v-3 M-11 0h3" stroke="#5A4128" stroke-width="1.4" stroke-linecap="round"/><path d="M0 0 L5 -4" stroke="#3A2A1C" stroke-width="1.8" stroke-linecap="round"/></g>' +
      '<g class="k-hand"><path d="M200 32 L200 21.5" stroke="#9C2F22" stroke-width="1.6" stroke-linecap="round"/></g><circle cx="200" cy="32" r="1.8" fill="#3A2A1C"/>' +
    '</g>' +
    /* أداة الختم المطاطي */
    '<g transform="translate(200 122)"><g class="k-stamp">' +
      '<ellipse cx="3" cy="4" rx="22" ry="4" fill="#000" opacity=".22"/>' +
      '<rect x="-20" y="-11" width="40" height="11" rx="2.5" fill="#3B2A1E"/><rect x="-18" y="-2" width="36" height="4" rx="1" fill="#A8322A"/>' +
      '<rect x="-6" y="-26" width="12" height="16" rx="2" fill="#6B4A31"/><ellipse cx="0" cy="-37" rx="12" ry="11.5" fill="url(#' + u + 'wd)"/><ellipse cx="-4" cy="-41" rx="4" ry="3" fill="#E8C49A" opacity=".55"/>' +
    '</g></g>' +
    codisRiSvgClose(u);
}

/* ---------------- C · غرفة الأستاذ: كتاب جلدي ينفتح، صفحة تُقلب، كتابة ورموز، مسار تعلّم بمحطات، فاصل وريشة، توهّج خفيف ---------------- */
function codisRiArtLearn(u){
  const defs = '<linearGradient id="' + u + 'lib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#21392F"/><stop offset="1" stop-color="#11201A"/></linearGradient>' +
    '<linearGradient id="' + u + 'lt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3E7560"/><stop offset=".55" stop-color="#2C5A48"/><stop offset="1" stop-color="#1E4134"/></linearGradient>' +
    '<linearGradient id="' + u + 'pgR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E7D5AE"/><stop offset=".12" stop-color="#F8EDD3"/><stop offset="1" stop-color="#F1E2C0"/></linearGradient>' +
    '<linearGradient id="' + u + 'pgL" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#E7D5AE"/><stop offset=".12" stop-color="#F8EDD3"/><stop offset="1" stop-color="#F1E2C0"/></linearGradient>' +
    '<linearGradient id="' + u + 'flp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9C497"/><stop offset=".5" stop-color="#FBF3DF"/><stop offset="1" stop-color="#EAD9B4"/></linearGradient>' +
    '<radialGradient id="' + u + 'glw" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE3A0" stop-opacity=".34"/><stop offset="1" stop-color="#FFE3A0" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="' + u + 'hal" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD877" stop-opacity=".75"/><stop offset="1" stop-color="#FFD877" stop-opacity="0"/></radialGradient>';
  /* رفّ كتب خلفي ثابت (حتمي) */
  const cols = ['#5B3A2A', '#2F4A5C', '#6B5530', '#3E5A42', '#7A3B30', '#4A3A5A', '#5E4A2E'];
  let x = 14, i = 0, shelf = '';
  while(x < 386){ const w = 9 + (i * 7 % 8), h = 44 + (i * 13 % 26); shelf += '<rect x="' + x + '" y="' + (88 - h) + '" width="' + w + '" height="' + h + '" rx="1.5" fill="' + cols[i % cols.length] + '"/>' + (w > 11 ? '<path d="M' + (x + 2) + ' ' + (88 - h + 8) + 'h' + (w - 4) + ' M' + (x + 2) + ' ' + (88 - h + 12) + 'h' + (w - 4) + '" stroke="#D9B566" stroke-opacity=".5" stroke-width="1"/>' : ''); x += w + 1.5 + (i % 5 === 4 ? 7 : 0); i++; }
  const pageR = 'M200 74 Q262 66 324 72 L324 236 Q262 230 200 238Z', pageL = 'M200 74 Q138 66 76 72 L76 236 Q138 230 200 238Z';
  const S = [[224, 218, 1420], [270, 186, 1520], [238, 146, 1620], [296, 108, 1740]];
  return codisRiSvgOpen(u, defs) +
    '<rect x="0" y="0" width="400" height="300" rx="22" fill="url(#' + u + 'lib)"/>' +
    '<g opacity=".55">' + shelf + '</g><rect x="0" y="88" width="400" height="7" fill="#3B2A1C"/><rect x="0" y="95" width="400" height="3" fill="#000" opacity=".25"/>' +
    '<rect x="0" y="252" width="400" height="48" fill="#3A281A"/><rect x="0" y="252" width="400" height="2.5" fill="#7A5236" opacity=".7"/>' +
    '<g class="k-glow"><ellipse cx="200" cy="158" rx="190" ry="120" fill="url(#' + u + 'glw)"/></g>' +
    '<g class="k-bookin"><g class="k-bshadow"><ellipse cx="200" cy="248" rx="142" ry="9" fill="#000" opacity=".38"/></g><g class="k-book">' +
      '<rect x="200" y="64" width="136" height="180" rx="6" fill="url(#' + u + 'lt)"/>' +
      '<path d="M200 78 Q262 70 326 76 L326 240 Q262 234 200 242Z" fill="#D8C49A"/><path d="M200 76 Q262 68 325 74 L325 238 Q262 232 200 240Z" fill="#E6D4AC"/>' +
      '<path d="' + pageR + '" fill="url(#' + u + 'pgR)"/>' +
      '<g class="k-lside"><rect x="64" y="64" width="136" height="180" rx="6" fill="url(#' + u + 'lt)"/>' +
        '<path d="M200 78 Q138 70 74 76 L74 240 Q138 234 200 242Z" fill="#D8C49A"/><path d="M200 76 Q138 68 75 74 L75 238 Q138 232 200 240Z" fill="#E6D4AC"/>' +
        '<path d="' + pageL + '" fill="url(#' + u + 'pgL)"/></g>' +
      '<rect x="188" y="70" width="24" height="168" fill="#8A6A45" opacity=".12"/><path d="M200 74 V238" stroke="#7A5A3A" stroke-opacity=".35" stroke-width="1.2"/>' +
      '<g class="k-flipR"><path d="' + pageR + '" fill="url(#' + u + 'flp)"/></g>' +
      '<g class="k-flipL"><path d="' + pageL + '" fill="url(#' + u + 'flp)"/></g>' +
      /* محتوى الصفحتين */
      '<g class="k-lc" fill="none" stroke-linecap="round">' +
        '<path class="k-draw k-ln" data-len="72" style="--d:1250ms" d="M182 96 H112" stroke="#3A2A1C" stroke-width="3"/>' +
        '<path class="k-draw k-ln" data-len="88" style="--d:1330ms" d="M182 114 H96" stroke="#7A5A3A" stroke-opacity=".7" stroke-width="1.8"/>' +
        '<path class="k-draw k-ln" data-len="80" style="--d:1400ms" d="M182 126 H104" stroke="#7A5A3A" stroke-opacity=".7" stroke-width="1.8"/>' +
        '<path class="k-draw k-ln" data-len="92" style="--d:1470ms" d="M182 138 H92" stroke="#7A5A3A" stroke-opacity=".7" stroke-width="1.8"/>' +
        '<g class="k-gly" style="--d:1500ms"><path d="M150 210 L172 210 L162 172Z" stroke="#2F5D4A" stroke-width="1.8" stroke-linejoin="round"/><path d="M162 172 V210" stroke="#2F5D4A" stroke-width="1" stroke-dasharray="2 2.5"/><path d="M162 204 h4 v6" stroke="#2F5D4A" stroke-width="1"/></g>' +
        '<g transform="translate(112 188)"><g class="k-gly" style="--d:1580ms"><circle r="3.2" fill="#9C2F22" stroke="none"/><ellipse rx="17" ry="6" stroke="#2E4A6B" stroke-width="1.4" transform="rotate(30)"/><ellipse rx="17" ry="6" stroke="#2E4A6B" stroke-width="1.4" transform="rotate(-30)"/><ellipse rx="17" ry="6" stroke="#2E4A6B" stroke-width="1.4" transform="rotate(90)"/></g></g>' +
      '</g>' +
      '<g class="k-rc" fill="none" stroke-linecap="round">' +
        '<path class="k-draw k-ln" data-len="80" style="--d:1300ms" d="M304 96 H226" stroke="#3A2A1C" stroke-width="3"/>' +
        '<path class="k-draw k-path" data-len="191" d="M224 218 C246 210 262 200 270 186 C278 170 248 162 238 146 C228 128 270 116 296 108" stroke="#2F5D4A" stroke-width="2.4"/>' +
        S.map((p, k)=>'<g transform="translate(' + p[0] + ' ' + p[1] + ')"><g class="k-node" style="--d:' + p[2] + 'ms"><circle r="' + (k === 3 ? 7 : 5.6) + '" fill="#FBF3DF" stroke="' + (k === 3 ? '#B8862E' : '#2F5D4A') + '" stroke-width="2"/>' + (k === 3 ? codisRiStar(0, 0, 4.2, '#B8862E') : '<circle r="2" fill="#2F5D4A"/>') + '</g></g>').join('') +
      '</g>' +
      '<g transform="translate(208 62)"><g class="k-ribbon"><path d="M0 0 H10 V84 L5 78 L0 84Z" fill="#9C2F22"/><path d="M2 0 V80" stroke="#D2553F" stroke-width="1" opacity=".6"/></g></g>' +
      /* الغلاف الأمامي (فوق كل شيء وهو مغلق) */
      '<g class="k-cover"><rect x="200" y="64" width="136" height="180" rx="6" fill="url(#' + u + 'lt)"/>' +
        '<rect x="210" y="74" width="116" height="160" rx="3" fill="none" stroke="#D9B566" stroke-opacity=".75" stroke-width="1.4"/><rect x="215" y="79" width="106" height="150" rx="2" fill="none" stroke="#D9B566" stroke-opacity=".4"/>' +
        '<g transform="translate(268 154)"><circle r="24" fill="none" stroke="#D9B566" stroke-opacity=".8" stroke-width="1.4"/>' + codisRiStar(0, 0, 15, '#D9B566', '.9') + '<circle r="4" fill="#2C5A48"/></g>' +
        '<path d="M200 64 h12 v180 h-12Z" fill="#000" opacity=".18"/><path d="M336 64 l-14 0 l14 14Z M336 244 l-14 0 l14 -14Z" fill="#D9B566" opacity=".85"/></g>' +
    '</g></g>' +
    '<g transform="translate(296 108)"><g class="k-halo"><circle r="20" fill="url(#' + u + 'hal)"/></g></g>' +
    '<g transform="translate(296 108)"><g class="k-quill"><path d="M2 -2 C14 -26 34 -50 62 -70 C48 -46 30 -24 6 0Z" fill="#FBF5E6"/><path d="M2 -2 C16 -30 36 -52 62 -70" stroke="#8A6A45" stroke-width="1.1" fill="none"/><path d="M16 -24 l-7 -2 M24 -35 l-7 -3 M33 -45 l-7 -3 M42 -54 l-6 -3" stroke="#CDBB98" stroke-width="1"/><path d="M0 0 L4 -5" stroke="#3A2A1C" stroke-width="2" stroke-linecap="round"/></g></g>' +
    codisRiSpark(92, 64, 6, '', 1700) + codisRiSpark(336, 60, 5, '', 1760) + codisRiSpark(352, 196, 4.5, '', 1820) + codisRiSpark(54, 176, 4, '', 1880) +
    codisRiSvgClose(u);
}

/* ---------------- D · غرفة التأديب: سجل جلدي بحزام، يُفك الحزام ويُرفع الغلاف، شبكة الأيام، علامات الاستمرار، سلسلة الثبات، ختم ---------------- */
function codisRiArtHabits(u){
  const defs = '<linearGradient id="' + u + 'tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#302E34"/><stop offset="1" stop-color="#17161A"/></linearGradient>' +
    '<linearGradient id="' + u + 'lj" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5A2A2E"/><stop offset=".55" stop-color="#3E1C20"/><stop offset="1" stop-color="#2A1215"/></linearGradient>' +
    '<radialGradient id="' + u + 'sl" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#C64A3C"/><stop offset=".6" stop-color="#8E2A2A"/><stop offset="1" stop-color="#5E1616"/></radialGradient>';
  const C = 17, G = 4.5, X0 = 127, Y0 = 102, cols = 7, rows = 5;
  /* أيام الأسبوع من اليمين لليسار (RTL). علامات الاستمرار: صفوف 0–2 مع غيابين، والصف 3 حتى اليوم */
  const miss = { '0,5':1, '1,2':1 }, today = [3, 3];
  let cells = '', ticks = '', n = 0, chainPts = [];
  for(let r = 0; r < rows; r++){
    let row = '';
    for(let c = 0; c < cols; c++){
      const cx = X0 + (cols - 1 - c) * (C + G), cy = Y0 + r * (C + G), isToday = r === today[0] && c === today[1];
      row += '<rect x="' + cx + '" y="' + cy + '" width="' + C + '" height="' + C + '" rx="3" fill="#FFFBF0" fill-opacity=".55" stroke="#4A3328" stroke-opacity=".35"/>';
      const done = (r < 3 && !miss[r + ',' + c]) || (r === 3 && c <= today[1]);
      if(done){
        ticks += '<g transform="translate(' + (cx + C / 2) + ' ' + (cy + C / 2) + ')"><g class="k-tick" style="--d:' + (1000 + n * 22) + 'ms"><rect x="-8.5" y="-8.5" width="17" height="17" rx="3" fill="#8E2A2A" opacity=".1"/><path d="M-4.6 .4 l3.2 3.3 l6.2 -7.2" fill="none" stroke="#8E2A2A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></g></g>';
        n++; if(r === 3) chainPts.push([cx + C / 2, cy + C + 3.5]);
      }
    }
    cells += '<g class="k-row" style="--d:' + (860 + r * 60) + 'ms">' + row + '</g>';
  }
  const tx = X0 + (cols - 1 - today[1]) * (C + G) + C / 2, ty = Y0 + today[0] * (C + G) + C / 2;
  const chain = 'M' + chainPts.map(p=>p[0] + ' ' + p[1]).join(' L'), chainLen = Math.ceil(chainPts.reduce((a, p, i)=>i ? a + Math.hypot(p[0] - chainPts[i - 1][0], p[1] - chainPts[i - 1][1]) : 0, 0)) + 2;
  return codisRiSvgOpen(u, defs) +
    '<rect x="0" y="0" width="400" height="300" rx="22" fill="url(#' + u + 'tb)"/>' +
    '<rect x="22" y="22" width="356" height="256" rx="12" fill="none" stroke="#D2B482" stroke-opacity=".22" stroke-width="1.4" stroke-dasharray="6 5"/>' +
    '<g fill="url(#' + u + 'br)" opacity=".8"><circle cx="22" cy="22" r="3"/><circle cx="378" cy="22" r="3"/><circle cx="22" cy="278" r="3"/><circle cx="378" cy="278" r="3"/></g>' +
    /* قلم ومسطرة جانبيان (ثابتان) */
    '<g transform="translate(330 70) rotate(18)"><rect x="3" y="4" width="10" height="150" rx="3" fill="#000" opacity=".3"/><rect width="10" height="150" rx="3" fill="#C9A16A"/><path d="M0 14h4 M0 28h6 M0 42h4 M0 56h6 M0 70h4 M0 84h6 M0 98h4 M0 112h6 M0 126h4 M0 140h6" stroke="#5A4128" stroke-width="1"/></g>' +
    '<g transform="translate(64 96) rotate(-14)"><rect x="3" y="4" width="8" height="120" rx="4" fill="#000" opacity=".3"/><rect width="8" height="120" rx="4" fill="#1F1F24"/><rect y="88" width="8" height="10" fill="url(#' + u + 'br)"/><path d="M0 120 L4 132 L8 120Z" fill="#C9963A"/></g>' +
    '<g class="k-jin">' +
      '<rect x="118" y="44" width="176" height="228" rx="8" fill="#000" opacity=".38"/>' +
      '<rect x="112" y="38" width="176" height="228" rx="8" fill="url(#' + u + 'lj)"/>' +
      '<rect x="120" y="58" width="160" height="202" rx="3" fill="#D9C79F"/><rect x="120" y="58" width="160" height="200" rx="3" fill="url(#' + u + 'pp)"/>' +
      /* رأس الصفحة */
      '<path d="M266 77 H198" stroke="#2A1C14" stroke-width="3" stroke-linecap="round"/><path d="M266 86 H214" stroke="#7A5A3A" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/>' +
      '<g transform="translate(140 81)"><path d="M0 -9 L8 -6 L8 1 Q8 7 0 10 Q-8 7 -8 1 L-8 -6Z" fill="#8E2A2A" opacity=".85"/><path d="M-3.4 0 l2.6 2.8 l4.8 -5.4" stroke="#FBF2DD" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>' +
      '<g fill="#7A5A3A" opacity=".55">' + Array.from({ length:7 }, (_, c)=>'<circle cx="' + (X0 + c * (C + G) + C / 2) + '" cy="96" r="1.4"/>').join('') + '</g>' +
      cells + ticks +
      '<path class="k-draw k-chain" data-len="' + chainLen + '" d="' + chain + '" fill="none" stroke="#8E2A2A" stroke-width="1.6" stroke-linecap="round"/>' +
      '<g transform="translate(' + tx + ' ' + ty + ')"><g class="k-today"><rect x="-11.5" y="-11.5" width="23" height="23" rx="5" fill="none" stroke="#B8862E" stroke-width="2"/></g></g>' +
      '<path d="M266 226 H190 M266 236 H206" stroke="#7A5A3A" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>' +
      '<g transform="translate(150 232)"><g class="k-dseal"><path d="M0 -15 L10.6 -10.6 L15 0 L10.6 10.6 L0 15 L-10.6 10.6 L-15 0 L-10.6 -10.6Z" fill="url(#' + u + 'sl)"/><circle r="10" fill="none" stroke="#FBD2C4" stroke-opacity=".55" stroke-width="1"/>' + codisRiStar(0, 0, 6, '#FBD2C4', '.8') + '</g></g>' +
      /* شريط الربط العلوي */
      '<rect x="112" y="38" width="176" height="18" rx="6" fill="#2A1215"/><g stroke="#D2B482" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round">' + Array.from({ length:9 }, (_, k)=>'<path d="M' + (128 + k * 18) + ' 44 v6"/>').join('') + '</g>' +
      '<g transform="translate(250 38)"><path d="M0 0 h10 v62 l-5 -6 l-5 6Z" fill="#B8862E" opacity=".9"/></g>' +
      /* الغلاف + الحزام */
      '<g class="k-dcover"><rect x="112" y="56" width="176" height="210" rx="8" fill="url(#' + u + 'lj)"/>' +
        '<rect x="124" y="68" width="152" height="186" rx="5" fill="none" stroke="#D2B482" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="4 3"/>' +
        '<g transform="translate(200 158)"><path d="M0 -30 L24 -21 L24 3 Q24 21 0 30 Q-24 21 -24 3 L-24 -21Z" fill="none" stroke="#D9B566" stroke-width="1.6"/><path d="M-10 0 l7 7.5 l13 -15" stroke="#D9B566" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' +
        '<path d="M112 210 h176" stroke="#000" stroke-opacity=".2"/></g>' +
      '<g class="k-strap"><rect x="246" y="146" width="54" height="22" rx="3" fill="#24100F"/><rect x="246" y="149" width="54" height="2" fill="#D2B482" opacity=".25"/><rect x="250" y="142" width="16" height="30" rx="3" fill="none" stroke="url(#' + u + 'br)" stroke-width="3"/><path d="M258 146 v22" stroke="url(#' + u + 'br)" stroke-width="2"/></g>' +
    '</g>' +
    codisRiSvgClose(u);
}
const CODIS_RI_ART = { planning:codisRiArtPlanning, tasks:codisRiArtTasks, learn:codisRiArtLearn, habits:codisRiArtHabits };
