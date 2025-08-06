import webpush from 'web-push';

// Configure VAPID details
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

export const sendBulkPushNotifications = async (subscriptions, payload) => {
  const results = await Promise.allSettled(
    subscriptions.map(subscription => 
      sendPushNotification(subscription, payload)
    )
  );

  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;

  const failed = results.length - successful;

  return {
    total: results.length,
    successful,
    failed,
    results
  };
};
