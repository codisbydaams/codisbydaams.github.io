  /* CODIS-V66 · BLAZING METEOR — طبقة الغرفة (خلف المحتوى، pointer-events:none). حتمي تماماً (لا uid ولا عشوائية ⇒ ناتج المتجر مطابق حرفياً).
     الطبقات: سماء (رموز الغرفة) ← نقش هندسي خاص بالغرفة ← هالة تتنفس ← رسم الغرفة (مدارات/رادار/محطات/دروع) بمسار طاقة واحد متحرك ←
     نيزكان متباعدان ← طبقة التفاعل .bm-fx (ضوء يتبع المؤشر + 3 حلقات لمس + 6 شرارات، عدد ثابت يُعاد استعماله). المصغّرة: ثابتة بلا تفاعل. */
  blazingMeteor:function(d, u, mini){
    const tg = d && d.target, S = (vb, body, cls)=>'<svg class="bm-motif ' + cls + '" viewBox="' + vb + '" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">' + body + '</svg>';
    let motif = '';
    if(tg === 'planning') motif = S('0 0 400 240',
      '<g fill="none" stroke-linecap="round"><path class="bm-l1" d="M-20 196C70 120 190 82 420 70"/><path class="bm-l2" d="M-20 226C110 160 230 130 420 126"/><path class="bm-l2" d="M40 -10C120 60 250 96 420 104"/>' +
      '<path class="bm-flow" d="M-20 196C70 120 190 82 420 70"/></g><g class="bm-node"><circle cx="96" cy="140" r="3.2"/><circle cx="214" cy="96" r="2.4"/><circle cx="318" cy="76" r="3.6"/><circle cx="268" cy="132" r="1.8"/></g>' +
      '<g class="bm-node2"><circle cx="318" cy="76" r="9"/></g><path class="bm-l3" d="M96 140L214 96L318 76M214 96L268 132" fill="none"/>', 'is-plan');
    else if(tg === 'operations') motif = S('0 0 400 240',
      '<g fill="none"><circle class="bm-l2" cx="356" cy="30" r="70"/><circle class="bm-l2" cx="356" cy="30" r="128"/><circle class="bm-l1" cx="356" cy="30" r="186"/>' +
      '<path class="bm-l3" d="M356 30L170 30M356 30L356 216M356 30L224 162"/><path class="bm-flow" d="M170 30A186 186 0 0 0 224 162"/></g>' +
      '<g class="bm-tick">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i=>{ const a = Math.PI * (.5 + i / 16), c = Math.cos(a), s = Math.sin(a), k = i % 2 ? 6 : 11;
        return '<path d="M' + (356 + 186 * c).toFixed(1) + ' ' + (30 + 186 * s).toFixed(1) + 'l' + (-k * c).toFixed(1) + ' ' + (-k * s).toFixed(1) + '"/>'; }).join('') + '</g>' +
      '<g class="bm-node"><circle cx="262" cy="96" r="2.6"/><circle cx="300" cy="150" r="2"/></g>', 'is-ops');
    else if(tg === 'teacher') motif = S('0 0 400 240',
      '<g fill="none"><ellipse class="bm-l1" cx="80" cy="64" rx="200" ry="58" transform="rotate(-12 80 64)"/><ellipse class="bm-l2" cx="80" cy="64" rx="136" ry="38" transform="rotate(-12 80 64)"/>' +
      '<ellipse class="bm-flow" cx="80" cy="64" rx="200" ry="58" transform="rotate(-12 80 64)"/></g>' +
      '<g class="bm-gem"><path d="M268 22l7 9-7 9-7-9z"/><path d="M196 104l5 6-5 6-5-6z"/><path d="M330 92l4 5-4 5-4-5z"/></g><g class="bm-node"><circle cx="80" cy="64" r="4"/><circle cx="20" cy="112" r="2"/></g>', 'is-lrn');
    else motif = S('0 0 400 240',
      '<g fill="none" class="bm-hex">' + [[300, 26], [338, 48], [338, 92], [300, 114], [262, 92], [262, 48], [376, 26], [376, 114]].map(p=>'<path d="M' + p[0] + ' ' + (p[1] - 22) + 'l19 11v22l-19 11-19-11v-22z"/>').join('') + '</g>' +
      '<path class="bm-l1" d="M-10 200L120 170L190 182L420 120" fill="none"/><path class="bm-flow" d="M232 8l-26 46h20l-22 48" fill="none"/><path class="bm-bolt" d="M232 8l-26 46h20l-22 48" fill="none"/>', 'is-dsc');
    const fx = mini ? '' : '<span class="bm-fx" aria-hidden="true"><i class="bm-light"></i><i class="bm-ring"></i><i class="bm-ring"></i><i class="bm-ring"></i><i class="bm-sparks"><b></b><b></b><b></b><b></b><b></b><b></b></i></span>';
    return '<div class="pt-decor bm-decor" aria-hidden="true"><span class="bm-sky"></span><span class="bm-tex"></span><span class="bm-orb"></span>' + motif +
      (mini ? '' : '<span class="bm-pulse"></span><span class="bm-meteor m1"></span><span class="bm-meteor m2"></span><span class="bm-rim"></span>') + fx + '</div>';
  },
