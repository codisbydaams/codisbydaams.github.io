/* CODIS service worker — v8 (CODIS-V54: App Shell أولاً).
   • v8: الصفحة (index.html) من الكاش فوراً عند كل فتح — لا انتظار للشبكة إطلاقاً (كانت «الشبكة أولاً» بمهلة 3.5ث: كل فتحة
     تنتظر الشبكة، وبشبكة بطيئة/متقطعة ثوانٍ من شاشة فارغة، وبلا شبكة 3.5ث قبل النسخة المخزّنة).
     التحديث بالخلفية: طلب واحد مشروط (ETag/Last-Modified)؛ إن تغيّرت النسخة تُخزَّن كاملة أولاً ثم تُبلَّغ الصفحة
     ({type:'codis-update'}) — الصفحة تعيد التحميل إن كانت ما تزال بشاشة البداية بلا أي لمسة، وإلا تُطبَّق النسخة بالفتحة القادمة.
     نسخة واحدة فقط للصفحة بالكاش (المفتاح ./index.html)؛ './' و'./?code=…' (عودة تسجيل الدخول) تُخدَّم منها.
     الكاش القديم لا يُحذف إلا بعد اكتمال تثبيت الجديد (activate بعد نجاح install فقط).
   • طلبات غير GET وطلبات Supabase وكل ما هو خارج الموقع لا تُعترَض ولا تُخزَّن أبداً (بيانات المستخدم لا تمر بالكاش).
   • v6/v7: الصور مدفونة بالصفحة (ملف واحد)؛ لا قائمة صور.
   • v3: Web Push · v4: Background Sync + pushsubscriptionchange (لا رموز ولا بيانات داخل SW). */
const CACHE = 'codis-pwa-v8';
const PAGE = './index.html';
const ASSETS = ['./manifest.webmanifest', './icon.svg'];
let lastCheck = 0;

