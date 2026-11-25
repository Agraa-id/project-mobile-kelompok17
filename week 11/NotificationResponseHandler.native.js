import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

function toNotificationPayload(notification) {
  return {
    title: notification.request.content.title || 'Notifikasi Lapangan',
    body: notification.request.content.body || '',
    data: notification.request.content.data || {},
  };
}

export default function NotificationResponseHandler({ onReceived, onResponse }) {
  const lastHandledIdentifier = useRef(null);

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      onReceived(toNotificationPayload(notification));
    });

    function handleResponse(response) {
      const { notification } = response;
      const identifier = notification.request.identifier;
      if (identifier === lastHandledIdentifier.current) return;
      lastHandledIdentifier.current = identifier;

      onResponse(toNotificationPayload(notification));
      Notifications.clearLastNotificationResponse();
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch((error) => {
        console.warn('Respons notifikasi terakhir tidak dapat dibaca.', error);
      });

    return () => {
      receivedSubscription.remove();
      subscription.remove();
    };
  }, [onReceived, onResponse]);

  return null;
}
