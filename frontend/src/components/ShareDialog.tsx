import { useState } from 'react';
import { Share2, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useShareRecipe, useRecipeShares, useRemoveShare } from '@/hooks/use-shares';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  recipeId: string;
}

export default function ShareDialog({ recipeId }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reader');
  const shareMutation = useShareRecipe();
  const removeMutation = useRemoveShare();
  const { data: collaborators = [], refetch } = useRecipeShares(recipeId);
  const { toast } = useToast();

  const handleShare = () => {
    if (!email.trim()) return;
    shareMutation.mutate(
      { recipeId, email: email.trim(), role },
      {
        onSuccess: () => {
          toast({ title: 'Invitation envoyee', description: `Recette partagee avec ${email}` });
          setEmail('');
          refetch();
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
        },
      }
    );
  };

  const handleRevoke = (shareId: string) => {
    removeMutation.mutate(shareId, {
      onSuccess: () => {
        toast({ title: 'Acces revoque' });
        refetch();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-card/80 backdrop-blur-sm rounded-full p-2 text-card-foreground hover:bg-card transition-colors">
          <Share2 size={16} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Users size={20} /> Partager la recette
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share form */}
          <div className="flex gap-2">
            <Input
              placeholder="Email du destinataire"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShare()}
              className="flex-1 font-body"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[120px] font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reader">Lecteur</SelectItem>
                <SelectItem value="editor">Editeur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleShare}
            disabled={!email.trim() || shareMutation.isPending}
            className="w-full font-body"
          >
            {shareMutation.isPending ? 'Envoi...' : 'Partager'}
          </Button>

          {/* Collaborators list */}
          {collaborators.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-body font-medium text-muted-foreground">Collaborateurs</h4>
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body truncate">{c.shared_with_name || c.shared_with_email}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {c.role === 'editor' ? 'Editeur' : 'Lecteur'}
                      {c.status === 'pending' && ' - En attente'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(c.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
