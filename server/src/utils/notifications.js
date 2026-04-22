/**
 * Utility to send push notifications using Expo's Push API
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    console.log('Skipping push notification: Invalid or missing token');
    return;
  }

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        _displayInForeground: true, // Specific for Expo to show even if app is open
      }),
    });

    const result = await response.json();
    if (result.errors) {
      console.error('Expo Push Error:', result.errors);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = { sendPushNotification };
