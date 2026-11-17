/* ---------- (1) رسمة الصندوق المغلق المملوك — CODIS-V65: نظام إحداثيات واحد ----------
   كل طبقات الرسمة داخل SVG واحد (viewBox 160×100) ⇒ أي حجم يعرض التكوين نفسه بالنسب نفسها بالضبط (التذكرة، التثقيب، اللمعة،
   معيّنات المستوى، الصندوق وظله). المواضع منقولة حرفياً من الرسمة الكبيرة السابقة (صندوق: يسار 33% يمين 7% أعلى/أسفل 10%،
   خانة 120:112 بارتفاع المنطقة، الصورة 97% من الارتفاع وأسفلها 3%؛ الكعب 30% وعمود المعيّنات 40% منه بنسبة 3:1).
   الحجم بالـCSS (عرض فقط، النسبة 8:5). لا معرّفات فريدة ⇒ الناتج حتمي (مقارنة HTML المتجر تبقى كما هي). */
function econObxDefs(){
  /* فلتر الظل المشترك (مرة واحدة بالصفحة؛ عنصر 0×0 غير مخفي بـdisplay:none حتى يبقى المرجع صالحاً بكل المحركات) */
  try{
    if(typeof document === 'undefined' || !document.body || document.getElementById('codis-obx-defs')) return;
    const d = document.createElement('div'); d.id = 'codis-obx-defs'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<svg width="0" height="0" focusable="false"><filter id="codis-obx-sh" x="-25%" y="-25%" width="150%" height="175%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="13.3" stdDeviation="8.9"/></filter></svg>';
    document.body.appendChild(d);
  }catch(e){}
}
function econOwnedBoxArt(tier, o){
  o = o || {}; let t = null; try{ t = CodisBoxes.tier(tier); }catch(e){ t = null; } if(!t) return '';
  econObxDefs();
  /* المعيّنات من الأسفل للأعلى (المستوى 1 أسفل)، 5 × ارتفاع 6.4 + فواصل 4.4 متمركزة عمودياً */
  let lv = ''; for(let i = 1; i <= 5; i++) lv += '<rect x="14.4" y="' + (25.2 + (5 - i) * 10.8).toFixed(1) + '" width="19.2" height="6.4" rx="3.2"' + (i <= t.index ? ' class="on"' : '') + '/>';
  return '<span class="obx-art' + (o.big ? ' is-big' : '') + (o.mini ? ' is-mini' : '') + '" data-tone="' + t.tone + '"' + (o.label === false ? ' aria-hidden="true"' : ' role="img" aria-label="' + escapeHtml(o.label || (t.name + ' مغلق')) + '"') + '>' +
    '<svg class="obx-tk" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><path class="obx-bg" d="M10 4h140a6 6 0 0 1 6 6v24a8 8 0 0 0 0 32v24a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V66a8 8 0 0 0 0-32V10a6 6 0 0 1 6-6Z"/>' +
    '<path class="obx-perf" d="M48 10v80"/><path class="obx-gl" d="M56 12h90"/><g class="obx-lv">' + lv + '</g>' +
    '<image class="obx-img" href="' + econBoxArtUrl(t.index) + '" x="57.94" y="10" width="85.71" height="77.6" preserveAspectRatio="xMidYMid meet" filter="url(#codis-obx-sh)"/></svg></span>';
}
