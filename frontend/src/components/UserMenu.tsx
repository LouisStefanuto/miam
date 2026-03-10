import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User size={18} />
          )}
          <span className="sr-only">Compte</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-body">
        {user && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {user.name}
          </div>
        )}
        <DropdownMenuItem onClick={logout} className="gap-2 cursor-pointer">
          <LogOut size={16} />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
