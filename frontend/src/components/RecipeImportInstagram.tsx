import { useState, useRef } from 'react';
import { Upload, Instagram, ArrowLeft, AlertCircle, Check, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { parseInstagram, importRecipesBatch, uploadImageFromUrl, type ParsedInstagramRecipe } from '@/lib/api';

interface RecipeImportInstagramProps {
  onBack: () => void;
  onImportDone: () => void;
}

export default function RecipeImportInstagram({ onBack, onImportDone }: RecipeImportInstagramProps) {
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedInstagramRecipe[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setParsed([]);
    setSelected(new Set());

    if (!file.name.endsWith('.json')) {
      setError('Le fichier doit être au format JSON.');
      return;
    }

    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      setError('Le fichier ne contient pas du JSON valide.');
      return;
    }

    setParsing(true);
    try {
      const recipes = await parseInstagram(data);
      if (recipes.length === 0) {
        setError('Aucune recette trouvée dans ce fichier.');
        return;
      }
      setParsed(recipes);
      setSelected(new Set(recipes.map((_, i) => i)));
    } catch (err) {
      console.error('Failed to parse Instagram data:', err);
      setError("Impossible de parser les données Instagram. Vérifiez le format du fichier.");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === parsed.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(parsed.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    const recipesToImport = parsed.filter((_, i) => selected.has(i));
    if (recipesToImport.length === 0) return;

    setImporting(true);
    try {
      const payload = { recipes: recipesToImport.map((p) => p.recipe) };
      const { ids } = await importRecipesBatch(payload);

      // Upload images in parallel (best-effort)
      const imageUploads = recipesToImport
        .map((p, i) => ({ id: ids[i], url: p.image_url }))
        .filter((item): item is { id: string; url: string } => item.url !== null);

      await Promise.allSettled(
        imageUploads.map(({ id, url }) => uploadImageFromUrl(id, url))
      );

      toast({
        title: `${ids.length} recette${ids.length > 1 ? 's' : ''} importée${ids.length > 1 ? 's' : ''} !`,
      });
      onImportDone();
    } catch (err) {
      console.error('Failed to import recipes:', err);
      toast({
        title: 'Erreur',
        description: "Impossible d'importer les recettes.",
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <h1 className="font-display text-lg font-bold">Importer depuis Instagram</h1>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="font-body text-muted-foreground mb-6 text-sm">
          Uploadez le fichier JSON exporté depuis Instagram (format <code className="bg-muted px-1 py-0.5 rounded text-xs">saved_posts.json</code> ou similaire).
        </p>

        <div className="space-y-6">
          {/* Upload zone */}
          {parsed.length === 0 && (
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
                {parsing ? (
                  <>
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-body">Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload size={40} />
                    <span className="font-body">Cliquez ou glissez un fichier JSON ici</span>
                    <span className="font-body text-xs">.json uniquement</span>
                  </>
                )}
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

          {/* Parsed recipes list */}
          {parsed.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-muted-foreground">
                  {parsed.length} recette{parsed.length > 1 ? 's' : ''} trouvée{parsed.length > 1 ? 's' : ''} — {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm" onClick={toggleAll} className="font-body text-xs">
                  {selected.size === parsed.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {parsed.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => toggleSelect(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      selected.has(index)
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card opacity-60'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML =
                              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                          }}
                        />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-foreground text-sm truncate">
                        {item.recipe.title}
                      </p>
                      <p className="font-body text-xs text-muted-foreground truncate">
                        {item.recipe.tags?.join(', ')}
                        {item.recipe.sources?.[0] && ` · ${item.recipe.sources[0].raw_content}`}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected.has(index) ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      {selected.has(index) && <Check size={14} />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => { setParsed([]); setSelected(new Set()); }}
                  variant="outline"
                  className="font-body flex-1 h-12"
                >
                  <X size={16} className="mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing || selectedCount === 0}
                  className="flex-1 gradient-warm text-primary-foreground font-body font-semibold h-12"
                  size="lg"
                >
                  <Instagram size={16} className="mr-2" />
                  {importing
                    ? 'Import en cours...'
                    : `Importer ${selectedCount} recette${selectedCount > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
