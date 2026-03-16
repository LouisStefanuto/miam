import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/settings')}
      className="shrink-0 h-7 w-7 md:h-9 md:w-9 rounded-full md:rounded-lg overflow-hidden ring-1 ring-border hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <span className="sr-only">Paramètres</span>
    </button>
  );
}
