/* CODIS-V50 (3.37.0) — هوية المتجر: أيقونات المتجر المرسومة (SVG ثنائي النغمة) + وسم «حالة هادئة» لحركة المتجر.
   لا منطق بيع/رصيد/ملكية هنا إطلاقاً: يرسم أيقونات الشريط وزر السجل فقط ويقرأ تفضيل تقليل الحركة الموجود أصلاً (econCalm).
   كل أيقونة: شبكة 24 · سطح ثانوي بنصف شفافية (currentColor) + خط حبر موحّد · طرفان مستديران · تُحدَّد اللون والحجم بالـCSS. أي قسم جديد يسجَّل بـeconStoreRegister يجد أيقونته هنا بالمفتاح أو يرجع إلى codisIcon. */
const ECON_STORE_ICONS = Object.freeze({
  /* الكروت: ثلاث بطاقات مروحية وختم نجمة */
  shop_cards:
    '<rect x="9.2" y="2.9" width="10.6" height="14.4" rx="2.1" transform="rotate(11 14.5 10.1)" fill="currentColor" fill-opacity=".14"/>' +
    '<rect x="4" y="5.2" width="11.8" height="15.6" rx="2.3" fill="currentColor" fill-opacity=".2"/>' +
    '<path d="M9.9 9.5l1 2.05 2.25.32-1.63 1.58.39 2.24-2.01-1.06-2.01 1.06.39-2.24-1.63-1.58 2.25-.32z" fill="currentColor" fill-opacity=".55"/>' +
    '<path d="M6.6 18.2h6.6" stroke-opacity=".7"/>',
  /* البكجات: صندوق مقتنيات بشريط وختم شمع */
  shop_packs:
    '<path d="M4.2 10.2h15.6v9.2a1.7 1.7 0 0 1-1.7 1.7H5.9a1.7 1.7 0 0 1-1.7-1.7z" fill="currentColor" fill-opacity=".2"/>' +
    '<path d="M3 7.1c0-.9.7-1.6 1.6-1.6h14.8c.9 0 1.6.7 1.6 1.6v3.1H3z" fill="currentColor" fill-opacity=".1"/>' +
    '<path d="M12 5.5v15.6"/>' +
    '<path d="M12 5.5C10.9 3.1 8 2.6 7.3 4s1.2 1.5 4.7 1.5zm0 0c1.1-2.4 4-2.9 4.7-1.5s-1.2 1.5-4.7 1.5z"/>' +
    '<circle cx="12" cy="13.6" r="2.15" fill="currentColor" fill-opacity=".6"/>',
  /* المظاهر: لوحة ألوان مع بقع ولمعة */
  shop_skins:
    '<path d="M12 3.2c-5 0-9 3.6-9 8.1 0 4.3 3.5 7.8 7.7 7.8h1.1c1.3 0 2-1.1 1.6-2.2-.4-1 .1-2.1 1.2-2.1h1.9c2.3 0 3.9-1.6 3.9-3.8 0-4.3-3.9-7.8-8.4-7.8z" fill="currentColor" fill-opacity=".16"/>' +
    '<circle cx="7.5" cy="11.2" r="1.25" fill="currentColor" fill-opacity=".7"/><circle cx="10.6" cy="7.4" r="1.25" fill="currentColor" fill-opacity=".7"/><circle cx="15.6" cy="8.1" r="1.25" fill="currentColor" fill-opacity=".7"/>' +
    '<path d="M17.3 15.4l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" fill="currentColor" fill-opacity=".85" stroke-width="1.1"/>',
  /* السجل: دفتر مفتوح بشريط مرجعي */
  archive:
    '<path d="M3.6 5.6c0-.9.7-1.6 1.6-1.6H12v15.2H5.2c-.9 0-1.6.7-1.6 1.6z" fill="currentColor" fill-opacity=".2"/>' +
    '<path d="M20.4 5.6c0-.9-.7-1.6-1.6-1.6H12v15.2h6.8c.9 0 1.6.7 1.6 1.6z" fill="currentColor" fill-opacity=".1"/>' +
    '<path d="M16.4 4v5.6l-1.55-1.2-1.55 1.2V4" fill="currentColor" fill-opacity=".55"/>' +
    '<path d="M6.3 8.4h3.1M6.3 11.4h3.1M6.3 14.4h3.1" stroke-opacity=".7" stroke-width="1.3"/>'
});
function econStoreIconHtml(name, size){
  const b = ECON_STORE_ICONS[name], px = size || 32;
  if(!b) return codisIcon(name, { size:'hero' });
  return '<svg class="ico ico-hero sx-ico" data-icon="' + name + '" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + b + '</svg>';
}
/* حركة المتجر: صنف على الجذر يعكس تفضيل تقليل الحركة الموجود (CSS يقرأه مع prefers-reduced-motion) */
function econStoreCalmSync(){ try{ document.documentElement.classList.toggle('sx-calm', !!econCalm()); }catch(e){} }
