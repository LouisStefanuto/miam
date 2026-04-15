import { useNavigate } from 'react-router-dom';
import { Share2, Inbox } from 'lucide-react';
import { usePendingSharesCount } from '@/hooks/use-shares';

const SharesPage = () => {
  const navigate = useNavigate();
  const { data: pendingCount = 0 } = usePendingSharesCount();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-center px-4 h-14 bg-background border-b border-border md:hidden">
        <h1 className="font-display text-lg font-bold text-foreground">Partages</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3 pb-24">
        <button
          onClick={() => navigate('/shares/batch')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left"
        >
          <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Share2 size={22} className="text-primary" />
          </span>
          <div className="min-w-0">
            <p className="font-body font-semibold text-foreground">Partager mes recettes</p>
            <p className="font-body text-sm text-muted-foreground">Sélectionner des recettes à partager</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/shares/inbox')}
          className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-left"
        >
          <span className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Inbox size={22} className="text-primary" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="font-body font-semibold text-foreground">Boîte de réception</p>
            <p className="font-body text-sm text-muted-foreground">Voir les recettes partagées avec moi</p>
          </div>
        </button>
      </main>
    </div>
  );
};

export default SharesPage;
