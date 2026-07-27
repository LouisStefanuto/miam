import { useCallback, useState } from 'react';
import { getAlarmSound, setAlarmSound, type AlarmSoundId } from '@/lib/alarm';

/** The alarm sound picked in the settings, persisted in localStorage. */
export function useAlarmSound(): [AlarmSoundId, (id: AlarmSoundId) => void] {
  const [sound, setSound] = useState<AlarmSoundId>(getAlarmSound);

  const select = useCallback((id: AlarmSoundId) => {
    setAlarmSound(id);
    setSound(id);
  }, []);

  return [sound, select];
}
