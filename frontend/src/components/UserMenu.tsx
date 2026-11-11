import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';

const UserMenu = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  (props, ref) => {
    const navigate = useNavigate();

    return (
      <Button
        {...props}
        ref={ref}
        variant="outline"
        size="icon"
        onClick={() => navigate('/settings')}
        className="shrink-0 overflow-hidden p-0 transition-all ring-offset-2 ring-offset-background hover:ring-2 hover:ring-primary active:ring-2 active:ring-primary focus-visible:ring-2 focus-visible:ring-primary"
      >
        <UserAvatar className="h-full w-full text-sm" />
        <span className="sr-only">Mon compte</span>
      </Button>
    );
  }
);

UserMenu.displayName = 'UserMenu';

export default UserMenu;
