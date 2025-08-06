'use client';
import { useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function PushNotificationSetup() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      alert('🔔 Push notifications enabled! You\'ll receive important updates from your ASHA worker.');
    } else {
      alert('❌ Failed to enable notifications. Please check your browser settings and try again.');
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
    alert('🔕 Push notifications disabled.');
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
        <div className="flex items-center">
          <span className="mr-2">⚠️</span>
          <span className="text-sm">Push notifications are not supported in your browser.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-800 mb-1 flex items-center">
            📱 Push Notifications
          </h3>
          <p className="text-blue-700 text-sm">
            Get instant alerts for appointments, health reminders, and important updates from your ASHA worker.
          </p>
        </div>
        
        <div className="ml-4">
          {!isSubscribed ? (
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <span>🔔</span>
                  <span>Enable</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center text-green-600 font-medium">
                <span className="mr-2">✅</span>
                <span>Enabled</span>
              </div>
              <button
                onClick={handleUnsubscribe}
                disabled={isLoading}
                className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-all duration-200"
              >
                {isLoading ? 'Disabling...' : 'Disable'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isSubscribed && (
        <div className="mt-3 p-2 bg-green-100 rounded text-green-800 text-xs">
          🎉 You're all set! You'll receive notifications about appointments and health reminders.
        </div>
      )}
    </div>
  );
}
