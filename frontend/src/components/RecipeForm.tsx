import React, { useEffect, useState, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, Plus, Star, Save, Camera, X, CircleCheck, Circle, Minus, ImagePlus, ImageMinus, Flower, Sun, Grape, Snowflake, Leaf, Wine, Salad, Beef, UtensilsCrossed, Cake, CupSoda, Timer, Flame, Users, CalendarDays, LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Recipe, Ingredient, Step, RecipeType, Season, Difficulty, Diet } from '@/data/recipes';
import { SortableIngredientItem } from './SortableIngredientItem';
import { SortableStepItem } from './SortableStepItem';
import { IconPicker } from './IconPicker';
import { IngredientStepsTabs } from './IngredientStepsTabs';
import { useAuthImage } from '@/hooks/use-auth-image';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface RecipeFormProps {
  onBack: () => void;
  onSave: (recipe: Recipe) => void;
  initialRecipe?: Recipe;
  allTags?: string[];
  onAddTag?: (tag: string) => void;
  onDeleteTag?: (tag: string) => void;
  initialFocus?: 'ingredients' | 'steps';
  initialImageOrientation?: 'landscape' | 'portrait';
  autoOpenImagePicker?: boolean;
}

const typeOptions: { value: RecipeType; label: string; icon: LucideIcon }[] = [
  { value: 'apéro', label: 'Apéro', icon: Wine },
  { value: 'entrée', label: 'Entrée', icon: Salad },
  { value: 'plat', label: 'Plat', icon: Beef },
  { value: 'pâtes', label: 'Pâtes', icon: UtensilsCrossed },
  { value: 'dessert', label: 'Dessert', icon: Cake },
  { value: 'boisson', label: 'Boisson', icon: CupSoda },
];
const seasonOptions: { value: Season; label: string; icon: LucideIcon }[] = [
  { value: 'printemps', label: 'Printemps', icon: Flower },
  { value: 'été', label: 'Été', icon: Sun },
  { value: 'automne', label: 'Automne', icon: Grape },
  { value: 'hiver', label: 'Hiver', icon: Snowflake },
];
const difficulties: Difficulty[] = ['facile', 'moyen', 'difficile'];

const defaultIngredients = (): Ingredient[] =>
  Array.from({ length: 3 }, () => ({ name: '', quantity: '', unit: '' }));

