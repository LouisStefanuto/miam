import SettingsSubpage from '@/components/SettingsSubpage';
import AlarmSoundPicker from '@/components/AlarmSoundPicker';

/** Dedicated page for picking the timer alarm, kept out of the settings list. */
export default function AlarmSoundPage() {
  return (
    <SettingsSubpage title="Sonnerie">
      <p className="font-body text-sm text-muted-foreground">
        Le son joué quand un minuteur d'étape arrive à zéro. Appuyez sur une sonnerie pour l'écouter et la choisir.
      </p>
      <AlarmSoundPicker />
    </SettingsSubpage>
  );
}
