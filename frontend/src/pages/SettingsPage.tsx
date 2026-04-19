import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, LogOut, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border md:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Retour au catalogue">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-lg font-bold text-foreground">Paramètres</h1>
      </header>

      {/* Desktop top banner */}
      <header className="hidden md:flex items-center gap-3 h-16 px-6 bg-background/85 backdrop-blur-md border-b border-border/60 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center h-10 w-10 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary active:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Retour au catalogue"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Paramètres</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6 space-y-8">
        {/* Profile section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold font-body text-muted-foreground uppercase tracking-wide">Profil</h2>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden ring-1 ring-border shrink-0">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full bg-muted">
                  <User size={24} />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-body font-medium truncate">{user?.name}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Appearance section */}
        <section className="space-y-5">
          <h2 className="text-sm font-semibold font-body text-muted-foreground uppercase tracking-wide">Apparence</h2>

          <div className="space-y-3">
            <h3 className="text-sm font-medium font-body">Mode</h3>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(v) => { if (v) setTheme(v); }}
              variant="outline"
              className="justify-start"
            >
              <ToggleGroupItem value="system" aria-label="Automatique" className="gap-2 px-4">
                <Monitor size={16} />
                Auto
              </ToggleGroupItem>
              <ToggleGroupItem value="light" aria-label="Clair" className="gap-2 px-4">
                <Sun size={16} />
                Clair
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Sombre" className="gap-2 px-4">
                <Moon size={16} />
                Sombre
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </section>

        <Separator />

        {/* Account section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold font-body text-muted-foreground uppercase tracking-wide">Compte</h2>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 dark:bg-muted dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/40"
            onClick={() => void logout()}
          >
            <LogOut size={16} />
            Se déconnecter
          </Button>
        </section>
      </main>
    </div>
  );
}
