import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useShareRecipe } from '@/hooks/use-shares';
import { useToast } from '@/hooks/use-toast';

interface BatchShareDialogProps {
  recipeIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BatchShareDialog({ recipeIds, open, onOpenChange }: BatchShareDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reader');
  const [sharing, setSharing] = useState(false);
  const shareMutation = useShareRecipe();
  const { toast } = useToast();

  const handleShare = async () => {
    if (!email.trim() || recipeIds.length === 0) return;
    setSharing(true);
    let success = 0;
    let failed = 0;
    for (const recipeId of recipeIds) {
      try {
        await shareMutation.mutateAsync({ recipeId, email: email.trim(), role });
        success++;
      } catch {
        failed++;
      }
    }
    setSharing(false);
    if (failed === 0) {
      toast({ title: 'Recettes partagées', description: `${success} recette${success > 1 ? 's' : ''} partagée${success > 1 ? 's' : ''} avec ${email}` });
    } else {
      toast({ title: 'Partage partiel', description: `${success} partagée${success > 1 ? 's' : ''}, ${failed} en erreur`, variant: 'destructive' });
    }
    setEmail('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Users size={20} /> Partager {recipeIds.length} recette{recipeIds.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
            disabled={!email.trim() || sharing}
            className="w-full font-body"
          >
            {sharing ? 'Envoi en cours...' : `Partager ${recipeIds.length} recette${recipeIds.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
