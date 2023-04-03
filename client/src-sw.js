const { warmStrategyCache } = require("workbox-recipes");
const { CacheFirst } = require("workbox-strategies");
const { registerRoute, setCatchHandler } = require("workbox-routing");
const { CacheableResponsePlugin } = require("workbox-cacheable-response");
const { ExpirationPlugin } = require("workbox-expiration");
const { precacheAndRoute } = require("workbox-precaching/precacheAndRoute");

precacheAndRoute(self.__WB_MANIFEST);

const pageCache = new CacheFirst({
  cacheName: "page-cache",
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200],
    }),
    new ExpirationPlugin({
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

warmStrategyCache({
  urls: ["/index.html", "/"],
  strategy: pageCache,
});

registerRoute(({ request }) => request.mode === "navigate", pageCache);

// TODO: Implement asset caching
self.addEventListener("install", (event) => {
  const files = ["/offline.html"];
  event.waitUntil(
    self.caches.open("offline-fallbacks").then((cache) => cache.addAll(files))
  );
});

setCatchHandler(async (options) => {
  const destination = options.request.destination;
  const cache = await self.caches.open("offline-fallbacks");
  if (destination === "document") {
    return (await cache.match("/offline.html")) || Response.error();
  }
  return Response.error();
});

registerRoute();
