import { useState, useRef } from 'react';
import { Upload, FileJson, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { importRecipesBatch, fetchRecipes } from '@/lib/api';
import { Recipe } from '@/data/recipes';

interface RecipeImportJSONProps {
  onBack: () => void;
  onImportRecipes: (recipes: Recipe[]) => void;
}

export default function RecipeImportJSON({ onBack, onImportRecipes }: RecipeImportJSONProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<{ recipes: unknown[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    setJsonData(null);
    setFileName(file.name);

    if (!file.name.endsWith('.json')) {
      setError('Le fichier doit être au format JSON.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
          setError('Le JSON doit contenir une clé "recipes" avec un tableau.');
          return;
        }
        if (parsed.recipes.length === 0) {
          setError('Le tableau "recipes" est vide.');
          return;
        }
        setJsonData(parsed);
      } catch {
        setError('Le fichier ne contient pas du JSON valide.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!jsonData) return;
    setImporting(true);
    try {
      await importRecipesBatch(jsonData);
      const allRecipes = await fetchRecipes();
      onImportRecipes(allRecipes);
      toast({ title: `${jsonData.recipes.length} recette${jsonData.recipes.length > 1 ? 's' : ''} importée${jsonData.recipes.length > 1 ? 's' : ''} !` });
    } catch (err) {
      console.error('Failed to import recipes:', err);
      toast({ title: 'Erreur', description: "Impossible d'importer les recettes. Vérifiez le format du fichier.", variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body mb-6 transition-colors">
        <ArrowLeft size={18} /> Retour
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Importer depuis un fichier JSON</h1>
      <p className="font-body text-muted-foreground mb-6 text-sm">
        Uploadez un fichier JSON contenant vos recettes au format <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{ "recipes": [...] }'}</code>
      </p>

      <div className="space-y-6">
        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Upload size={40} />
            <span className="font-body">Cliquez ou glissez un fichier JSON ici</span>
            <span className="font-body text-xs">.json uniquement</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive font-body text-sm bg-destructive/10 rounded-lg p-3">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* File loaded successfully */}
        {jsonData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border border-border rounded-lg p-4 bg-muted/30">
              <FileJson size={24} className="text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-foreground truncate">{fileName}</p>
                <p className="font-body text-sm text-muted-foreground">
                  {jsonData.recipes.length} recette{jsonData.recipes.length > 1 ? 's' : ''} détectée{jsonData.recipes.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={onBack} variant="outline" className="font-body flex-1 h-12">Annuler</Button>
              <Button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 gradient-warm text-primary-foreground font-body font-semibold h-12"
                size="lg"
              >
                {importing ? 'Import en cours…' : `Importer ${jsonData.recipes.length} recette${jsonData.recipes.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
