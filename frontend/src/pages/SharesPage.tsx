import { Inbox, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingShares, useAcceptShare, useAcceptAllShares, useRejectShare } from '@/hooks/use-shares';
import { useToast } from '@/hooks/use-toast';

const SharesPage = () => {
  const { data: pending = [], refetch } = usePendingShares();
  const acceptMutation = useAcceptShare();
  const acceptAllMutation = useAcceptAllShares();
  const rejectMutation = useRejectShare();
  const { toast } = useToast();

  const handleAccept = (shareId: string, title?: string) => {
    acceptMutation.mutate(shareId, {
      onSuccess: () => {
        toast({ title: 'Recette acceptée', description: title });
        refetch();
      },
    });
  };

  const handleReject = (shareId: string) => {
    rejectMutation.mutate(shareId, {
      onSuccess: () => {
        toast({ title: 'Invitation refusee' });
        refetch();
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-center px-4 h-14 bg-background border-b border-border md:hidden">
        <h1 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <Inbox size={20} /> Invitations
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-3">
        {pending.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full font-body"
            onClick={() =>
              acceptAllMutation.mutate(undefined, {
                onSuccess: (data) => {
                  toast({
                    title: `${data.length} recette${data.length > 1 ? 's' : ''} acceptée${data.length > 1 ? 's' : ''}`,
                  });
                  refetch();
                },
              })
            }
            disabled={acceptAllMutation.isPending}
          >
            <CheckCheck size={14} className="mr-1" /> Tout accepter
          </Button>
        )}
        {pending.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground font-body">Aucune invitation en attente</p>
          </div>
        ) : (
          pending.map((share) => (
            <div key={share.id} className="p-3 rounded-lg border bg-card">
              <p className="font-body font-medium text-sm truncate">
                {share.recipe_title || 'Recette'}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                De {share.shared_by_name || 'Quelqu\'un'} - {share.role === 'editor' ? 'Editeur' : 'Lecteur'}
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(share.id, share.recipe_title ?? undefined)}
                  disabled={acceptMutation.isPending}
                  className="flex-1 font-body"
                >
                  <Check size={14} className="mr-1" /> Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(share.id)}
                  disabled={rejectMutation.isPending}
                  className="flex-1 font-body"
                >
                  <X size={14} className="mr-1" /> Refuser
                </Button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default SharesPage;
