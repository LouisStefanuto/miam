import { useCallback, useState } from 'react';
import {
  notificationPermission,
  notificationsAllowed,
  notificationsSupported,
  requestNotificationPermission,
  setNotificationsAllowed,
} from '@/lib/timer-notifications';

export interface TimerNotificationsSetting {
  /** False on browsers without the Notification API (older iOS Safari tabs). */
  supported: boolean;
  /** Whether timers currently post a card. */
  enabled: boolean;
  /** True once the browser refused for good, which no toggle can undo. */
  blocked: boolean;
  toggle: (enabled: boolean) => void;
}

/** The lock-screen timer cards setting, as shown in the settings page. */
export function useTimerNotifications(): TimerNotificationsSetting {
  const supported = notificationsSupported();
  const [permission, setPermission] = useState<NotificationPermission>(notificationPermission);
  const [allowed, setAllowed] = useState(notificationsAllowed);

  const toggle = useCallback((next: boolean) => {
    setNotificationsAllowed(next);
    setAllowed(next);
    // Switching it on is the tap the browser wants before it shows the prompt.
    if (next) void requestNotificationPermission().then(setPermission);
  }, []);

  return {
    supported,
    enabled: supported && allowed && permission === 'granted',
    blocked: supported && permission === 'denied',
    toggle,
  };
}
