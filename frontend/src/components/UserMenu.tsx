import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Check, LogOut, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/contexts/AuthContext';
import { useAccentColor, ACCENT_COLORS, type AccentColor } from '@/contexts/ThemeContext';

const colorKeys = Object.keys(ACCENT_COLORS) as AccentColor[];

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();
  const [open, setOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // On desktop, navigate to settings page directly
  if (!isMobile) {
    return (
      <button
        onClick={() => navigate('/settings')}
        className="shrink-0 h-7 w-7 md:h-9 md:w-9 rounded-full overflow-hidden ring-1 ring-border hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="shrink-0 h-7 w-7 md:h-9 md:w-9 rounded-full overflow-hidden ring-1 ring-border hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display">Paramètres</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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
              <h3 className="text-sm font-medium font-body">Couleur d'accent</h3>
              <div className="flex flex-wrap gap-3">
                {colorKeys.map((key) => {
                  const def = ACCENT_COLORS[key];
                  const isActive = accentColor === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={def.label}
                      onClick={() => setAccentColor(key)}
                      className="relative h-10 w-10 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{
                        background: def.preview,
                        boxShadow: isActive
                          ? `0 0 0 2px var(--background), 0 0 0 4px ${def.preview}`
                          : undefined,
                      }}
                    >
                      {isActive && (
                        <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

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
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              <LogOut size={16} />
              Se déconnecter
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
