/* همس — يشغّل اللعبة بدون إنترنت */
const V = 'hams-v2';
const FONTS = V + '-fonts';
const CORE = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);

  if (u.origin === location.origin) {
    // الصفحة نفسها: الشبكة أولًا عشان توصل التحديثات، والنسخة المحفوظة لو ما فيه نت
    if (r.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html')) {
      e.respondWith(
        fetch(r)
          .then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); return res; })
          .catch(() => caches.match('./index.html'))
      );
      return;
    }
    // الأيقونات والملفات الثابتة: المحفوظ أولًا
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res;
      }))
    );
    return;
  }

  // خطوط Google: نحفظها أول مرة وتشتغل بعدها بدون نت
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONTS).then(c => c.match(r).then(m => m || fetch(r).then(res => { c.put(r, res.clone()); return res; })))
    );
  }
});
