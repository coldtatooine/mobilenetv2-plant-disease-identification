// Service Worker para PWA
const CACHE_NAME = 'plant-disease-v1';
const STATIC_CACHE = 'plant-disease-static-v1';
const MODEL_CACHE = 'plant-disease-model-v1';

// Assets para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/class_names.json',
  '/src/model-loader.js',
  '/src/preprocess.js',
  '/src/inference.js',
  '/src/camera.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== MODEL_CACHE) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Cache First para modelo TFJS
  if (url.pathname.includes('web_model_tfjs') || url.pathname.endsWith('.bin')) {
    event.respondWith(
      caches.open(MODEL_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
  
  // Network First para outros recursos
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cachear apenas respostas válidas
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback para cache se offline
        return caches.match(request).then((response) => {
          return response || new Response('Offline', { status: 503 });
        });
      })
  );
});
