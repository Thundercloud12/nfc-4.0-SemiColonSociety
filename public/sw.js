// Service Worker for Offline Support
const CACHE_NAME = 'maternal-care-v1';
const STATIC_CACHE = 'static-v1';

// URLs to cache for offline functionality
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        // Cache files individually to avoid failing on missing files
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Failed to cache ${url}:`, err);
              return Promise.resolve(); // Continue with other files
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Static resources cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip auth requests to avoid interfering with NextAuth
  if (url.pathname.startsWith('/api/auth/')) {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    // Handle static resources
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const response = await fetch(request.clone());
    
    // If successful, process any pending offline data
    if (response.ok && navigator.onLine) {
      processOfflineQueue();
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, handling offline:', url.pathname);
    
    // Handle specific offline scenarios
    if (url.pathname === '/api/patient/symptom-log' || 
        url.pathname === '/api/asha/appointments') {
      
      if (request.method === 'POST') {
        // Store offline data
        await storeOfflineData(request);
        
        // Return success response to prevent UI errors
        return new Response(JSON.stringify({
          success: true,
          offline: true,
          message: 'Data saved offline. Will sync when connection is restored.'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Return cached response or offline page
    return caches.match(request) || new Response('Offline', { status: 503 });
  }
}

// Handle static resource requests
async function handleStaticRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (response.ok && request.method === 'GET') {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    
    return response;
  } catch (error) {
    // Return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return new Response('Offline', { status: 503 });
  }
}

// Store offline data in IndexedDB
async function storeOfflineData(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    };
    
    // Store in IndexedDB
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline_queue'], 'readwrite');
    const store = transaction.objectStore('offline_queue');
    
    await store.add(requestData);
    console.log('[SW] Offline data stored:', requestData.url);
    
    // Notify client about offline storage
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'OFFLINE_DATA_STORED',
          url: request.url,
          timestamp: requestData.timestamp
        });
      });
    });
    
  } catch (error) {
    console.error('[SW] Error storing offline data:', error);
  }
}

// Process offline queue when connection is restored
async function processOfflineQueue() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline_queue'], 'readwrite');
    const store = transaction.objectStore('offline_queue');
    
    // Get all requests - handle the case where store is empty
    const getAllRequest = store.getAll();
    const allRequests = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    console.log('[SW] Processing', allRequests.length, 'offline requests');
    
    for (const requestData of allRequests) {
      try {
        // Recreate request
        const request = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });
        
        // Try to send
        const response = await fetch(request);
        
        if (response.ok) {
          // Remove from offline queue
          await store.delete(requestData.id || requestData.timestamp);
          console.log('[SW] Offline data synced:', requestData.url);
          
          // Notify client about successful sync
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'OFFLINE_DATA_SYNCED',
                url: requestData.url,
                timestamp: requestData.timestamp
              });
            });
          });
        }
      } catch (error) {
        console.log('[SW] Failed to sync offline data:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Error processing offline queue:', error);
  }
}

// Open IndexedDB for offline storage
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MaternalCareOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create offline queue store
      if (!db.objectStoreNames.contains('offline_queue')) {
        const store = db.createObjectStore('offline_queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('url', 'url', { unique: false });
      }
    };
  });
}

// Listen for online/offline events
self.addEventListener('online', () => {
  console.log('[SW] Connection restored, processing offline queue');
  processOfflineQueue();
});

// Background sync for better offline support
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'PROCESS_OFFLINE_QUEUE') {
    processOfflineQueue();
  }
});
