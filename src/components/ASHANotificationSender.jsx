'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ASHANotificationSender() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('appointment_reminder');
  const [customMessage, setCustomMessage] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const handleSendNotifications = async () => {
    if (selectedType === 'custom' && !customMessage.trim()) {
      alert('Please enter a custom message');
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/push/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationType: selectedType,
          customMessage: selectedType === 'custom' ? customMessage.trim() : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setLastResult({
          success: true,
          message: data.message,
          stats: data.stats
        });
        
        // Clear custom message after successful send
        if (selectedType === 'custom') {
          setCustomMessage('');
        }
      } else {
        setLastResult({
          success: false,
          message: data.error || 'Failed to send notifications'
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      setLastResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const notificationTypes = [
    {
      value: 'appointment_reminder',
      label: '📅 Appointment Reminders',
      description: 'Remind patients about upcoming appointments'
    },
    {
      value: 'health_checkup',
      label: '🩺 Health Check-up Reminder',
      description: 'Encourage patients to log symptoms and schedule checkups'
    },
    {
      value: 'custom',
      label: '📢 Custom Message',
      description: 'Send a personalized message to all patients'
    }
  ];

  if (session?.user?.role !== 'asha') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📱</span>
            <span>Send Notifications</span>
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Send push notifications to all your assigned patients
          </p>
        </div>
      </div>

      {/* Notification Type Selection */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Notification Type:
        </label>
        {notificationTypes.map((type) => (
          <div
            key={type.value}
            className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              selectedType === type.value
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
            }`}
            onClick={() => setSelectedType(type.value)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="notificationType"
                value={type.value}
                checked={selectedType === type.value}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mr-3 text-pink-500"
              />
              <div>
                <div className="font-medium text-gray-800">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Message Input */}
      {selectedType === 'custom' && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Custom Message:
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter your message for all patients..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            rows={4}
            maxLength={250}
          />
          <div className="text-sm text-gray-500 mt-1">
            {customMessage.length}/250 characters
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={handleSendNotifications}
        disabled={isLoading || (selectedType === 'custom' && !customMessage.trim())}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-6 rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Sending Notifications...</span>
          </>
        ) : (
          <>
            <span>📤</span>
            <span>Send Notifications to All Patients</span>
          </>
        )}
      </button>

      {/* Result Display */}
      {lastResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          lastResult.success 
            ? 'bg-green-100 border border-green-300 text-green-800'
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          <div className="flex items-center gap-2 font-semibold mb-2">
            <span>{lastResult.success ? '✅' : '❌'}</span>
            <span>{lastResult.success ? 'Success!' : 'Error'}</span>
          </div>
          <p className="text-sm">{lastResult.message}</p>
          
          {lastResult.success && lastResult.stats && (
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Patients:</span> {lastResult.stats.totalPatients}
              </div>
              <div>
                <span className="font-medium">Devices Notified:</span> {lastResult.stats.devicesNotified}
              </div>
              <div>
                <span className="font-medium">Total Subscriptions:</span> {lastResult.stats.totalSubscriptions}
              </div>
              <div>
                <span className="font-medium">Failed:</span> {lastResult.stats.failedNotifications}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-500 mt-0.5">💡</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Notifications are sent to all your assigned patients</li>
              <li>• Only patients who have enabled notifications will receive them</li>
              <li>• Patients can click notifications to open the app directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
