import { useState, useRef } from 'react';
import { Upload, FileJson, ArrowLeft, AlertCircle, ClipboardPaste } from 'lucide-react';
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
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const parseRawJson = (text: string) => {
    setError(null);
    setJsonData(null);
    try {
      const parsed = JSON.parse(text);
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
      setError('Le contenu ne contient pas du JSON valide.');
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);

    if (!file.name.endsWith('.json')) {
      setError('Le fichier doit être au format JSON.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => parseRawJson(e.target?.result as string);
    reader.readAsText(file);
  };

  const handlePaste = () => {
    const text = pasteValue.trim();
    if (!text) {
      setError('Veuillez coller du contenu JSON.');
      return;
    }
    setFileName(null);
    parseRawJson(text);
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
      const sanitized = {
        recipes: jsonData.recipes.map((r: Record<string, unknown>) => {
          const { id, images, sources, owner_name, ...rest } = r as Record<string, unknown>;
          return { ...rest, images: [], sources: [] };
        }),
      };
      await importRecipesBatch(sanitized);
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
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="font-display text-lg font-bold">Importer depuis un fichier JSON</h1>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-8">
      <p className="font-body text-muted-foreground mb-6 text-sm">
        Importez vos recettes au format <code className="bg-muted px-1 py-0.5 rounded text-xs">{'{ "recipes": [...] }'}</code> : déposez un fichier ou collez le contenu directement.
      </p>

      <div className="space-y-6">
        {/* Input selection */}
        {!jsonData && !pasteMode && (
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Upload size={32} />
                <span className="font-body text-sm">Déposer un fichier JSON</span>
              </div>
            </div>
            <div
              onClick={() => setPasteMode(true)}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ClipboardPaste size={32} />
                <span className="font-body text-sm">Coller du JSON</span>
              </div>
            </div>
          </div>
        )}

        {/* Paste mode */}
        {!jsonData && pasteMode && (
          <div className="space-y-3">
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              placeholder='Collez le contenu JSON ici...'
              className="w-full h-48 rounded-lg border border-border bg-card p-3 font-mono text-xs resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="font-body"
                onClick={() => { setPasteMode(false); setPasteValue(''); setError(null); }}
              >
                <ArrowLeft size={16} className="mr-2" />
                Retour
              </Button>
              <Button
                onClick={handlePaste}
                disabled={!pasteValue.trim()}
                className="font-body gradient-warm text-primary-foreground font-semibold"
              >
                Analyser
              </Button>
            </div>
          </div>
        )}

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
                <p className="font-body font-semibold text-foreground truncate">{fileName ?? 'JSON collé'}</p>
                <p className="font-body text-sm text-muted-foreground">
                  {jsonData.recipes.length} recette{jsonData.recipes.length > 1 ? 's' : ''} détectée{jsonData.recipes.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => { setJsonData(null); setFileName(null); setPasteMode(false); setPasteValue(''); }} variant="outline" className="font-body flex-1 h-12">Annuler</Button>
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
    </div>
  );
}
