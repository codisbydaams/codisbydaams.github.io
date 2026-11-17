  /* AGED WOOD — طبقة واحدة لكل الأسطح (المربعات، مربع الكتابة، بطاقة الخطة، المعاينات): عروق خشب حقيقية (خطوط متموّجة غير متكررة بعرضين ولونين،
     «كاتدرائية» لحاء مسطّح، عقدة، مسامات) + طلاء معتّق + إطار محفور مزدوج + زوايا نحاس معتّق بمسامير ونقش + زخرفة الغرفة:
     التخطيط = شريط حاشية مخطوطة + محبرة وريشة · العمليات = سكة برونزية بمسامير ومجارٍ محفورة ومسطرة · الأستاذ = كعب جلدي بأحزمة مذهّبة + فاصل كتاب.
     الرسم حتمي (بذرة من الغرفة) ⇒ نفس الناتج حرفياً في كل رسم (يحافظ على إعادة استعمال DOM المتجر). SVG مضمَّن بلا فلاتر؛ mini = خطوط أقل بلا زخرفة دقيقة. */
  agedWood:function(d, u, mini){
    const g = id=>'pt' + u + id, tg = (d && d.target) || 'planning', f1 = n=>Math.round(n * 10) / 10;
    let sd = 7; const seed = 'aw|' + tg; for(let i = 0; i < seed.length; i++) sd = (Math.imul(sd, 31) + seed.charCodeAt(i)) | 0;
    const rnd = ()=>{ sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const W = 400, H = 480, N = mini ? 15 : 34, STEP = mini ? 8 : 18;
    /* عروق: كل خط موجة مركّبة (موجتان بطول وطورين عشوائيين)؛ 62% داكن عميق و38% فاتح كضوء على حافة العِرق */
    let grain = '', pores = '';
    for(let i = 0; i < N; i++){
      const y0 = (i + .5) * H / N + (rnd() - .5) * (H / N) * .8, a = 1.4 + rnd() * 4.6, k = 1 + Math.floor(rnd() * 2), ph = rnd() * 6.283, a2 = rnd() * 2.4, ph2 = rnd() * 6.283;
      let dd = '';
      for(let j = 0; j <= STEP; j++){ const x = -10 + (W + 20) * j / STEP, y = y0 + a * Math.sin(k * 6.283 * x / W + ph) + a2 * Math.sin(3.7 * 6.283 * x / W + ph2); dd += (j ? 'L' : 'M') + f1(x) + ' ' + f1(y); }
      const dark = rnd() < .62, w = dark ? .6 + rnd() * 1.9 : .5 + rnd() * 1.1, o = dark ? .26 + rnd() * .34 : .06 + rnd() * .12;
      grain += '<path class="' + (dark ? 'g-d' : 'g-l') + '" d="' + dd + '" stroke-width="' + f1(w) + '" stroke-opacity="' + o.toFixed(2) + '"/>';
      if(!mini && i % 5 === 2) pores += '<path class="g-p" d="' + dd + '"/>';
    }
    /* «كاتدرائية» الخشب المنشور: أقواس متداخلة تلتقي عند رأس (بلا تكرار ظاهر) */
    let cath = '';
    if(!mini){
      const ax = 150 + rnd() * 140, cy = 150 + rnd() * 150;
      for(let k = 1; k <= 7; k++){ const s = 8 + k * 12;
        cath += '<path class="g-c" d="M-10 ' + f1(cy - s) + 'C' + f1(ax * .55) + ' ' + f1(cy - s * .95) + ' ' + f1(ax - 22) + ' ' + f1(cy - s * .4) + ' ' + f1(ax + k * 3) + ' ' + f1(cy) +
          'C' + f1(ax - 22) + ' ' + f1(cy + s * .4) + ' ' + f1(ax * .55) + ' ' + f1(cy + s * .95) + ' -10 ' + f1(cy + s) + '" stroke-opacity="' + (.42 - k * .04).toFixed(2) + '"/>'; }
    }
    const knot = (mini || tg === 'teacher') ? '' : (()=>{ const kx = tg === 'operations' ? 300 + rnd() * 60 : 46 + rnd() * 50, ky = 300 + rnd() * 110;
      return '<g class="g-k"><ellipse cx="' + f1(kx) + '" cy="' + f1(ky) + '" rx="22" ry="11" fill="none" stroke-opacity=".22"/><ellipse cx="' + f1(kx) + '" cy="' + f1(ky) + '" rx="14" ry="7" fill="none" stroke-opacity=".34"/>' +
        '<ellipse cx="' + f1(kx) + '" cy="' + f1(ky) + '" rx="6.5" ry="3.4" fill="#170B05" fill-opacity=".72" stroke-opacity=".5"/></g>'; })();
    const lin = (id, x2, y2, st)=>'<linearGradient id="' + g(id) + '" x1="0" y1="0" x2="' + x2 + '" y2="' + y2 + '">' + st.map(s=>'<stop offset="' + s[0] + '" stop-color="' + s[1] + '" stop-opacity="' + s[2] + '"/>').join('') + '</linearGradient>';
    const wood = '<svg class="aw-wood" viewBox="0 0 400 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>' +
      lin('fig', 0, 1, [[0, '#7A4A2A', .16], [.18, '#1C0F07', .1], [.34, '#8A5833', .12], [.52, '#1C0F07', .14], [.7, '#7A4A2A', .1], [.86, '#1C0F07', .12], [1, '#8A5833', .14]]) + '</defs>' +
      '<rect width="400" height="480" fill="url(#' + g('fig') + ')"/><g fill="none" stroke-linecap="round" stroke-linejoin="round">' + cath + grain + pores + '</g>' + knot + '</svg>';
    /* زاوية نحاس معتّق (اتجاه أعلى-يسار؛ الـCSS يعكسها للزوايا الأربع): لوح L مشطوف + حافة لامعة + نقش لولبي محفور + مسامير */
    const corner = pos=>{ const b = g('br' + pos), r = g('rv' + pos);
      if(mini) return '<svg class="pt-corner aw-corner ' + pos + '" viewBox="0 0 56 56" aria-hidden="true" focusable="false"><path d="M4 30V8Q4 4 8 4H30L24 10H12Q10 10 10 12V24Z" fill="#B9884A" stroke="#24130A" stroke-width="1.4"/></svg>';   /* المصغّرة: عقدتان فقط (ميزانية عقد المتجر) */
      return '<svg class="pt-corner aw-corner ' + pos + '" viewBox="0 0 56 56" aria-hidden="true" focusable="false"><defs>' +
        lin('br' + pos, 1, 1, [[0, '#F0D49A', 1], [.38, '#B7894A', 1], [.72, '#7C5426', 1], [1, '#4E3214', 1]]) +
        '<radialGradient id="' + r + '" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#FFF1D2"/><stop offset=".45" stop-color="#C9985A"/><stop offset="1" stop-color="#5A3A17"/></radialGradient></defs>' +
        ('<path d="M3.5 41V9Q3.5 3.5 9 3.5H41L33.5 11H14.5Q11 11 11 14.5V33.5Z" fill="url(#' + b + ')" stroke="#24130A" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M6 37V10Q6 6 10 6H37" fill="none" stroke="#FFEBC0" stroke-opacity=".6" stroke-width=".7"/>' +
        '<path d="M15.5 25c0-5.5 3.6-9.5 9.5-9.5M15.5 25c3.2 0 4.4-2.4 3.2-4.6M25 15.5c0 3.2-2.4 4.4-4.6 3.2" fill="none" stroke="#3B220F" stroke-width="1.05" stroke-linecap="round"/>' +
        '<path d="M16.3 25.6c0-5.5 3.6-9.5 9.5-9.5" fill="none" stroke="#FFE3A8" stroke-opacity=".35" stroke-width=".6" stroke-linecap="round"/>' +
        '<circle cx="8.2" cy="8.2" r="2.5" fill="url(#' + r + ')" stroke="#24130A" stroke-width=".6"/><circle cx="7.4" cy="7.4" r=".75" fill="#FFF4DA"/>' +
        '<circle cx="7.3" cy="31" r="1.7" fill="url(#' + r + ')" stroke="#24130A" stroke-width=".5"/><circle cx="31" cy="7.3" r="1.7" fill="url(#' + r + ')" stroke="#24130A" stroke-width=".5"/>') + '</svg>'; };
    /* حفر: أخدود داكن + حافة سفلية مضاءة (إحساس عمق لا خط مرسوم) */
    const carve = (dd, w)=>'<path d="' + dd + '" fill="none" stroke="#120904" stroke-opacity=".78" stroke-width="' + (w || 1.6) + '" stroke-linecap="round"/><path d="' + dd + '" fill="none" stroke="#F3CF92" stroke-opacity=".2" stroke-width=".8" stroke-linecap="round" transform="translate(0 1.2)"/>';
    const brassL = lin('ml', 0, 1, [[0, '#F2D7A0', 1], [.5, '#B07F42', 1], [1, '#5E3D18', 1]]);
    let motif = '';
    if(!mini){
      if(tg === 'operations'){
        let ticks = ''; for(let x = 22; x <= 378; x += 8) ticks += 'M' + x + ' 112V' + ((x - 22) % 40 === 0 ? 103 : 107);
        let rivets = ''; [16, 112, 200, 288, 384].forEach(x=>{ rivets += '<circle cx="' + x + '" cy="62" r="2.4" fill="url(#' + g('ml') + ')" stroke="#24130A" stroke-width=".6"/><circle cx="' + (x - .8) + '" cy="61.2" r=".7" fill="#FFF2D2"/>'; });
        motif = '<svg class="aw-motif" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>' + brassL + '</defs>' +
          carve('M18 44H382', 2.2) + carve('M18 82H382', 2.2) + '<rect x="6" y="57" width="388" height="10" rx="2" fill="url(#' + g('ml') + ')" stroke="#24130A" stroke-width=".8"/>' + rivets +
          '<rect x="14" y="98" width="372" height="18" rx="2.5" fill="url(#' + g('ml') + ')" fill-opacity=".85" stroke="#24130A" stroke-width=".8"/><path d="' + ticks + '" stroke="#3B220F" stroke-width=".9"/></svg>';
      } else if(tg === 'teacher'){
        let bands = ''; [70, 150, 250, 330].forEach(x=>{ bands += '<rect x="' + (x - 5) + '" y="86" width="10" height="44" rx="3" fill="#5A1E12" stroke="#1A0805" stroke-width=".8"/><path d="M' + (x - 4) + ' 90H' + (x + 4) + 'M' + (x - 4) + ' 126H' + (x + 4) + '" stroke="#E3B865" stroke-width=".9"/>'; });
        motif = '<svg class="aw-motif" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>' + brassL +
          lin('lt', 0, 1, [[0, '#7A2A18', 1], [1, '#3E120A', 1]]) + '</defs>' +
          '<path d="M0 84H400V130H0Z" fill="url(#' + g('lt') + ')"/><path d="M0 84H400" stroke="#1A0805" stroke-width="1.2"/>' +
          '<path d="M0 90H400M0 124H400" stroke="#E3B865" stroke-opacity=".75" stroke-width=".8"/><path d="M0 93H400M0 121H400" stroke="#E3B865" stroke-opacity=".35" stroke-width=".5" stroke-dasharray="1.5 3"/>' + bands +
          '<g fill="none" stroke="#F1DDB4" stroke-opacity=".28" stroke-width=".7"><path d="M20 56Q110 44 196 54M20 64Q110 52 196 62M20 72Q110 60 196 70M204 54Q290 44 380 56M204 62Q290 52 380 64M204 70Q290 60 380 72"/></g>' +
          carve('M200 40V82', 1.6) + '</svg>' +
          '<svg class="aw-mark" viewBox="0 0 24 92" aria-hidden="true" focusable="false"><defs>' + lin('rb', 1, 0, [[0, '#5E1A10', 1], [.5, '#9A3220', 1], [1, '#5E1A10', 1]]) + '</defs>' +
          '<path d="M5 0H19V78L12 70L5 78Z" fill="url(#' + g('rb') + ')" stroke="#2A0A05" stroke-width=".8" stroke-linejoin="round"/><path d="M8 0V72M16 0V72" stroke="#E3B865" stroke-opacity=".45" stroke-width=".5"/>' +
          '<rect x="3" y="4" width="18" height="7" rx="1.5" fill="url(#' + g('ml') + ')" stroke="#24130A" stroke-width=".6"/></svg>';
      } else {
        let bead = ''; for(let x = 26; x <= 374; x += 16) bead += '<ellipse cx="' + x + '" cy="40" rx="4.6" ry="2.4" fill="#2A170C" stroke="#E8C68C" stroke-opacity=".28" stroke-width=".5"/><circle cx="' + (x + 8) + '" cy="40" r="1.2" fill="#E8C68C" fill-opacity=".45"/>';
        motif = '<svg class="aw-motif" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>' + brassL +
          lin('qu', 1, 0, [[0, '#F6E8C8', 1], [1, '#C9A979', 1]]) + '</defs>' + carve('M18 30H382', 1.4) + bead + carve('M18 50H382', 1.4) +
          '<path d="M24 112C40 96 60 104 70 92M24 112C44 116 58 108 70 92" fill="none" stroke="#E8C68C" stroke-opacity=".3" stroke-width=".9"/>' +
          '<g transform="translate(330 64)"><path d="M-12 46H26L22 30H-8Z" fill="#1E110A" stroke="#24130A" stroke-width=".8"/>' +
          '<rect x="-14" y="10" width="38" height="24" rx="6" fill="url(#' + g('ml') + ')" stroke="#24130A" stroke-width=".9"/><rect x="-2" y="2" width="14" height="10" rx="2.5" fill="url(#' + g('ml') + ')" stroke="#24130A" stroke-width=".8"/>' +
          '<path d="M-10 14H20" stroke="#FFF0CF" stroke-opacity=".5" stroke-width=".7"/></g>' +
          '<g transform="translate(336 66) rotate(-38)"><path d="M0 0C-6 -26 -2 -58 10 -84C14 -60 12 -28 2 2Z" fill="url(#' + g('qu') + ')" stroke="#3B220F" stroke-width=".8"/>' +
          '<path d="M1 0L9 -80" stroke="#7A5A34" stroke-width=".7"/><path d="M2 -14l-5 -4M3 -26l-6 -5M4 -38l-6 -5M5 -50l-6 -5M5 -62l-5 -5" stroke="#9C7A4C" stroke-opacity=".7" stroke-width=".5"/></g></svg>';
      }
    } else {
      motif = '<svg class="aw-motif" viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' + carve('M18 70H382', 3) +
        (tg === 'teacher' ? '<path d="M0 96H400V130H0Z" fill="#5A1E12"/><path d="M0 102H400M0 124H400" stroke="#E3B865" stroke-opacity=".7" stroke-width="1.4"/>' : tg === 'operations' ? '<rect x="6" y="94" width="388" height="16" rx="3" fill="#B07F42" stroke="#24130A" stroke-width="1.4"/>' : '') + '</svg>';
    }
    return '<div class="pt-decor aw-decor" aria-hidden="true">' + wood + '<span class="aw-lacq"></span><span class="pt-breath"></span>' + motif +
      corner('k-ts') + corner('k-te') + corner('k-bs') + corner('k-be') + '<span class="pt-frame aw-carve"></span><span class="pt-rim"></span>' + (mini ? '' : '<span class="pt-sheen"></span>') + '</div>';
  }
