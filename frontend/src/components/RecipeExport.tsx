import { useState } from 'react';
import { ArrowLeft, FileText, FileDown, Loader2 } from 'lucide-react';
import { exportToMarkdown, exportToWord } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface RecipeExportProps {
  onBack: () => void;
}

export default function RecipeExport({ onBack }: RecipeExportProps) {
  const [loading, setLoading] = useState<'markdown' | 'word' | null>(null);

  const handleExport = async (format: 'markdown' | 'word') => {
    setLoading(format);
    try {
      if (format === 'markdown') {
        await exportToMarkdown();
      } else {
        await exportToWord();
      }
      toast({ title: 'Export réussi !', description: `Vos recettes ont été exportées en ${format === 'markdown' ? 'Markdown' : 'Word'}.` });
    } catch (err) {
      console.error('Export failed:', err);
      toast({ title: 'Erreur', description: "Impossible d'exporter les recettes.", variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body mb-6 transition-colors">
        <ArrowLeft size={18} /> Retour
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Exporter les recettes</h1>
      <p className="font-body text-muted-foreground mb-8 text-sm">
        Choisissez le format d'export pour télécharger toutes vos recettes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Word export box */}
        <button
          onClick={() => handleExport('word')}
          disabled={loading !== null}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            {loading === 'word' ? <Loader2 size={40} className="animate-spin" /> : <FileDown size={40} />}
            <span className="font-body font-semibold text-foreground">Word (.docx)</span>
            <span className="font-body text-xs">Document formaté, idéal pour imprimer</span>
          </div>
        </button>

        {/* Markdown export box */}
        <button
          onClick={() => handleExport('markdown')}
          disabled={loading !== null}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            {loading === 'markdown' ? <Loader2 size={40} className="animate-spin" /> : <FileText size={40} />}
            <span className="font-body font-semibold text-foreground">Markdown (.md)</span>
            <span className="font-body text-xs">Texte brut formaté, idéal pour le partage</span>
          </div>
        </button>
      </div>
    </div>
  );
}