const scopeUrl = p => new URL(p, self.registration.scope).href;
const sameFile = (a, b) => {
  const ea = a.headers.get('etag'), eb = b.headers.get('etag');
  if (ea && eb) return ea === eb;
  const la = a.headers.get('last-modified'), lb = b.headers.get('last-modified');
  if (la && lb) return la === lb;
  return null;   /* غير معروف من الترويسات */
};
/* رقم الإصدار من <meta name="codis-version"> بأول ~6KB من الصفحة (بلا قراءة 13MB) */
async function versionOf(resp) {
  try {
    const rd = resp.clone().body.getReader(); let got = '', n = 0; const dec = new TextDecoder();
    while (n < 6144) { const { value, done } = await rd.read(); if (done) break; n += value.length; got += dec.decode(value, { stream: true }); if (/codis-version" content="[^"]*"/.test(got)) break; }
    try { rd.cancel(); } catch (e) {}
    const m = /<meta name="codis-version" content="([^"]*)"/.exec(got); return m ? m[1] : '';
  } catch (e) { return ''; }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    /* الصفحة: من الشبكة (أو كاش HTTP إن كان حديثاً)، وإن تعذّر نأخذها من الكاش القديم كما هي — تثبيت بلا شبكة لا يفقد النسخة العاملة */
    let page = null;
    try { const r = await fetch(PAGE, { cache: 'no-cache' }); if (r && r.ok && r.type === 'basic') page = r; } catch (e) {}
    if (!page) { for (const k of await caches.keys()) { if (k === CACHE) continue; const c = await caches.open(k); page = (await c.match(PAGE)) || (await c.match('./')); if (page) break; } }
    if (!page) throw new Error('no page to cache');   /* التثبيت يفشل ⇒ الـSW القديم وكاشه يبقيان كما هما */
    await cache.put(PAGE, page);
    await Promise.all(ASSETS.map(async u => { try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) await cache.put(u, r); } catch (e) {} }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    /* الحذف بعد التأكد أن الكاش الجديد فيه الصفحة فعلاً */
    if (await (await caches.open(CACHE)).match(PAGE)) await Promise.all(keys.filter(k => k !== CACHE && k.indexOf('codis-pwa-') === 0).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* تحقق خلفي واحد كل 15ث كحد أقصى: الجديد يُخزَّن كاملاً (put يفشل لو انقطع التنزيل ⇒ القديم يبقى) ثم تُبلَّغ الصفحات */
async function revalidate(cached) {
  if (Date.now() - lastCheck < 15000) return;   /* فتحات متتالية خلال 15ث: فحص واحد يكفي */
  let fresh;
  try { fresh = await fetch(PAGE, { cache: 'no-cache' }); } catch (e) { return; }
  if (!fresh || !fresh.ok || fresh.type !== 'basic') return;
  lastCheck = Date.now();   /* يُحسب فقط بعد رد ناجح (بلا شبكة لا يؤجّل الفحص التالي) */
  const same = sameFile(cached, fresh);
  if (same === true) return;
  const [vOld, vNew] = await Promise.all([versionOf(cached), versionOf(fresh)]);
  if (same === null && vOld && vOld === vNew) return;   /* بلا ترويسات: نفس الإصدار ⇒ لا تنزيل جديد */
  try { await (await caches.open(CACHE)).put(PAGE, fresh); } catch (e) { return; }   /* القديم يبقى إن انقطع التنزيل */
  if (!vNew || vNew === vOld) return;   /* محتوى تغيّر بنفس الإصدار: يُطبَّق بهدوء بالفتحة القادمة */
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  list.forEach(c => { try { c.postMessage({ type: 'codis-update', version: vNew }); } catch (e) {} });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // Supabase وكل ما هو خارج الموقع: مباشرة من الشبكة
  const scope = new URL(self.registration.scope);
  const rel = url.pathname.slice(scope.pathname.length);
  const isShell = url.pathname.startsWith(scope.pathname) && (rel === '' || rel === 'index.html');
  if (isShell && (req.mode === 'navigate' || req.destination === 'document' || req.mode === 'same-origin' || req.mode === 'no-cors' || req.mode === 'cors')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(PAGE);
      if (cached) { event.waitUntil(revalidate(cached)); return cached; }
      /* أول فتحة بعد التثبيت بلا نسخة مخزّنة: الشبكة، وتُخزَّن للفتحة القادمة */
      try {
        /* بلا نسخة بالكاش (أول فتحة، أو كاش مُسح): طلب عادي يحترم كاش HTTP مثل v7 — لا no-cache هنا */
        const r = await fetch(req);
        if (r && r.ok && r.type === 'basic') event.waitUntil(cache.put(PAGE, r.clone()).catch(() => {}));
        return r;
      } catch (e) { return Response.error(); }
    })());
    return;
  }
  if (req.mode === 'navigate') {   /* مسارات أخرى داخل الموقع: الشبكة، والصفحة المخزّنة احتياطاً بلا اتصال */
    event.respondWith(fetch(req).catch(async () => (await caches.match(PAGE)) || Response.error()));
    return;
  }
  /* بقية الملفات الثابتة (المانيفست/الأيقونة): الكاش أولاً */
  event.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(response => {
        if (response && response.ok && response.type === 'basic') { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(req, copy)).catch(() => {}); }
        return response;
      })
    )
  );
});

/* Web Push: الحمولة من supabase/functions/codis-push — { title, body, tag, url }. نفس الوسم (معرّف حدث المؤقت) يمنع التكرار مع إشعار الصفحة */
self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  const title = d.title || 'CODIS';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '', tag: d.tag || 'codis', renotify: false, lang: 'ar', dir: 'rtl',
    icon: 'icon.svg', badge: 'icon.svg', data: { url: d.url || './' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus(); }
    return self.clients.openWindow ? self.clients.openWindow(target) : null;
  }));
});

/* Background Sync: عند عودة الاتصال يرسل SW رسالة لكل صفحة مفتوحة لتبدأ المزامنة (لا بيانات ولا رموز داخل SW) */
self.addEventListener('sync', event => {
  if (event.tag !== 'codis-sync') return;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { list.forEach(c => c.postMessage({ type: 'codis-sync' })); }));
});

/* انتهاء/تبديل اشتراك Push من المتصفح: الصفحة هي التي تملك المفتاح العام وجلسة الحساب، فنطلب منها إعادة الاشتراك */
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => { list.forEach(c => c.postMessage({ type: 'codis-push-resub' })); }));
});
