import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const UserMenu = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  (props, ref) => {
    const { user } = useAuth();
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
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full bg-muted text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase() ?? <User size={18} />}
          </span>
        )}
        <span className="sr-only">Mon compte</span>
      </Button>
    );
  }
);

UserMenu.displayName = 'UserMenu';

export default UserMenu;
