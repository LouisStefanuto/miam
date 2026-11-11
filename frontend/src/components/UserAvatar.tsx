import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatar } from '@/hooks/use-avatar';
import { avatarSrc } from '@/lib/avatars';
import { cn } from '@/lib/utils';

// Size, shape and font size come from className; the images are decorative, so the
// surrounding button or text carries the label.

/** A pixel-art avatar centred on its disc. */
export function SpriteAvatar({ id, className }: { id: string; className?: string }) {
  return (
    <span className={cn('flex items-center justify-center bg-avatar', className)}>
      <img src={avatarSrc(id)} alt="" draggable={false} className="h-[68%] w-[68%] object-contain" />
    </span>
  );
}

/** The account's own photo, or its initial when it has none. */
export function AccountPhoto({ className }: { className?: string }) {
  const { user } = useAuth();

  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt=""
        referrerPolicy="no-referrer"
        className={cn('object-cover', className)}
      />
    );
  }

  return (
    <span className={cn('flex items-center justify-center bg-muted font-medium', className)}>
      {user?.name?.charAt(0).toUpperCase() || <User className="h-1/2 w-1/2" />}
    </span>
  );
}

/** The signed-in user's avatar: their pixel-art pick, otherwise their account photo. */
export default function UserAvatar({ className }: { className?: string }) {
  const [avatar] = useAvatar();
  return avatar ? <SpriteAvatar id={avatar} className={className} /> : <AccountPhoto className={className} />;
}
