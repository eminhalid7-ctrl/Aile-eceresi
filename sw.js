// Aile Şeceresi — çevrimdışı açılış için önbellek
const CACHE = "secere-v8";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // bulut isteklerine dokunma
  // önce ağdan dene (güncel sürüm), olmazsa önbellekten aç
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
});
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow("./"))); });
// doğum günü kontrolü (yüklü uygulamada telefon gün içinde çalıştırır)
async function checkBdays(){
  try{const c=await caches.open("secere-data");const r=await c.match("bdays.json");if(!r)return;const d=await r.json();if(!d.on)return;
    const now=new Date(),key=now.toISOString().slice(0,10);const last=await c.match("bd-last");if(last&&(await last.text())===key)return;
    const todays=d.list.filter(x=>x.m===now.getMonth()+1&&x.d===now.getDate());if(!todays.length)return;
    const ug=d.lang==="ug";const body=todays.map(x=>x.n+(x.y?" · "+(now.getFullYear()-x.y)+(ug?" ياش":" yaş"):"")).join("\n");
    await self.registration.showNotification("🎂 "+(ug?"بۈگۈن تۇغۇلغان كۈنى":"Bugün doğum günü"),{body,icon:"icon-192.png",tag:"bd-"+key});
    await c.put("bd-last",new Response(key));}catch(e){}
}
self.addEventListener("periodicsync",e=>{if(e.tag==="bday")e.waitUntil(checkBdays());});
