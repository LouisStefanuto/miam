import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/hooks/use-avatar';
import { ACCOUNT_PHOTO, AVATARS, AVATAR_GROUPS, MIAM_LOGO } from '@/lib/avatars';
import { AccountPhoto, LogoAvatar, SpriteAvatar } from '@/components/UserAvatar';

/** Picks the user's avatar: the Miam logo, one of the pixel-art ones, or their account photo. */
export default function AvatarPicker() {
  const { user } = useAuth();
  const [selected, select] = useAvatar();

  return (
    <div role="radiogroup" aria-label="Avatar" className="space-y-6">
      <div className="space-y-2">
        <ChoiceRow
          checked={selected === MIAM_LOGO}
          onSelect={() => select(MIAM_LOGO)}
          preview={<LogoAvatar className="h-9 w-9 flex-shrink-0 rounded-full" />}
          title="Logo Miam"
          subtitle="Par défaut"
        />
        <ChoiceRow
          checked={selected === ACCOUNT_PHOTO}
          onSelect={() => select(ACCOUNT_PHOTO)}
          preview={<AccountPhoto className="h-9 w-9 flex-shrink-0 rounded-full text-sm" />}
          title="Photo du compte"
          subtitle={user?.picture ? 'Celle de votre compte Google' : "L'initiale de votre nom"}
        />
      </div>

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

interface ChoiceRowProps {
  checked: boolean;
  onSelect: () => void;
  preview: ReactNode;
  title: string;
  subtitle: string;
}

/** A full-width choice with a small preview, for the options that are not pixel-art avatars. */
function ChoiceRow({ checked, onSelect, preview, title, subtitle }: ChoiceRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors active:scale-[0.99] ${
        checked ? 'border-primary/50 bg-accent' : 'border-border bg-card hover:bg-accent'
      }`}
    >
      {preview}
      <span className="min-w-0 flex-1">
        <span className="block font-body text-sm font-medium text-card-foreground">{title}</span>
        <span className="block font-body text-xs text-muted-foreground">{subtitle}</span>
      </span>
      {checked && <Check size={16} className="flex-shrink-0 text-primary" />}
    </button>
  );
}
