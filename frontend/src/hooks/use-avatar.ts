import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatar, setAvatar, subscribeToAvatar } from '@/lib/avatars';

/**
 * The signed-in user's avatar id (null means their account photo) and a setter.
 * Kept in localStorage for now, so each device has its own pick.
 */
export function useAvatar(): [string | null, (id: string | null) => void] {
  const { user } = useAuth();
  const email = user?.email ?? null;

  const avatar = useSyncExternalStore(subscribeToAvatar, () => (email ? getAvatar(email) : null));

  const select = useCallback(
    (id: string | null) => {
      if (email) setAvatar(email, id);
    },
    [email],
  );

  return [avatar, select];
}
