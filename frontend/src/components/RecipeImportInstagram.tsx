import { useState, useRef } from 'react';
import { Upload, Instagram, ArrowLeft, AlertCircle, Check, X, Image as ImageIcon, ClipboardPaste } from 'lucide-react';
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
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const parseJsonData = async (data: unknown) => {
    setParsing(true);
    try {
      const recipes = await parseInstagram(data);
      if (recipes.length === 0) {
        setError('Aucune recette trouvée dans ces données.');
        return;
      }
      setParsed(recipes);
      setSelected(new Set(recipes.map((_, i) => i)));
    } catch (err) {
      console.error('Failed to parse Instagram data:', err);
      setError("Impossible de parser les données Instagram. Vérifiez le format.");
    } finally {
      setParsing(false);
    }
  };

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

    await parseJsonData(data);
  };

  const handlePaste = async () => {
    setError(null);
    setParsed([]);
    setSelected(new Set());

    const text = pasteValue.trim();
    if (!text) {
      setError('Veuillez coller du contenu JSON.');
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      setError('Le contenu collé n\'est pas du JSON valide.');
      return;
    }

    await parseJsonData(data);
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
          Importez les données JSON exportées depuis Instagram : déposez un fichier ou collez le contenu directement.
        </p>

        <div className="space-y-6">
          {/* Upload zone */}
          {parsed.length === 0 && !pasteMode && (
            <>
              {parsing ? (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="font-body">Analyse en cours...</span>
                  </div>
                </div>
              ) : (
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
            </>
          )}

          {/* Paste mode */}
          {parsed.length === 0 && pasteMode && (
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
                  disabled={parsing || !pasteValue.trim()}
                  className="font-body gradient-warm text-primary-foreground font-semibold"
                >
                  {parsing ? 'Analyse en cours...' : 'Analyser'}
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
                      {item.image_url && !brokenImages.has(index) ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={() => setBrokenImages((prev) => new Set(prev).add(index))}
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
