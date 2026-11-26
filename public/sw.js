// Service worker da Dominion Mentory: só recebe e mostra notificações push.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (_) {
    d = { titulo: "Dominion Mentory", texto: event.data ? event.data.text() : "" };
  }
  const titulo = d.titulo || "Dominion Mentory";
  const opcoes = {
    body: d.texto || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    lang: "pt-BR",
    timestamp: Date.now(),
    data: { url: d.link || "/painel" },
  };
  if (d.imagem) opcoes.image = d.imagem;
  if (d.tag) {
    opcoes.tag = d.tag;
    opcoes.renotify = true;
  }
  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL((event.notification.data && event.notification.data.url) || "/painel", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) {
        if (j.url.startsWith(self.location.origin) && "focus" in j) {
          if ("navigate" in j) j.navigate(destino);
          return j.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
