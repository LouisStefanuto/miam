import { useEffect, useRef } from 'react';
import {
  AlarmClock,
  Angry,
  Bell,
  Bird,
  Check,
  Cookie,
  Music2,
  Squirrel,
  TreeDeciduous,
  type LucideIcon,
} from 'lucide-react';
import { ALARM_SOUNDS, playAlarmSound, type AlarmSoundId } from '@/lib/alarm';
import { useAlarmSound } from '@/hooks/use-alarm-sound';

const SOUND_ICONS: Record<AlarmSoundId, LucideIcon> = {
  cloche: Bell,
  bip: AlarmClock,
  carillon: Music2,
  coucou: Bird,
  castor: Squirrel,
  grignotage: Cookie,
  ronchon: Angry,
  arbre: TreeDeciduous,
};

/** Picks the timer alarm, playing each sound as it is selected. */
export default function AlarmSoundPicker() {
  const [selected, select] = useAlarmSound();
  const stopPreview = useRef<() => void>();

  useEffect(() => () => stopPreview.current?.(), []);

  const handleSelect = (id: AlarmSoundId) => {
    select(id);
    // Selecting is a click, so the audio context is unlocked here.
    stopPreview.current?.();
    stopPreview.current = playAlarmSound(id);
  };

  return (
    <div role="radiogroup" aria-label="Sonnerie du minuteur" className="grid gap-2">
      {ALARM_SOUNDS.map((sound) => {
        const Icon = SOUND_ICONS[sound.id];
        const isSelected = sound.id === selected;
        return (
          <button
            key={sound.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(sound.id)}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.99] ${
              isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
            }`}
          >
            <span
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                isSelected ? 'gradient-warm text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-body text-sm font-medium text-card-foreground">{sound.label}</span>
              <span className="block font-body text-xs text-muted-foreground">{sound.description}</span>
            </span>
            {isSelected && <Check size={16} className="flex-shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}
