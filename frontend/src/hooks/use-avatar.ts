import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_AVATAR, getAvatar, setAvatar, subscribeToAvatar } from '@/lib/avatars';

/**
 * The signed-in user's pick (an avatar id, MIAM_LOGO or ACCOUNT_PHOTO) and a setter.
 * Kept in localStorage for now, so each device has its own pick.
 */
export function useAvatar(): [string, (choice: string) => void] {
  const { user } = useAuth();
  const email = user?.email ?? null;

  const avatar = useSyncExternalStore(subscribeToAvatar, () => (email ? getAvatar(email) : DEFAULT_AVATAR));

  const select = useCallback(
    (choice: string) => {
      if (email) setAvatar(email, choice);
    },
    [email],
  );

  return [avatar, select];
}
