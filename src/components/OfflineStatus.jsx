"use client";

import { useState, useEffect } from 'react';
import offlineManager from '@/lib/offlineManager';

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState({ symptoms: 0, appointments: 0, total: 0 });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info'); // 'info', 'success', 'warning'

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);
    updatePendingCount();

    // Override offline manager notification methods
    offlineManager.notifyConnectionChange = (online) => {
      setIsOnline(online);
      if (online) {
        showMessage('🌐 Connection restored! Syncing offline data...', 'success');
        updatePendingCount();
      } else {
        showMessage('📴 You are offline. Data will be saved locally and synced when connection is restored.', 'warning');
      }
    };

    offlineManager.notifyOfflineStorage = (data) => {
      showMessage('💾 Data saved offline and will sync when connection is restored.', 'info');
      updatePendingCount();
    };

    offlineManager.notifyDataSynced = (data) => {
      showMessage('✅ Offline data synced successfully!', 'success');
      updatePendingCount();
    };

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 30000); // Every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    try {
      const count = await offlineManager.getPendingDataCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error updating pending count:', error);
    }
  };

  const showMessage = (message, type) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  const handleManualSync = async () => {
    if (isOnline) {
      showMessage('🔄 Syncing offline data...', 'info');
      await offlineManager.triggerSync();
    } else {
      showMessage('📴 Cannot sync while offline. Please check your connection.', 'warning');
    }
  };

  const getNotificationColor = () => {
    switch (notificationType) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  return (
    <>
      {/* Connection Status Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        !isOnline ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-semibold">
          <div className="flex items-center justify-center gap-2">
            <span>📴</span>
            <span>You are offline</span>
            {pendingCount.total > 0 && (
              <span className="bg-red-600 px-2 py-1 rounded-full text-xs">
                {pendingCount.total} pending sync
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Offline Indicator */}
      {pendingCount.total > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-white rounded-lg shadow-lg border-2 border-orange-300 p-4 max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">💾</span>
                <span className="font-semibold text-gray-800">Offline Data</span>
              </div>
              <button
                onClick={() => setPendingCount({ symptoms: 0, appointments: 0, total: 0 })}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <div>📝 {pendingCount.symptoms} symptom logs</div>
              <div>📅 {pendingCount.appointments} appointments</div>
            </div>
            
            {isOnline && (
              <button
                onClick={handleManualSync}
                className="w-full px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-semibold"
              >
                🔄 Sync Now
              </button>
            )}
            
            {!isOnline && (
              <div className="text-xs text-gray-500 text-center">
                Will sync automatically when connection is restored
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`border-l-4 p-4 rounded-lg shadow-lg ${getNotificationColor()} transition-all duration-300`}>
            <div className="flex justify-between items-start">
              <div className="flex-1 text-sm">
                {notificationMessage}
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="ml-3 text-xl leading-none hover:opacity-70"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Indicator (Bottom) */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        isOnline ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="animate-pulse">💾</span>
            <span>Offline mode: Your data is being saved locally</span>
          </div>
        </div>
      </div>
    </>
  );
}
