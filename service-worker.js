const CACHE_NAME = "studyhub-v1";

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            await self.clients.claim();
        })()
    );
});

self.addEventListener("fetch", (event) => {
    // Let the browser load resources normally.
    // Do not cache login or Supabase requests.
});