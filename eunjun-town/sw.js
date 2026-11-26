// 은준이 마을 오프라인 캐시. 내용을 고쳐서 다시 올릴 때는 아래 버전 숫자를 올려 주세요.
const CACHE = "eunjun-town-v1";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("eunjun-town-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  const same = u.origin === self.location.origin;
  // 화면(html)은 인터넷이 되면 늘 새 것을 먼저 받아요 → 고친 내용이 바로 보여요. 인터넷이 없으면 저장해 둔 화면.
  if (same && (e.request.mode === "navigate" || u.pathname.endsWith(".html") || u.pathname.endsWith("/"))) {
    e.respondWith(caches.open(CACHE).then(c => fetch(u.origin + u.pathname, {cache: "no-cache"}).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => c.match(e.request, {ignoreSearch: true}).then(h => h || c.match("index.html")))));
    return;
  }
  // 글꼴은 한 번 받으면 저장해 두고 써요 (인터넷이 없어도 같은 글씨체)
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(CACHE).then(async c => { const h = await c.match(e.request); const f = fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(() => h); return h || f; }));
    return;
  }
  if (!same) return;
  e.respondWith(caches.open(CACHE).then(async c => { const h = await c.match(e.request); if (h) return h; const r = await fetch(e.request); if (r && r.ok) c.put(e.request, r.clone()); return r; }));
});
