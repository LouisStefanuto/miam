import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export default function UserMenu() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="shrink-0 h-7 w-7 md:h-9 md:w-9 rounded-full overflow-hidden ring-1 ring-border hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full bg-muted">
              <User size={18} />
            </span>
          )}
          <span className="sr-only">Compte</span>
        </button>
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