export default function RecipeForm({ onBack, onSave, initialRecipe, allTags = [], onAddTag, onDeleteTag, initialFocus, initialImageOrientation = 'landscape', autoOpenImagePicker }: RecipeFormProps) {
  const [data, setData] = useState<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'type'> & { type: RecipeType | null }>({
    title: initialRecipe?.title ?? '',
    description: initialRecipe?.description ?? '',
    image: initialRecipe?.image,
    type: initialRecipe?.type ?? null,
    season: initialRecipe?.season ?? null,
    difficulty: initialRecipe?.difficulty ?? 'moyen',
    servings: initialRecipe?.servings ?? 4,
    prepTime: initialRecipe?.prepTime ?? 30,
    cookTime: initialRecipe?.cookTime ?? 30,
    rating: initialRecipe?.rating ?? 0,
    diets: initialRecipe?.diets ?? [],
    tags: initialRecipe?.tags ?? [],
    ingredients: initialRecipe?.ingredients?.length ? initialRecipe.ingredients : defaultIngredients(),
    steps: initialRecipe?.steps ?? [],
    tested: initialRecipe?.tested ?? false,
  });
  const [newTag, setNewTag] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait'>(initialImageOrientation);
  const [ingredientIds, setIngredientIds] = useState<string[]>(
    () => data.ingredients.map(() => crypto.randomUUID())
  );
  const [stepIds, setStepIds] = useState<string[]>(
    () => data.steps.map(() => crypto.randomUUID())
  );
  const imageRef = useRef<HTMLInputElement>(null);
  const imageSrc = useAuthImage(data.image);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!autoOpenImagePicker) return;
    const id = window.setTimeout(() => imageRef.current?.click(), 80);
    return () => window.clearTimeout(id);
  }, [autoOpenImagePicker]);

  useEffect(() => {
    if (!initialFocus) return;
    const itemSelector = initialFocus === 'ingredients' ? '[data-ingredient-name]' : '[data-step-textarea]';
    const fallbackSelector = initialFocus === 'ingredients' ? '[data-add-ingredient]' : '[data-add-step]';
    const id = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(itemSelector) ?? document.querySelector<HTMLElement>(fallbackSelector);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [initialFocus]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => setData((d) => ({ ...d, [key]: value }));

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    setData((d) => {
      const updated = [...d.ingredients];
      updated[i] = { ...updated[i], [field]: value };
      return { ...d, ingredients: updated };
    });
  };
  const addIngredient = () => {
    set('ingredients', [...data.ingredients, { name: '', quantity: '', unit: '' }]);
    setIngredientIds((ids) => [...ids, crypto.randomUUID()]);
  };
  const removeIngredient = (i: number) => {
    set('ingredients', data.ingredients.filter((_, idx) => idx !== i));
    setIngredientIds((ids) => ids.filter((_, idx) => idx !== i));
  };
  const moveIngredient = (from: number, to: number) => {
    set('ingredients', arrayMove(data.ingredients, from, to));
    setIngredientIds((ids) => arrayMove(ids, from, to));
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ingredientIds.indexOf(active.id as string);
      const newIndex = ingredientIds.indexOf(over.id as string);
      moveIngredient(oldIndex, newIndex);
    }
  };

  const updateStep = (i: number, text: string) => {
    const updated = [...data.steps];
    updated[i] = { text };
    set('steps', updated);
  };
  const addStep = () => {
    set('steps', [...data.steps, { text: '' }]);
    setStepIds((ids) => [...ids, crypto.randomUUID()]);
  };
  const removeStep = (i: number) => {
    set('steps', data.steps.filter((_, idx) => idx !== i));
    setStepIds((ids) => ids.filter((_, idx) => idx !== i));
  };
  const moveStep = (from: number, to: number) => {
    set('steps', arrayMove(data.steps, from, to));
    setStepIds((ids) => arrayMove(ids, from, to));
  };
  const handleStepDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stepIds.indexOf(active.id as string);
      const newIndex = stepIds.indexOf(over.id as string);
      moveStep(oldIndex, newIndex);
    }
  };

  const toggleDiet = (diet: Diet) => set('diets', data.diets.includes(diet) ? data.diets.filter((d) => d !== diet) : [...data.diets, diet]);
  const toggleTag = (tag: string) => set('tags', data.tags.includes(tag) ? data.tags.filter((t) => t !== tag) : [...data.tags, tag]);

  const addNewTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !data.tags.includes(tag)) {
      set('tags', [...data.tags, tag]);
      onAddTag?.(tag);
    }
    setNewTag('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('image', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.altKey && e.key === 'ArrowUp' && i > 0) {
      e.preventDefault();
      moveIngredient(i, i - 1);
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>('[data-ingredient-name]');
        inputs[i - 1]?.focus();
      }, 50);
      return;
    }
    if (e.altKey && e.key === 'ArrowDown' && i < data.ingredients.length - 1) {
      e.preventDefault();
      moveIngredient(i, i + 1);
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>('[data-ingredient-name]');
        inputs[i + 1]?.focus();
      }, 50);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (i === data.ingredients.length - 1) addIngredient();
      setTimeout(() => {
        const inputs = document.querySelectorAll<HTMLInputElement>('[data-ingredient-name]');
        inputs[i + 1]?.focus();
      }, 50);
    }
  };

  const handleStepKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.altKey && e.key === 'ArrowUp' && i > 0) {
      e.preventDefault();
      moveStep(i, i - 1);
      setTimeout(() => {
        const areas = document.querySelectorAll<HTMLTextAreaElement>('[data-step-textarea]');
        areas[i - 1]?.focus();
      }, 50);
      return;
    }
    if (e.altKey && e.key === 'ArrowDown' && i < data.steps.length - 1) {
      e.preventDefault();
      moveStep(i, i + 1);
      setTimeout(() => {
        const areas = document.querySelectorAll<HTMLTextAreaElement>('[data-step-textarea]');
        areas[i + 1]?.focus();
      }, 50);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (i === data.steps.length - 1) addStep();
      setTimeout(() => {
        const areas = document.querySelectorAll<HTMLTextAreaElement>('[data-step-textarea]');
        areas[i + 1]?.focus();
      }, 50);
    }
  };

  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const missing: string[] = [];
    if (!data.title.trim()) missing.push('Titre');
    if (!data.type) missing.push('Type');
    if (missing.length > 0) {
      setErrors(missing);
      window.setTimeout(() => {
        const el = document.querySelector<HTMLElement>('[data-error]');
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }, 0);
      return;
    }
    setErrors([]);
    const now = new Date().toISOString().split('T')[0];
    onSave({
      ...data,
      type: data.type as RecipeType,
      id: initialRecipe?.id ?? Date.now().toString(),
      ingredients: data.ingredients.filter((i) => i.name.trim()),
      steps: data.steps.filter((s) => s.text.trim()),
      createdAt: initialRecipe?.createdAt ?? now,
      updatedAt: now,
    });
  };

  const combinedTags = [...new Set([...allTags, ...data.tags])];

  return (
    <div>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-[60] bg-card/95 backdrop-blur-sm border-b border-border shadow-card px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <Button size="sm" className="gradient-warm text-primary-foreground font-body gap-1.5" onClick={handleSubmit}>
          <Save size={14} /> Enregistrer
        </Button>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="bg-primary/10 border-b border-primary/30 px-4 py-2 text-center">
          <p className="text-sm font-body text-primary font-medium">
            Champs requis : {errors.join(', ')}
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-8 md:grid md:grid-cols-12 md:gap-12 lg:gap-16">
        <aside className="md:col-span-4 space-y-6">
        <input ref={imageRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
        {(() => {
          const aspectClass = imageOrientation === 'portrait' ? 'aspect-square' : 'aspect-[16/9]';
          const shape = `w-full ${aspectClass} rounded-2xl md:aspect-square md:rounded-full`;
          return (
            <div className="flex flex-col gap-4">
              {/* Image */}
              {data.image ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`relative flex-shrink-0 ${shape} overflow-hidden ring-1 ring-border cursor-pointer group`}>
                      {imageSrc ? (
                        <>
                          <img
                            src={imageSrc}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl md:hidden"
                          />
                          <img
                            src={imageSrc}
                            alt={data.title}
                            onLoad={(e) => {
                              const { naturalWidth, naturalHeight } = e.currentTarget;
                              setImageOrientation(naturalHeight > naturalWidth ? 'portrait' : 'landscape');
                            }}
                            className="relative w-full h-full object-contain md:object-cover"
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-muted animate-pulse" />
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={20} className="text-white" />
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="font-body gap-2" onClick={() => imageRef.current?.click()}>
                      <ImagePlus size={16} /> Modifier l'image
                    </DropdownMenuItem>
                    <DropdownMenuItem className="font-body gap-2 text-destructive focus:text-destructive" onClick={() => set('image', undefined)}>
                      <ImageMinus size={16} /> Supprimer l'image
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => imageRef.current?.click()}
                  className={`flex-shrink-0 ${shape} bg-muted border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex items-center justify-center cursor-pointer`}
                >
                  <Camera size={24} className="text-muted-foreground/50" />
                </button>
              )}

              {/* Title + description + rating */}
              <div className="w-full space-y-2">
                <Input
                  value={data.title}
                  onChange={(e) => {
                    set('title', e.target.value);
                    if (errors.includes('Titre')) setErrors((errs) => errs.filter((er) => er !== 'Titre'));
                  }}
                  placeholder="Titre de la recette"
                  aria-invalid={errors.includes('Titre')}
                  data-error={errors.includes('Titre') || undefined}
                  className={`font-display text-xl md:text-2xl font-bold text-foreground h-auto py-3 px-4 rounded-lg placeholder:text-muted-foreground/40 ${
                    errors.includes('Titre') ? 'border-2 border-primary bg-primary/5' : ''
                  }`}
                />
                <div className="rounded-lg border border-input bg-background px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex gap-0.5" onMouseLeave={() => setHoveredRating(0)}>
                      {[1, 2, 3, 4, 5].map((i) => {
                        const displayRating = hoveredRating || data.rating;
                        const filled = i <= displayRating;
                        const isPreview = hoveredRating > 0 && i > data.rating;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setData((d) => {
                                const next = d.rating === i ? 0 : i;
                                return {
                                  ...d,
                                  rating: next,
                                  tested: d.rating === 0 && next > 0 ? true : d.tested,
                                };
                              });
                            }}
                            onMouseEnter={() => setHoveredRating(i)}
                            className="transition-transform [@media(hover:hover)_and_(pointer:fine)]:hover:scale-110"
                          >
                            <Star
                              size={22}
                              className={`transition-colors ${
                                filled
                                  ? isPreview
                                    ? 'fill-primary/40 text-primary/40'
                                    : 'fill-primary text-primary'
                                  : 'text-muted-foreground/40'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => set('tested', !data.tested)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-body transition-colors ${
                        data.tested
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {data.tested ? <CircleCheck size={12} className="shrink-0" /> : <Circle size={12} className="shrink-0" />}
                      <span className="relative inline-block">
                        <span className="invisible">À tester</span>
                        <span className="absolute inset-0">{data.tested ? 'Testé' : 'À tester'}</span>
                      </span>
                    </button>
                  </div>
                  <span className="hidden md:block text-[11px] font-body text-muted-foreground">
                    {['Pas noté', 'Ça se laisse manger', 'Plutôt pas mal !', 'Je reprendrais du rab', 'Un vrai régal !', 'Une recette qui met tout le monde d\'accord'][hoveredRating || data.rating]}
                  </span>
                </div>
                <Textarea
                  value={data.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Une note, une anecdote, l'origine de la recette…"
                  rows={2}
                  className="font-body text-sm text-foreground placeholder:text-muted-foreground/50 py-3 px-4 rounded-lg min-h-0 resize-none"
                />
              </div>
            </div>
          );
        })()}

        {/* Tags & categories — mirrors MobileSearchOverlay design, packed */}
        <div className="space-y-4">
          {/* Type — single card opens dropdown */}
          <IconPicker
            options={typeOptions}
            value={data.type}
            onChange={(v) => {
              set('type', v);
              if (v && errors.includes('Type')) setErrors((errs) => errs.filter((er) => er !== 'Type'));
            }}
            placeholder="Type de recette"
            error={errors.includes('Type')}
          />

          {/* Season — single card opens dropdown */}
          <IconPicker
            options={seasonOptions}
            value={data.season}
            onChange={(v) => set('season', v)}
            allowDeselect
            nullOption={{ label: 'Toutes saisons', icon: CalendarDays }}
          />

          {/* Tags — outline ghost pills, Végé pinned first */}
          <FormSection title="Tags">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => toggleDiet('végétarien')}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`text-[13px] px-3 py-1.5 rounded-full border font-body font-medium transition-all duration-150 active:scale-95 inline-flex items-center gap-1 ${
                  data.diets.includes('végétarien')
                    ? 'bg-success/15 border-success/40 text-success'
                    : 'bg-transparent border-border text-muted-foreground active:border-foreground/30 active:text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:border-foreground/30 [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground'
                }`}
              >
                <Leaf size={12} />
                Végé
              </button>
              {combinedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`text-[13px] pl-3 pr-2 py-1.5 rounded-full border font-body font-medium capitalize transition-all duration-150 active:scale-95 inline-flex items-center gap-1 ${
                    data.tags.includes(tag)
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-transparent border-border text-muted-foreground active:border-foreground/30 active:text-foreground [@media(hover:hover)_and_(pointer:fine)]:hover:border-foreground/30 [@media(hover:hover)_and_(pointer:fine)]:hover:text-foreground'
                  }`}
                >
                  {tag}
                  <button
                    onClick={(e) => { e.stopPropagation(); setTagToDelete(tag); }}
                    className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    title={`Supprimer "${tag}"`}
                  >
                    <X size={10} />
                  </button>
                </button>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                  placeholder="Nouveau tag…"
                  className="h-8 w-28 text-xs font-body rounded-full border-dashed"
                />
                <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full" onClick={addNewTag}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </FormSection>
        </div>
        </aside>

        <div className="md:col-span-8 mt-8 md:mt-0 space-y-8">
          {/* Quick info bars */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {/* Prep time */}
            <label className="bg-card rounded-2xl shadow-card flex flex-col items-center justify-center gap-1 py-4 px-3 cursor-text">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Timer size={14} />
                <span className="text-[10px] font-body font-semibold uppercase tracking-wider">Préparation</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={data.prepTime || ''}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); set('prepTime', v ? +v : 0); }}
                  placeholder="0"
                  className="w-10 text-center font-display text-xl font-bold text-foreground tabular-nums bg-transparent outline-none"
                />
                <span className="text-xs text-muted-foreground font-body">min</span>
              </div>
            </label>
            {/* Cook time */}
            <label className="bg-card rounded-2xl shadow-card flex flex-col items-center justify-center gap-1 py-4 px-3 cursor-text">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Flame size={14} />
                <span className="text-[10px] font-body font-semibold uppercase tracking-wider">Cuisson</span>
              </div>
              <div className="flex items-baseline gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={data.cookTime || ''}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); set('cookTime', v ? +v : 0); }}
                  placeholder="0"
                  className="w-10 text-center font-display text-xl font-bold text-foreground tabular-nums bg-transparent outline-none"
                />
                <span className="text-xs text-muted-foreground font-body">min</span>
              </div>
            </label>
            {/* Servings */}
            <div className="bg-card rounded-2xl shadow-card flex flex-col items-center justify-center gap-1 py-4 px-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users size={14} />
                <span className="text-[10px] font-body font-semibold uppercase tracking-wider">Portions</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Diminuer les portions"
                  onClick={() => set('servings', Math.max(1, data.servings - 1))}
                  className="relative w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/20 hover:text-foreground transition-colors before:absolute before:-inset-2 before:content-['']"
                >
                  <Minus size={12} />
                </button>
                <span className="font-display text-xl font-bold text-foreground min-w-[1.5rem] text-center tabular-nums">{data.servings}</span>
                <button
                  type="button"
                  aria-label="Augmenter les portions"
                  onClick={() => set('servings', data.servings + 1)}
                  className="relative w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-primary/20 hover:text-foreground transition-colors before:absolute before:-inset-2 before:content-['']"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const idx = difficulties.indexOf(data.difficulty);
              set('difficulty', difficulties[(idx + 1) % difficulties.length] as Difficulty);
            }}
            className="w-full bg-card rounded-xl shadow-card flex items-center justify-center gap-1.5 py-3 px-2 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <DifficultyBars level={difficultyLevels[data.difficulty].bars} />
            <span className="text-xs capitalize font-body font-medium">{data.difficulty}</span>
          </button>
        </div>

        <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">Supprimer le tag « {tagToDelete} » ?</AlertDialogTitle>
              <AlertDialogDescription className="font-body">
                Ce tag sera supprimé de toutes les recettes. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-body">Annuler</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                onClick={() => { onDeleteTag?.(tagToDelete!); setTagToDelete(null); }}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {(() => {
          const ingredientsBlock = (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ingredientIds} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-1.5">
                    {data.ingredients.map((ing, i) => (
                      <SortableIngredientItem
                        key={ingredientIds[i]}
                        id={ingredientIds[i]}
                        ingredient={ing}
                        index={i}
                        onUpdate={updateIngredient}
                        onRemove={removeIngredient}
                        onKeyDown={handleIngredientKeyDown}
                        canRemove={data.ingredients.length > 1}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
              <button
                type="button"
                onClick={addIngredient}
                data-add-ingredient
                className="w-full mt-2 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5 text-sm font-body active:scale-[0.98]"
              >
                <Plus size={14} /> Ajouter un ingrédient
              </button>
            </>
          );

          const stepsBlock = (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStepDragEnd}>
                <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
                  <ol className="space-y-2.5">
                    {data.steps.map((step, i) => (
                      <SortableStepItem
                        key={stepIds[i]}
                        id={stepIds[i]}
                        step={step}
                        index={i}
                        onUpdate={updateStep}
                        onRemove={removeStep}
                        onKeyDown={handleStepKeyDown}
                        canRemove={data.steps.length > 0}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
              <button
                type="button"
                onClick={addStep}
                data-add-step
                className="w-full mt-2 py-2 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1.5 text-sm font-body active:scale-[0.98]"
              >
                <Plus size={14} /> Ajouter une étape
              </button>
            </>
          );

          if (isMobile) {
            return <IngredientStepsTabs ingredients={ingredientsBlock} steps={stepsBlock} />;
          }

          return (
            <div className="space-y-8">
              <FormSection title="Ingrédients">{ingredientsBlock}</FormSection>
              <FormSection title="Préparation">{stepsBlock}</FormSection>
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}
