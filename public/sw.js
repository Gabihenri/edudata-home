const CACHE_VERSION =
  'edudata-agenda-static-v1'

const STATIC_DESTINATIONS =
  new Set([
    'style',
    'script',
    'font',
    'image',
  ])

self.addEventListener(
  'install',
  () => {
    self.skipWaiting()
  },
)

self.addEventListener(
  'activate',
  (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter(
                (cacheName) =>
                  cacheName.startsWith(
                    'edudata-agenda-',
                  ) &&
                  cacheName !==
                    CACHE_VERSION,
              )
              .map((cacheName) =>
                caches.delete(
                  cacheName,
                ),
              ),
          ),
        )
        .then(() =>
          self.clients.claim(),
        ),
    )
  },
)

self.addEventListener(
  'message',
  (event) => {
    if (
      event.data?.type ===
      'SKIP_WAITING'
    ) {
      self.skipWaiting()
    }
  },
)

self.addEventListener(
  'fetch',
  (event) => {
    const request =
      event.request

    if (
      request.method !== 'GET'
    ) {
      return
    }

    const url =
      new URL(request.url)

    if (
      url.origin !==
      self.location.origin
    ) {
      return
    }

    if (
      url.pathname.startsWith(
        '/api/',
      ) ||
      request.mode ===
        'navigate' ||
      !STATIC_DESTINATIONS.has(
        request.destination,
      )
    ) {
      return
    }

    event.respondWith(
      caches
        .open(
          CACHE_VERSION,
        )
        .then(
          async (cache) => {
            const cachedResponse =
              await cache.match(
                request,
              )

            const networkResponsePromise =
              fetch(request)
                .then(
                  (
                    networkResponse,
                  ) => {
                    if (
                      networkResponse.ok &&
                      networkResponse.type ===
                        'basic'
                    ) {
                      cache.put(
                        request,
                        networkResponse.clone(),
                      )
                    }

                    return networkResponse
                  },
                )
                .catch(
                  () =>
                    cachedResponse,
                )

            return (
              cachedResponse ??
              networkResponsePromise
            )
          },
        ),
    )
  },
)