import { useState, useRef } from 'react';
import { Upload, X, Check, ChefHat, ImageIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Recipe, Ingredient, Step, RecipeType, Season, Difficulty, Diet } from '@/data/recipes';

interface DishImage {
  detected: boolean;
  description?: string;
  position?: string;
  cropHint?: { x: number; y: number; width: number; height: number };
}

interface ParsedRecipe {
  title: string;
  type: RecipeType;
  season: Season;
  difficulty: Difficulty;
  servings: number;
  prepTime: number;
  cookTime: number;
  restTime?: number;
  diets: Diet[];
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  variants?: string;
  dishImage?: DishImage;
}

interface RecipeImportOCRProps {
  onBack: () => void;
  onImportRecipes: (recipes: Recipe[]) => void;
}

export default function RecipeImportOCR({ onBack, onImportRecipes }: RecipeImportOCRProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [parsedRecipes, setParsedRecipes] = useState<ParsedRecipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) {
      toast({ title: 'Format non supporté', description: 'Veuillez sélectionner des images (JPG, PNG, WebP).', variant: 'destructive' });
      return;
    }
    setFiles((prev) => [...prev, ...arr]);
    setParsedRecipes([]);

    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const runOCR = async () => {
    // TODO: No backend OCR endpoint yet
    toast({ title: 'Bientôt disponible', description: "L'import par photo n'est pas encore connecté au backend.", variant: 'destructive' });
  };

  const toggleRecipe = (index: number) => {
    setSelectedRecipes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const importSelected = () => {
    const now = new Date().toISOString().split('T')[0];
    const recipes: Recipe[] = Array.from(selectedRecipes).map((i) => {
      const p = parsedRecipes[i];
      return {
        id: Date.now().toString() + '-' + i,
        title: p.title || 'Sans titre',
        type: p.type || 'plat',
        season: p.season || 'été',
        difficulty: p.difficulty || 'moyen',
        servings: p.servings || 4,
        prepTime: p.prepTime || 0,
        cookTime: p.cookTime || 0,
        restTime: p.restTime,
        diets: p.diets || [],
        tags: p.tags || [],
        ingredients: p.ingredients || [],
        steps: p.steps || [],
        variants: p.variants,
        rating: 3,
        tested: false,
        createdAt: now,
        updatedAt: now,
      };
    });
    onImportRecipes(recipes);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-body mb-6 transition-colors">
        <ArrowLeft size={18} /> Retour
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">Importer depuis des photos</h1>
      <p className="font-body text-muted-foreground mb-6 text-sm">
        Uploadez des photos de recettes. L'IA extrait automatiquement le titre, les ingrédients, les étapes, et détecte les photos du plat.
      </p>

      <div className="space-y-6">
        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Upload size={40} />
            <span className="font-body">Cliquez ou glissez des images ici</span>
            <span className="font-body text-xs">JPG, PNG, WebP — Plusieurs fichiers acceptés</span>
          </div>
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                <img src={src} alt={`Image ${i + 1}`} className="w-full h-32 object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Analyze button */}
        {files.length > 0 && parsedRecipes.length === 0 && (
          <div className="space-y-3">
            <Button onClick={runOCR} className="w-full gradient-warm text-primary-foreground font-body font-semibold h-12" size="lg">
              <ChefHat size={18} className="mr-2" />Analyser {files.length} image{files.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {/* Results */}
        {parsedRecipes.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              {parsedRecipes.length} recette{parsedRecipes.length > 1 ? 's' : ''} détectée{parsedRecipes.length > 1 ? 's' : ''}
            </h2>

            {parsedRecipes.map((recipe, i) => (
              <div
                key={i}
                onClick={() => toggleRecipe(i)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedRecipes.has(i) ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${selectedRecipes.has(i) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {selectedRecipes.has(i) ? <Check size={14} /> : <span className="text-xs">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-foreground">{recipe.title || 'Sans titre'}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs font-body text-muted-foreground">
                      <span className="capitalize">{recipe.type}</span>
                      <span>•</span>
                      <span className="capitalize">{recipe.difficulty}</span>
                      <span>•</span>
                      <span>{recipe.servings} portions</span>
                    </div>
                    <div className="mt-2 text-sm font-body text-muted-foreground">
                      {recipe.ingredients.length} ingrédient{recipe.ingredients.length > 1 ? 's' : ''} · {recipe.steps.length} étape{recipe.steps.length > 1 ? 's' : ''}
                    </div>
                    {recipe.dishImage?.detected && (
                      <div className="flex items-center gap-1 mt-1 text-xs font-body text-primary">
                        <ImageIcon size={12} />
                        Photo du plat détectée
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3">
              <Button onClick={onBack} variant="outline" className="font-body flex-1 h-12">Annuler</Button>
              <Button
                onClick={importSelected}
                disabled={selectedRecipes.size === 0}
                className="flex-1 gradient-warm text-primary-foreground font-body font-semibold h-12"
                size="lg"
              >
                Importer {selectedRecipes.size} recette{selectedRecipes.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
