import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Pencil, Trash2, Minus, Plus, Check, Copy, ClipboardCheck, Users, CopyPlus, LogOut, Vegan, Timer, Flame, Sun, Snowflake, Flower, LeafyGreen, LucideIcon } from 'lucide-react';
import { Recipe } from '@/data/recipes';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import RecipeForm from './RecipeForm';
import { recipeToMarkdown } from '@/lib/recipe-to-markdown';
import { useToast } from '@/hooks/use-toast';
import { useAuthImage } from '@/hooks/use-auth-image';

const DifficultyBars = ({ level }: { level: number }) => (
  <div className="flex gap-0.5 items-end">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`w-1.5 rounded-sm ${i <= level ? 'bg-primary' : 'bg-muted'}`} style={{ height: `${6 + i * 3}px` }} />
    ))}
  </div>
);

const difficultyLevels: Record<string, { label: string; bars: number }> = {
  facile: { label: 'Facile', bars: 1 },
  moyen: { label: 'Moyen', bars: 2 },
  difficile: { label: 'Difficile', bars: 3 },
};

const seasonIcons: Record<string, LucideIcon> = {
  printemps: Flower,
  été: Sun,
  automne: LeafyGreen,
  hiver: Snowflake,
};

const chipBase = 'inline-flex items-center h-7 px-2 text-xs font-body rounded-md';
const chipPrimary = 'bg-primary text-primary-foreground';
const chipSecondary = 'bg-card text-card-foreground';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onRatingChange?: (rating: number) => void;
  onSave?: (recipe: Recipe) => void;
  onTestedToggle?: (tested: boolean) => void;
  allTags: string[];
  onAddTag?: (tag: string) => void;
  onDeleteTag?: (tag: string) => void;
  onDelete?: () => void;
  onRemoveFromCollection?: () => void;
  onDuplicateAndRemove?: () => void;
  shareButton?: React.ReactNode;
  initialEditing?: boolean;
}

