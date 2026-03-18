/// <reference lib="webworker" />

const CACHE_NAME = 'habitflow-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  ;(self as unknown as ServiceWorkerGlobalScope).skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  ;(self as unknown as ServiceWorkerGlobalScope).clients.claim()
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event: FetchEvent) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip API requests
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        // Update cache in background
        fetch(event.request)
          .then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone())
            })
          })
          .catch(() => {
            // Network failed, use cached version
          })
        return response
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache new requests
          const clonedResponse = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse)
          })
          return networkResponse
        })
        .catch(() => {
          // Network failed, no cache available
          return new Response('Network error', { status: 408 })
        })
    })
  )
})
