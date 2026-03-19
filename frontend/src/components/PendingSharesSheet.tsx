import { Inbox, Check, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { usePendingShares, usePendingSharesCount, useAcceptShare, useRejectShare } from '@/hooks/use-shares';
import { useToast } from '@/hooks/use-toast';

interface PendingSharesSheetProps {
  trigger: React.ReactNode;
}

export default function PendingSharesSheet({ trigger }: PendingSharesSheetProps) {
  const { data: pending = [], refetch } = usePendingShares();
  const acceptMutation = useAcceptShare();
  const rejectMutation = useRejectShare();
  const { toast } = useToast();

  const handleAccept = (shareId: string, title?: string) => {
    acceptMutation.mutate(shareId, {
      onSuccess: () => {
        toast({ title: 'Recette acceptee', description: title });
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
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <Inbox size={20} /> Invitations
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm font-body text-muted-foreground text-center py-8">
              Aucune invitation en attente
            </p>
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function PendingSharesBadge() {
  const { data: count = 0 } = usePendingSharesCount();

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
      {count}
    </span>
  );
}