export default function RecipeDetail({ recipe, onBack, onRatingChange, onSave, onTestedToggle, allTags, onAddTag, onDeleteTag, onDelete, onRemoveFromCollection, onDuplicateAndRemove, shareButton, initialEditing }: RecipeDetailProps) {
  const [editing, setEditing] = useState(!!initialEditing);
  const [displayServings, setDisplayServings] = useState(recipe.servings);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const imageSrc = useAuthImage(recipe.image);

  useEffect(() => {
    if (initialEditing && !editing) setEditing(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditing]);

  useEffect(() => {
    if (editing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editing, onBack]);

  const copyAsMarkdown = async () => {
    const md = recipeToMarkdown(recipe);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    toast({ title: 'Recette copiée !', description: 'Collez-la avec Ctrl+V.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const servingsRatio = displayServings / recipe.servings;
  const scaleQuantity = (qty: number | string) => {
    const num = typeof qty === 'string' ? parseFloat(qty) : qty;
    if (isNaN(num)) return qty;
    const scaled = Math.round(num * servingsRatio * 100) / 100;
    return scaled % 1 === 0 ? scaled : scaled.toFixed(1);
  };

  const handleFormSave = (updatedRecipe: Recipe) => {
    onSave?.({ ...recipe, ...updatedRecipe });
    setEditing(false);
  };

  const isOwner = !recipe.userRole || recipe.userRole === 'owner';

  // Edit mode — delegate to RecipeForm
  if (editing) {
    return (
      <RecipeForm
        onBack={() => setEditing(false)}
        onSave={handleFormSave}
        initialRecipe={recipe}
        allTags={allTags}
        onAddTag={onAddTag}
        onDeleteTag={onDeleteTag}
      />
    );
  }

  // Read mode
  return (
    <div>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-card px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="flex gap-1">
          {/* Owner: delete */}
          {isOwner && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/40">
                  <Trash2 size={18} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Supprimer cette recette ?</AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    La recette « {recipe.title} » sera supprimée définitivement. Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-body">Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body" onClick={onDelete}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Non-owner: duplicate & remove */}
          {!isOwner && onDuplicateAndRemove && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon"><CopyPlus size={18} /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Dupliquer et retirer ?</AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    Une copie de « {recipe.title} » sera créée dans votre bibliothèque et la recette partagée sera retirée. Vous pourrez modifier votre copie librement.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-body">Annuler</AlertDialogCancel>
                  <AlertDialogAction className="font-body" onClick={onDuplicateAndRemove}>Dupliquer et retirer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Non-owner: remove from collection */}
          {!isOwner && onRemoveFromCollection && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon"><LogOut size={18} /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Retirer cette recette ?</AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    La recette « {recipe.title} » sera retirée de votre collection. Vous pourrez la retrouver si on vous la partage à nouveau.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-body">Annuler</AlertDialogCancel>
                  <AlertDialogAction className="font-body" onClick={onRemoveFromCollection}>Retirer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {/* Edit */}
          {recipe.userRole !== 'reader' && (
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
              <Pencil size={18} />
            </Button>
          )}
          {/* Share */}
          {shareButton}
          {/* Copy markdown */}
          <Button variant="ghost" size="icon" onClick={copyAsMarkdown}>
            {copied ? <ClipboardCheck size={18} /> : <Copy size={18} />}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 md:pb-8 md:grid md:grid-cols-12 md:gap-8">
        {/* Left: image + title + rating + description */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="flex items-center md:flex-col md:items-start gap-4 md:gap-4">
            {imageSrc ? (
              <div className="flex-shrink-0 w-24 h-24 md:w-full md:h-auto md:aspect-square rounded-full overflow-hidden ring-2 ring-primary/20">
                <img src={imageSrc} alt={recipe.title} className="w-full h-full object-cover" />
              </div>
            ) : recipe.image ? (
              <div className="flex-shrink-0 w-24 h-24 md:w-full md:h-auto md:aspect-square rounded-full bg-muted animate-pulse" />
            ) : (
              <div className="flex-shrink-0 w-24 h-24 md:w-full md:h-auto md:aspect-square rounded-full bg-muted" />
            )}
            <div className="flex-1 min-w-0 md:flex-none md:w-full space-y-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{recipe.title}</h1>
              <div className="flex gap-0.5" onMouseLeave={() => setHoveredStar(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => recipe.userRole !== 'reader' && onRatingChange?.(i)}
                    onMouseEnter={() => setHoveredStar(i)}
                    className={recipe.userRole === 'reader' ? '' : 'cursor-pointer'}
                  >
                    <Star
                      size={20}
                      className={
                        (hoveredStar > 0 ? i <= hoveredStar : i <= recipe.rating)
                          ? 'fill-primary text-primary'
                          : 'text-muted'
                      }
                    />
                  </button>
                ))}
              </div>
              {recipe.description && (
                <p className="font-body text-sm text-muted-foreground">{recipe.description}</p>
              )}
            </div>
          </div>
        </aside>

        {/* Right: body content */}
        <div className="md:col-span-8 lg:col-span-9 mt-8 md:mt-0 space-y-8">
          {/* Shared recipe indicator */}
        {recipe.userRole && recipe.userRole !== 'owner' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 border border-border text-sm font-body">
            <Users size={16} className="text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              Partagée par <span className="font-medium text-foreground">{recipe.ownerName || 'Quelqu\'un'}</span>
              {' — '}
              {recipe.userRole === 'editor' ? 'Éditeur' : 'Lecture seule'}
            </span>
          </div>
        )}

        {/* Quick info bars */}
        <div className="space-y-1.5">
          <div className="bg-card rounded-xl shadow-card grid grid-cols-3">
            {/* Prep time */}
            <div className="flex items-center justify-center gap-1.5 py-3 px-2 border-r border-border">
              <Timer size={16} className="text-muted-foreground" />
              <span className="text-sm font-body font-semibold">{recipe.prepTime || '-'}</span>
              {recipe.prepTime > 0 && <span className="text-[10px] text-muted-foreground font-body">min</span>}
            </div>
            {/* Cook time */}
            <div className="flex items-center justify-center gap-1.5 py-3 px-2 border-r border-border">
              <Flame size={16} className="text-muted-foreground" />
              <span className="text-sm font-body font-semibold">{recipe.cookTime || '-'}</span>
              {recipe.cookTime > 0 && <span className="text-[10px] text-muted-foreground font-body">min</span>}
            </div>
            {/* Servings */}
            <div className="flex items-center justify-center py-1 px-2">
              <button type="button" onClick={() => setDisplayServings(Math.max(1, displayServings - 1))} className="relative w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors before:absolute before:-inset-2 before:content-['']">
                <Minus size={12} />
              </button>
              <div className="flex items-center gap-1 mx-2">
                <Users size={16} className="text-muted-foreground" />
                <span className="text-sm font-body font-semibold min-w-[1rem] text-center">{displayServings}</span>
              </div>
              <button type="button" onClick={() => setDisplayServings(displayServings + 1)} className="relative w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors before:absolute before:-inset-2 before:content-['']">
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-card grid grid-cols-3">
            {/* Difficulty */}
            <div className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-l-xl border-r border-border">
              <DifficultyBars level={difficultyLevels[recipe.difficulty].bars} />
              <span className="text-xs capitalize font-body font-medium">{recipe.difficulty}</span>
            </div>
            {/* Type / Season / Diet / Tested */}
            <div className="col-span-2 flex items-center justify-center gap-2 py-3 px-2 flex-wrap">
              <span className={`${chipBase} ${chipPrimary} capitalize`}>{recipe.type}</span>
              {recipe.season && (() => {
                const SeasonIcon = seasonIcons[recipe.season];
                return SeasonIcon ? (
                  <span className={`${chipBase} ${chipSecondary} capitalize gap-1`}>
                    <SeasonIcon size={14} />{recipe.season}
                  </span>
                ) : null;
              })()}
              {recipe.diets.includes('végétarien') && (
                <span className={`${chipBase} ${chipSecondary} gap-1`}>
                  <Vegan size={14} className="text-green-600" />Végé
                </span>
              )}
              <button
                onClick={() => {
                  if (recipe.userRole === 'reader') return;
                  onTestedToggle?.(!recipe.tested);
                }}
                className={`${chipBase} transition-colors cursor-pointer active:scale-95 gap-1 ${
                  recipe.tested ? chipPrimary : chipSecondary
                }`}
              >
                {recipe.tested && <Check size={12} />} {recipe.tested ? 'Testé' : 'À tester'}
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="text-[13px] px-3 py-1.5 rounded-full border border-primary/40 bg-primary/15 text-primary font-body font-medium capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        <FormSection title="Ingrédients">
          <div className="bg-card rounded-xl shadow-card p-4">
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 font-body text-sm">
                  <span className="text-card-foreground">{ing.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap ml-3">
                    {scaleQuantity(ing.quantity)} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </FormSection>

        {/* Steps */}
        <FormSection title="Préparation">
          <ol className="space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <div className="flex items-start gap-3 bg-secondary/40 rounded-xl p-3.5">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-warm flex items-center justify-center text-primary-foreground font-body font-bold text-xs mt-1">
                    {i + 1}
                  </span>
                  <p className="font-body text-foreground leading-relaxed whitespace-pre-line">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </FormSection>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}
