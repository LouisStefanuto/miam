import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/hooks/use-avatar';
import { AVATARS, AVATAR_GROUPS } from '@/lib/avatars';
import { AccountPhoto, SpriteAvatar } from '@/components/UserAvatar';

/** Picks the user's avatar among the pixel-art ones, or goes back to the account photo. */
export default function AvatarPicker() {
  const { user } = useAuth();
  const [selected, select] = useAvatar();
  const usesAccountPhoto = selected === null;

  return (
    <div role="radiogroup" aria-label="Avatar" className="space-y-6">
      <button
        type="button"
        role="radio"
        aria-checked={usesAccountPhoto}
        onClick={() => select(null)}
        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.99] ${
          usesAccountPhoto ? 'border-primary/50 bg-accent' : 'border-border bg-card hover:bg-accent'
        }`}
      >
        <AccountPhoto className="h-9 w-9 flex-shrink-0 rounded-full text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block font-body text-sm font-medium text-card-foreground">Photo du compte</span>
          <span className="block font-body text-xs text-muted-foreground">
            {user?.picture ? 'Celle de votre compte Google' : "L'initiale de votre nom"}
          </span>
        </span>
        {usesAccountPhoto && <Check size={16} className="flex-shrink-0 text-primary" />}
      </button>

      {AVATAR_GROUPS.map((group) => (
        <section key={group.id} className="space-y-3">
          <h2 className="text-sm font-semibold font-body text-muted-foreground uppercase tracking-wide">
            {group.label}
          </h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {AVATARS.filter((avatar) => avatar.group === group.id).map((avatar) => {
              const isSelected = avatar.id === selected;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={avatar.label}
                  title={avatar.label}
                  onClick={() => select(avatar.id)}
                  className="group relative rounded-full focus-visible:outline-none"
                >
                  <SpriteAvatar
                    id={avatar.id}
                    className={`aspect-square w-full rounded-full ring-offset-2 ring-offset-background transition group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-ring ${
                      isSelected ? 'ring-2 ring-primary' : 'group-hover:ring-2 group-hover:ring-primary/30'
                    }`}
                  />
                  {isSelected && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
