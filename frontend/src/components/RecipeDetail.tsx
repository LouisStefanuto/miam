import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Pencil, Trash2, Minus, Plus, CircleCheck, Copy, ClipboardCheck, Users, CopyPlus, LogOut, Vegan, Timer, Flame, Sun, Snowflake, Flower, LeafyGreen, Utensils, Circle, Camera, ShoppingCart, LucideIcon } from 'lucide-react';
import { Recipe } from '@/data/recipes';
import { displayUnit } from '@/lib/units';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import RecipeForm from './RecipeForm';
import { IngredientStepsTabs } from './IngredientStepsTabs';
import StepText from './StepText';
import { recipeToMarkdown } from '@/lib/recipe-to-markdown';
import { useToast } from '@/hooks/use-toast';
import { useAuthImage } from '@/hooks/use-auth-image';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCart } from '@/contexts/CartContext';

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
  const {
    has: cartHas,
    add: addToCart,
    remove: removeFromCart,
    setServings: setCartServings,
    servingsById,
  } = useCart();
  const inCart = cartHas(recipe.id);
  const [editing, setEditing] = useState(!!initialEditing);
  // Picks up the servings chosen in the cart, so both views agree on the portion count
  const [displayServings, setDisplayServings] = useState(
    () => servingsById[recipe.id] ?? recipe.servings,
  );
  const [hoveredStar, setHoveredStar] = useState(0);
  const [copied, setCopied] = useState(false);
  const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [editFocusTarget, setEditFocusTarget] = useState<'ingredients' | 'steps' | undefined>(undefined);
  const [autoOpenImagePicker, setAutoOpenImagePicker] = useState(false);
  const { toast } = useToast();
  const imageSrc = useAuthImage(recipe.image);
  const isMobile = useIsMobile();
  const canEdit = recipe.userRole !== 'reader';
  const imageClickable = !isMobile && canEdit;

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

  // While the recipe sits in the cart, the portions picked here drive the shopping list
  useEffect(() => {
    if (inCart) setCartServings(recipe.id, displayServings);
  }, [inCart, displayServings, recipe.id, setCartServings]);

  const toggleCart = () => {
    if (inCart) removeFromCart(recipe.id);
    else addToCart(recipe.id, displayServings);
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

  const SeasonIcon = recipe.season ? seasonIcons[recipe.season] : null;
  const canToggleTested = recipe.userRole !== 'reader';
  const infoRowClass = 'flex items-center gap-2 text-sm font-body text-foreground';
  const iconSize = 16;
  const iconClass = 'text-muted-foreground shrink-0';

  const metadataRail = (
    <ul className="space-y-1.5">
      <li className={infoRowClass}>
        <Utensils size={iconSize} className={iconClass} />
        <span className="capitalize">{recipe.type}</span>
      </li>
      {recipe.season && SeasonIcon && (
        <li className={infoRowClass}>
          <SeasonIcon size={iconSize} className={iconClass} />
          <span className="capitalize">{recipe.season}</span>
        </li>
      )}
      <li className={infoRowClass}>
        <span className={`${iconClass} flex items-center justify-center w-4 h-4`}>
          <DifficultyBars level={difficultyLevels[recipe.difficulty].bars} />
        </span>
        <span className="capitalize">{recipe.difficulty}</span>
      </li>
      {recipe.diets.includes('végétarien') && (
        <li className={infoRowClass}>
          <Vegan size={iconSize} className="text-green-600 shrink-0" />
          <span>Végétarien</span>
        </li>
      )}
    </ul>
  );

  const tagsRail = recipe.tags.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
      {recipe.tags.map((tag) => (
        <span
          key={tag}
          className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-body capitalize"
        >
          {tag}
        </span>
      ))}
    </div>
  ) : null;

  const chipClass = 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-body capitalize';
  const chipIconSize = 12;
  const difficultyLevel = difficultyLevels[recipe.difficulty].bars;

  const metadataChips = (
    <div className="flex flex-wrap gap-1.5">
      <span className={chipClass}>
        <Utensils size={chipIconSize} className="shrink-0" />
        {recipe.type}
      </span>
      {recipe.season && SeasonIcon && (
        <span className={chipClass}>
          <SeasonIcon size={chipIconSize} className="shrink-0" />
          {recipe.season}
        </span>
      )}
      <span className={chipClass}>
        <span className="flex gap-0.5 items-end h-3 shrink-0">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-0.5 rounded-sm ${i <= difficultyLevel ? 'bg-primary' : 'bg-foreground/15'}`}
              style={{ height: `${3 + i * 2}px` }}
            />
          ))}
        </span>
        {recipe.difficulty}
      </span>
      {recipe.diets.includes('végétarien') && (
        <span className={chipClass}>
          <Vegan size={chipIconSize} className="text-green-600 shrink-0" />
          Végétarien
        </span>
      )}
      {recipe.tags.map((tag) => (
        <span key={tag} className={chipClass}>
          {tag}
        </span>
      ))}
    </div>
  );

  const mobileTestedPill = (
    <button
      type="button"
      onClick={() => canToggleTested && onTestedToggle?.(!recipe.tested)}
      disabled={!canToggleTested}
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-body transition-colors ${
        recipe.tested
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground'
      } ${canToggleTested ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
    >
      {recipe.tested ? <CircleCheck size={chipIconSize} className="shrink-0" /> : <Circle size={chipIconSize} className="shrink-0" />}
      <span className="relative inline-block">
        <span className="invisible">À tester</span>
        <span className="absolute inset-0">{recipe.tested ? 'Testé' : 'À tester'}</span>
      </span>
    </button>
  );

  // Edit mode — delegate to RecipeForm
  if (editing) {
    return (
      <RecipeForm
        onBack={() => { setEditing(false); setEditFocusTarget(undefined); setAutoOpenImagePicker(false); }}
        onSave={handleFormSave}
        initialRecipe={recipe}
        allTags={allTags}
        onAddTag={onAddTag}
        onDeleteTag={onDeleteTag}
        initialFocus={editFocusTarget}
        initialImageOrientation={imageOrientation}
        autoOpenImagePicker={autoOpenImagePicker}
      />
    );
  }

  // Read mode
  return (
    <div>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-card px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:text-muted-foreground md:hover:text-primary">
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="flex gap-1">
          {/* Owner: delete */}
          {isOwner && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 active:text-destructive active:bg-destructive/10 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/40 dark:active:text-red-400 dark:active:bg-red-900/40">
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
                <Button variant="ghost" size="icon" className="md:text-muted-foreground md:hover:text-primary"><CopyPlus size={18} /></Button>
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
                <Button variant="ghost" size="icon" className="md:text-muted-foreground md:hover:text-primary"><LogOut size={18} /></Button>
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
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="md:text-muted-foreground md:hover:text-primary">
              <Pencil size={18} />
            </Button>
          )}
          {/* Share */}
          {shareButton}
          {/* Copy markdown */}
          <Button variant="ghost" size="icon" onClick={copyAsMarkdown} className="md:text-muted-foreground md:hover:text-primary">
            {copied ? <ClipboardCheck size={18} /> : <Copy size={18} />}
          </Button>
          {/* Cart, for the number of portions currently displayed */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCart}
            title={inCart ? 'Retirer du panier' : `Ajouter au panier (${displayServings} pers.)`}
            className={inCart ? 'text-primary hover:text-primary' : 'md:text-muted-foreground md:hover:text-primary'}
          >
            <ShoppingCart size={18} className={inCart ? 'fill-primary' : ''} />
            <span className="sr-only">{inCart ? 'Retirer du panier' : 'Ajouter au panier'}</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-6 md:pb-8 md:grid md:grid-cols-12 md:gap-12 lg:gap-16">
        {/* Left: image + title + rating + description */}
        <aside className="md:col-span-4">
          <div className="flex flex-col gap-4">
            {(() => {
              const aspectClass = imageOrientation === 'portrait' ? 'aspect-square' : 'aspect-[16/9]';
              const wrapperBase = `w-full ${aspectClass} rounded-2xl md:aspect-square md:rounded-full`;
              const ringClass = 'ring-1 ring-border';
              const clickableClass = imageClickable ? 'md:cursor-pointer' : '';
              const tooltip = imageClickable ? (
                <span className="hidden md:block pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded-md bg-foreground text-background text-xs font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Changer l'image
                </span>
              ) : null;
              const hasNoImage = !recipe.image;
              const placeholderClickable = canEdit && hasNoImage;
              const imageEl = imageSrc ? (
                <div className={`${wrapperBase} relative overflow-hidden ${ringClass} ${clickableClass}`}>
                  <img
                    src={imageSrc}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl md:hidden"
                  />
                  <img
                    src={imageSrc}
                    alt={recipe.title}
                    onLoad={(e) => {
                      const { naturalWidth, naturalHeight } = e.currentTarget;
                      setImageOrientation(naturalHeight > naturalWidth ? 'portrait' : 'landscape');
                    }}
                    className="relative w-full h-full object-contain md:object-cover"
                  />
                </div>
              ) : recipe.image ? (
                <div className={`${wrapperBase} bg-muted animate-pulse`} />
              ) : (
                <div className={`${wrapperBase} bg-muted border-2 border-dashed border-muted-foreground/30 ${placeholderClickable ? 'group-hover:border-primary/50 transition-colors cursor-pointer' : ''} flex items-center justify-center`}>
                  <Camera size={24} className="text-muted-foreground/50" />
                </div>
              );
              if (placeholderClickable) {
                return (
                  <button
                    type="button"
                    onClick={() => { setAutoOpenImagePicker(true); setEditing(true); }}
                    aria-label="Ajouter une image"
                    className="group block relative w-full"
                  >
                    {imageEl}
                  </button>
                );
              }
              return imageClickable ? (
                <button type="button" onClick={() => setEditing(true)} aria-label="Modifier la recette" className="group block relative w-full">
                  {imageEl}
                  {tooltip}
                </button>
              ) : imageEl;
            })()}
            <div className="w-full space-y-0.5">
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">{recipe.title}</h1>
              <div className="flex items-center gap-3 pt-1">
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
                {mobileTestedPill}
              </div>
              {recipe.description && (
                <p className="font-body text-sm text-muted-foreground">{recipe.description}</p>
              )}
            </div>
          </div>
          {/* Metadata + tags — desktop only (mobile renders them in the body) */}
          <div className="hidden md:block space-y-3 pt-4">
            {metadataRail}
            {tagsRail}
          </div>
        </aside>

        {/* Right: body content */}
        <div className="md:col-span-8 mt-8 md:mt-0 space-y-8">
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

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-2xl shadow-card">
            <Stat icon={Timer} label="Préparation" value={recipe.prepTime} unit="min" />
          </div>
          <div className="bg-card rounded-2xl shadow-card">
            <Stat icon={Flame} label="Cuisson" value={recipe.cookTime} unit="min" />
          </div>
          <div className="bg-card rounded-2xl shadow-card flex flex-col items-center justify-center gap-1 py-4 px-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users size={14} />
              <span className="text-[10px] font-body font-semibold uppercase tracking-wider">Portions</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Diminuer les portions"
                onClick={() => setDisplayServings(Math.max(1, displayServings - 1))}
                className="relative w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/20 hover:text-foreground transition-colors before:absolute before:-inset-2 before:content-['']"
              >
                <Minus size={12} />
              </button>
              <span className="font-display text-xl font-bold text-foreground min-w-[1.5rem] text-center tabular-nums">{displayServings}</span>
              <button
                type="button"
                aria-label="Augmenter les portions"
                onClick={() => setDisplayServings(displayServings + 1)}
                className="relative w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/20 hover:text-foreground transition-colors before:absolute before:-inset-2 before:content-['']"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Metadata + tags — mobile only (desktop renders them under the title) */}
        <div className="md:hidden">
          {metadataChips}
        </div>

        {/* Ingredients & Steps — tabs on mobile, stacked on desktop */}
        {(() => {
          const ingredientsContent = recipe.ingredients.length > 0 ? (
            <div className="bg-card rounded-xl shadow-card p-4">
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => {
                  const scaled = scaleQuantity(ing.quantity);
                  return (
                    <li key={i} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 font-body text-sm">
                      <span className="text-card-foreground">{ing.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap ml-3">
                        {scaled} {displayUnit(ing.unit, scaled)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : canEdit ? (
            <button
              type="button"
              onClick={() => { setEditFocusTarget('ingredients'); setEditing(true); }}
              className="w-full py-6 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5 text-sm font-body active:scale-[0.98]"
            >
              <Plus size={14} /> Ajouter des ingrédients
            </button>
          ) : null;

          const stepsContent = recipe.steps.length > 0 ? (
            <ol className="space-y-2.5">
              {recipe.steps.map((step, i) => (
                <li key={i}>
                  <div className="flex items-start gap-4 bg-card rounded-xl p-4 shadow-card border border-border/60">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-warm flex items-center justify-center text-primary-foreground font-body font-bold text-xs leading-none">
                      {i + 1}
                    </span>
                    <p className="font-body text-foreground leading-7 whitespace-pre-line flex-1">
                      <StepText text={step.text} timerIdPrefix={`${recipe.id}:${i}`} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : canEdit ? (
            <button
              type="button"
              onClick={() => { setEditFocusTarget('steps'); setEditing(true); }}
              className="w-full py-6 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5 text-sm font-body active:scale-[0.98]"
            >
              <Plus size={14} /> Ajouter une étape
            </button>
          ) : null;

          if (!ingredientsContent && !stepsContent) return null;

          if (!isMobile) {
            return (
              <>
                {ingredientsContent && <FormSection title="Ingrédients">{ingredientsContent}</FormSection>}
                {stepsContent && <FormSection title="Préparation">{stepsContent}</FormSection>}
              </>
            );
          }

          return (
            <IngredientStepsTabs
              ingredients={
                ingredientsContent ?? (
                  <p className="text-sm font-body text-muted-foreground text-center py-6">Aucun ingrédient.</p>
                )
              }
              steps={
                stepsContent ?? (
                  <p className="text-sm font-body text-muted-foreground text-center py-6">Aucune étape.</p>
                )
              }
            />
          );
        })()}
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

function Stat({ icon: Icon, label, value, unit }: { icon: LucideIcon; label: string; value: number; unit: string }) {
  const hasValue = value > 0;
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-4 px-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon size={14} />
        <span className="text-[10px] font-body font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-xl font-bold text-foreground tabular-nums">{hasValue ? value : '—'}</span>
        {hasValue && <span className="text-xs text-muted-foreground font-body">{unit}</span>}
      </div>
    </div>
  );
}
