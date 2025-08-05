// Offline Support Utilities
class OfflineManager {
  constructor() {
    this.dbName = 'MaternalCareOffline';
    this.dbVersion = 2; // Incremented for new stores
    this.db = null;
    this.isOnline = navigator.onLine;
    this.pendingSync = [];
    
    this.initializeDB();
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  // Initialize IndexedDB
  async initializeDB() {
    try {
      this.db = await this.openDB();
      console.log('[OfflineManager] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineManager] Failed to initialize database:', error);
    }
  }

  // Open IndexedDB connection
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
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
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
        
        // Create offline symptoms store
        if (!db.objectStoreNames.contains('offline_symptoms')) {
          const store = db.createObjectStore('offline_symptoms', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
        
        // Create offline appointments store
        if (!db.objectStoreNames.contains('offline_appointments')) {
          const store = db.createObjectStore('offline_appointments', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ashaId', 'ashaId', { unique: false });
        }
        
        // Create family data cache store
        if (!db.objectStoreNames.contains('family_data_cache')) {
          const store = db.createObjectStore('family_data_cache', { 
            keyPath: 'familyMemberId'
          });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
        
        // Create ASHA patient data cache store
        if (!db.objectStoreNames.contains('asha_patient_cache')) {
          const store = db.createObjectStore('asha_patient_cache', { 
            keyPath: 'cacheKey' // Format: "ashaId_patientId"
          });
          store.createIndex('ashaId', 'ashaId', { unique: false });
          store.createIndex('patientId', 'patientId', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[OfflineManager] Connection restored');
      this.syncOfflineData();
      this.notifyConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[OfflineManager] Connection lost');
      this.notifyConnectionChange(false);
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[OfflineManager] Service Worker registered:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[OfflineManager] New service worker available');
              // Optionally notify user about update
            }
          });
        });
      } catch (error) {
        console.error('[OfflineManager] Service Worker registration failed:', error);
      }
    }
  }

  // Handle service worker messages
  handleServiceWorkerMessage(data) {
    console.log('[OfflineManager] Message from SW:', data);
    
    switch (data.type) {
      case 'OFFLINE_DATA_STORED':
        this.notifyOfflineStorage(data);
        break;
      case 'OFFLINE_DATA_SYNCED':
        this.notifyDataSynced(data);
        break;
    }
  }

  // Store symptom log offline
  async storeSymptomLogOffline(symptomData, userId) {
    try {
      if (!this.db) await this.initializeDB();
      
      const offlineData = {
        type: 'symptom_log',
        data: symptomData,
        userId: userId,
        timestamp: Date.now(),
        synced: false
      };

      const transaction = this.db.transaction(['offline_symptoms'], 'readwrite');
      const store = transaction.objectStore('offline_symptoms');
      const result = await store.add(offlineData);
      
      console.log('[OfflineManager] Symptom log stored offline:', result);
      return { success: true, offline: true, id: result };
    } catch (error) {
      console.error('[OfflineManager] Error storing symptom log offline:', error);
      throw error;
    }
  }

  // Store appointment offline
  async storeAppointmentOffline(appointmentData, ashaId) {
    try {
      if (!this.db) await this.initializeDB();
      
      const offlineData = {
        type: 'appointment',
        data: appointmentData,
        ashaId: ashaId,
        timestamp: Date.now(),
        synced: false
      };

      const transaction = this.db.transaction(['offline_appointments'], 'readwrite');
      const store = transaction.objectStore('offline_appointments');
      const result = await store.add(offlineData);
      
      console.log('[OfflineManager] Appointment stored offline:', result);
      return { success: true, offline: true, id: result };
    } catch (error) {
      console.error('[OfflineManager] Error storing appointment offline:', error);
      throw error;
    }
  }

  // Get pending offline data count
  async getPendingDataCount() {
    try {
      if (!this.db) await this.initializeDB();
      
      const symptomsTransaction = this.db.transaction(['offline_symptoms'], 'readonly');
      const symptomsStore = symptomsTransaction.objectStore('offline_symptoms');
      
      const symptomsCountRequest = symptomsStore.count();
      const symptomsCount = await new Promise((resolve, reject) => {
        symptomsCountRequest.onsuccess = () => resolve(symptomsCountRequest.result);
        symptomsCountRequest.onerror = () => reject(symptomsCountRequest.error);
      });
      
      const appointmentsTransaction = this.db.transaction(['offline_appointments'], 'readonly');
      const appointmentsStore = appointmentsTransaction.objectStore('offline_appointments');
      
      const appointmentsCountRequest = appointmentsStore.count();
      const appointmentsCount = await new Promise((resolve, reject) => {
        appointmentsCountRequest.onsuccess = () => resolve(appointmentsCountRequest.result);
        appointmentsCountRequest.onerror = () => reject(appointmentsCountRequest.error);
      });
      
      return {
        symptoms: symptomsCount,
        appointments: appointmentsCount,
        total: symptomsCount + appointmentsCount
      };
    } catch (error) {
      console.error('[OfflineManager] Error getting pending data count:', error);
      return { symptoms: 0, appointments: 0, total: 0 };
    }
  }

  // Sync offline data when connection is restored
  async syncOfflineData() {
    try {
      if (!this.isOnline || !this.db) return;
      
      console.log('[OfflineManager] Starting offline data sync...');
      
      // Sync symptom logs
      await this.syncSymptomLogs();
      
      // Sync appointments
      await this.syncAppointments();
      
      console.log('[OfflineManager] Offline data sync completed');
    } catch (error) {
      console.error('[OfflineManager] Error syncing offline data:', error);
    }
  }

  // Sync symptom logs
  async syncSymptomLogs() {
    try {
      const transaction = this.db.transaction(['offline_symptoms'], 'readwrite');
      const store = transaction.objectStore('offline_symptoms');
      
      // Get all symptoms with proper error handling
      const getAllRequest = store.getAll();
      const allSymptoms = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      console.log('[OfflineManager] Syncing', allSymptoms.length, 'symptom logs');
      
      for (const symptomRecord of allSymptoms) {
        try {
          const response = await fetch('/api/patient/symptom-log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(symptomRecord.data),
          });
          
          if (response.ok) {
            // Remove from offline storage
            await store.delete(symptomRecord.id);
            console.log('[OfflineManager] Symptom log synced and removed from offline storage');
            
            // Notify about successful sync
            this.notifyDataSynced({
              type: 'symptom_log',
              timestamp: symptomRecord.timestamp
            });
          }
        } catch (error) {
          console.log('[OfflineManager] Failed to sync symptom log:', error);
        }
      }
    } catch (error) {
      console.error('[OfflineManager] Error syncing symptom logs:', error);
    }
  }

  // Sync appointments
  async syncAppointments() {
    try {
      const transaction = this.db.transaction(['offline_appointments'], 'readwrite');
      const store = transaction.objectStore('offline_appointments');
      
      // Get all appointments with proper error handling
      const getAllRequest = store.getAll();
      const allAppointments = await new Promise((resolve, reject) => {
        getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      });
      
      console.log('[OfflineManager] Syncing', allAppointments.length, 'appointments');
      
      for (const appointmentRecord of allAppointments) {
        try {
          const response = await fetch('/api/asha/appointments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentRecord.data),
          });
          
          if (response.ok) {
            // Remove from offline storage
            await store.delete(appointmentRecord.id);
            console.log('[OfflineManager] Appointment synced and removed from offline storage');
            
            // Notify about successful sync
            this.notifyDataSynced({
              type: 'appointment',
              timestamp: appointmentRecord.timestamp
            });
          }
        } catch (error) {
          console.log('[OfflineManager] Failed to sync appointment:', error);
        }
      }
    } catch (error) {
      console.error('[OfflineManager] Error syncing appointments:', error);
    }
  }

  // Notification callbacks (to be overridden by components)
  notifyConnectionChange(isOnline) {
    // Override this in components to handle connection changes
    console.log('[OfflineManager] Connection status changed:', isOnline);
  }

  notifyOfflineStorage(data) {
    // Override this in components to handle offline storage notifications
    console.log('[OfflineManager] Data stored offline:', data);
  }

  notifyDataSynced(data) {
    // Override this in components to handle sync notifications
    console.log('[OfflineManager] Data synced:', data);
  }

  // Check if online
  isConnected() {
    return this.isOnline;
  }

  // Store family data for offline viewing
  async storeFamilyDataOffline(familyData) {
    try {
      if (!this.db) await this.initializeDB();
      
      const transaction = this.db.transaction(['family_data_cache'], 'readwrite');
      const store = transaction.objectStore('family_data_cache');
      
      await store.put(familyData);
      console.log('[OfflineManager] Family data cached for offline viewing');
      
      return { success: true };
    } catch (error) {
      console.error('[OfflineManager] Error storing family data offline:', error);
      throw error;
    }
  }

  // Get cached family data
  async getCachedFamilyData(familyMemberId) {
    try {
      if (!this.db) await this.initializeDB();
      
      const transaction = this.db.transaction(['family_data_cache'], 'readonly');
      const store = transaction.objectStore('family_data_cache');
      
      const request = store.get(familyMemberId);
      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      return result || null;
    } catch (error) {
      console.error('[OfflineManager] Error getting cached family data:', error);
      return null;
    }
  }

  // Store ASHA patient data for offline viewing
  async storeAshaPatientDataOffline(ashaId, patientId, patientData) {
    try {
      if (!this.db) await this.initializeDB();
      
      const cacheKey = `${ashaId}_${patientId}`;
      const cacheData = {
        cacheKey,
        ashaId,
        patientId,
        patient: patientData,
        cachedAt: Date.now()
      };
      
      const transaction = this.db.transaction(['asha_patient_cache'], 'readwrite');
      const store = transaction.objectStore('asha_patient_cache');
      
      await store.put(cacheData);
      console.log('[OfflineManager] ASHA patient data cached for offline viewing');
      
      return { success: true };
    } catch (error) {
      console.error('[OfflineManager] Error storing ASHA patient data offline:', error);
      throw error;
    }
  }

  // Get cached ASHA patient data
  async getCachedAshaPatientData(ashaId, patientId) {
    try {
      if (!this.db) await this.initializeDB();
      
      const cacheKey = `${ashaId}_${patientId}`;
      const transaction = this.db.transaction(['asha_patient_cache'], 'readonly');
      const store = transaction.objectStore('asha_patient_cache');
      
      const request = store.get(cacheKey);
      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      return result || null;
    } catch (error) {
      console.error('[OfflineManager] Error getting cached ASHA patient data:', error);
      return null;
    }
  }

  // Manual sync trigger
  async triggerSync() {
    if (this.isOnline) {
      await this.syncOfflineData();
    } else {
      console.log('[OfflineManager] Cannot sync - device is offline');
    }
  }

  // Clear all offline data
  async clearOfflineData() {
    try {
      if (!this.db) await this.initializeDB();
      
      const transaction = this.db.transaction(['offline_symptoms', 'offline_appointments'], 'readwrite');
      
      await transaction.objectStore('offline_symptoms').clear();
      await transaction.objectStore('offline_appointments').clear();
      
      console.log('[OfflineManager] All offline data cleared');
    } catch (error) {
      console.error('[OfflineManager] Error clearing offline data:', error);
    }
  }
}

// Create global instance
const offlineManager = new OfflineManager();

export default offlineManager;
