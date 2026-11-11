import SettingsSubpage from '@/components/SettingsSubpage';
import AvatarPicker from '@/components/AvatarPicker';

/** Dedicated page for picking an avatar, opened from the profile in the settings. */
export default function AvatarPage() {
  return (
    <SettingsSubpage title="Avatar">
      <p className="font-body text-sm text-muted-foreground">
        L'image qui vous représente dans Miam. Appuyez sur un avatar pour le choisir.
      </p>
      <AvatarPicker />
    </SettingsSubpage>
  );
}
