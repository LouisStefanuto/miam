import { Suspense } from 'react';
import { useTheme } from 'next-themes';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, LogOut, Pencil, ArrowLeft, BellRing, ChevronRight, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import UserAvatar from '@/components/UserAvatar';
import { useOverlayClose } from '@/components/CatalogLayout';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getAlarmSoundById } from '@/lib/alarm';
import { useAlarmSound } from '@/hooks/use-alarm-sound';
import { useTimerNotifications } from '@/hooks/use-timer-notifications';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  // Opened over the catalog: going back slides it out to the right on mobile.
  const { requestClose } = useOverlayClose();
  const [alarmSound] = useAlarmSound();
  const notifications = useTimerNotifications();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => requestClose('/')}
          aria-label="Retour au catalogue"
          className="motion-safe:animate-back-arrow-in"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-lg font-bold text-foreground">Paramètres</h1>
      </header>

      {/* Desktop top banner */}
      <header className="hidden md:flex items-center gap-3 h-16 px-6 bg-background/85 backdrop-blur-md border-b border-border/60 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => requestClose('/')}
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
            <button
              type="button"
              onClick={() => navigate('/settings/avatar')}
              aria-label="Changer d'avatar"
              className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <UserAvatar className="h-14 w-14 rounded-full ring-1 ring-border text-xl transition-transform group-active:scale-95" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                <Pencil size={12} />
              </span>
            </button>
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

        {/* Timer section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold font-body text-muted-foreground uppercase tracking-wide">Minuteur</h2>

          <button
            type="button"
            onClick={() => navigate('/settings/alarm')}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left transition-colors hover:border-primary/40 hover:bg-accent active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellRing size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-body text-sm font-medium text-card-foreground">Sonnerie</span>
              <span className="block font-body text-xs text-muted-foreground">
                Jouée quand un minuteur d'étape arrive à zéro
              </span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-1 font-body text-sm text-muted-foreground">
              {getAlarmSoundById(alarmSound).label}
              <ChevronRight size={16} />
            </span>
          </button>

          {notifications.supported && (
            <div className="rounded-xl border border-border bg-card px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Smartphone size={16} />
                </span>
                <label htmlFor="timer-notifications" className="min-w-0 flex-1 cursor-pointer">
                  <span className="block font-body text-sm font-medium text-card-foreground">
                    Notifications
                  </span>
                  <span className="block font-body text-xs text-muted-foreground">
                    Affiche les minuteurs en cours sur l'écran verrouillé
                  </span>
                </label>
                <Switch
                  id="timer-notifications"
                  checked={notifications.enabled}
                  onCheckedChange={notifications.toggle}
                  disabled={notifications.blocked}
                />
              </div>
              {notifications.blocked && (
                <p className="mt-2 font-body text-xs text-muted-foreground">
                  Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du
                  navigateur pour les réactiver.
                </p>
              )}
            </div>
          )}
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

      {/* Sonnerie and Avatar slide in over this page; their own boundary keeps it shown while they load. */}
      <Suspense>
        <Outlet />
      </Suspense>
    </div>
  );
}
