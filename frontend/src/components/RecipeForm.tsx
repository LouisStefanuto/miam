import React, { useState, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ArrowLeft, Plus, Trash2, Star, Save, Camera, X, Check, Minus, ImagePlus, ImageMinus, Flower, Sun, Grape, Snowflake, Leaf, Wine, Salad, Beef, UtensilsCrossed, Cake, CupSoda, LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Recipe, Ingredient, Step, RecipeType, Season, Difficulty, Diet } from '@/data/recipes';
import { SortableIngredientItem } from './SortableIngredientItem';
import cuissonIcon from '@/assets/icons/cuisson.png';
import melangeIcon from '@/assets/icons/melange.png';
import servingsIcon from '@/assets/icons/servings.png';

const DifficultyBars = ({ level }: { level: number }) => (
  <div className="flex gap-0.5 items-end">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`w-1.5 rounded-sm ${i <= level ? 'bg-primary' : 'bg-muted'}`} style={{ height: `${8 + i * 4}px` }} />
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
  Array.from({ length: 5 }, () => ({ name: '', quantity: '', unit: '' }));

export default function RecipeForm({ onBack, onSave, initialRecipe, allTags = [], onAddTag, onDeleteTag }: RecipeFormProps) {
  const [data, setData] = useState<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>({
    title: initialRecipe?.title ?? '',
    image: initialRecipe?.image,
    type: initialRecipe?.type ?? 'plat',
    season: initialRecipe?.season ?? null,
    difficulty: initialRecipe?.difficulty ?? 'moyen',
    servings: initialRecipe?.servings ?? 4,
    prepTime: initialRecipe?.prepTime ?? 30,
    cookTime: initialRecipe?.cookTime ?? 30,
    rating: initialRecipe?.rating ?? 0,
    diets: initialRecipe?.diets ?? [],
    tags: initialRecipe?.tags ?? [],
    ingredients: initialRecipe?.ingredients?.length ? initialRecipe.ingredients : defaultIngredients(),
    steps: initialRecipe?.steps?.length ? initialRecipe.steps : [{ text: '' }],
    tested: initialRecipe?.tested ?? false,
  });
  const [newTag, setNewTag] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [ingredientIds, setIngredientIds] = useState<string[]>(
    () => data.ingredients.map(() => crypto.randomUUID())
  );
  const imageRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => setData((d) => ({ ...d, [key]: value }));

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...data.ingredients];
    (updated[i] as any)[field] = value;
    set('ingredients', updated);
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
  const addStep = () => set('steps', [...data.steps, { text: '' }]);
  const removeStep = (i: number) => set('steps', data.steps.filter((_, idx) => idx !== i));

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
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    setErrors([]);
    const now = new Date().toISOString().split('T')[0];
    onSave({
      ...data,
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
      <div className="fixed top-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-sm border-b border-border shadow-card px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={20} />
          <span className="sr-only">Retour</span>
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="font-body gap-1.5" onClick={onBack}>
            <X size={14} /> Annuler
          </Button>
          <Button size="sm" className="gradient-warm text-primary-foreground font-body gap-1.5" onClick={handleSubmit}>
            <Save size={14} /> Enregistrer
          </Button>
        </div>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="fixed top-14 left-0 right-0 z-[59] bg-destructive/10 border-b border-destructive/30 px-4 py-2 text-center">
          <p className="text-sm font-body text-destructive font-medium">
            Champs requis : {errors.join(', ')}
          </p>
        </div>
      )}

      {/* Header: image circle + title */}
      <div className={`px-4 md:px-8 ${errors.length > 0 ? 'mt-24' : 'mt-14'} pt-6`}>
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <div className="flex items-center gap-4">
          {/* Image circle */}
          {data.image ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-2 ring-primary/20 hover:ring-primary/40 transition-all cursor-pointer group">
                  <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
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
              className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Camera size={24} className="text-muted-foreground/50" />
            </button>
          )}

          {/* Title + description */}
          <div className="flex-1 min-w-0 space-y-2">
            <Input
              value={data.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Titre de la recette"
              className="font-display text-2xl md:text-3xl font-bold bg-transparent border-b border-border text-foreground h-auto p-0 rounded-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
            />
            <Input
              value={data.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Description"
              className="font-body text-sm md:text-base bg-transparent border-b border-border text-muted-foreground placeholder:text-muted-foreground/40 h-auto p-0 rounded-none focus-visible:ring-0"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Quick info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
            <IconDisk><img src={melangeIcon} alt="Préparation" className="w-5 h-5" /></IconDisk>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={data.prepTime || ''}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); set('prepTime', v ? +v : 0); }}
              placeholder="0"
              className="h-7 w-16 text-center text-sm font-body font-semibold bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none transition-colors"
            />
            <span className="text-xs text-muted-foreground font-body">Préparation (min)</span>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
            <IconDisk><img src={cuissonIcon} alt="Cuisson" className="w-5 h-5" /></IconDisk>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={data.cookTime || ''}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); set('cookTime', v ? +v : 0); }}
              placeholder="0"
              className="h-7 w-16 text-center text-sm font-body font-semibold bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none transition-colors"
            />
            <span className="text-xs text-muted-foreground font-body">Cuisson (min)</span>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
            <IconDisk><img src={servingsIcon} alt="Portions" className="w-5 h-5" /></IconDisk>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => set('servings', Math.max(1, data.servings - 1))} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Minus size={16} />
              </button>
              <span className="text-sm font-body font-semibold text-card-foreground min-w-[1.5rem] text-center">{data.servings}</span>
              <button type="button" onClick={() => set('servings', data.servings + 1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <span className="text-xs text-muted-foreground font-body">Portions</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const idx = difficulties.indexOf(data.difficulty);
              set('difficulty', difficulties[(idx + 1) % difficulties.length] as Difficulty);
            }}
            className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1 cursor-pointer hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <DifficultyBars level={difficultyLevels[data.difficulty].bars} />
            </div>
            <span className="text-xs capitalize font-body">{data.difficulty}</span>
            <span className="text-xs text-muted-foreground font-body">Clic pour changer</span>
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-semibold text-foreground">Note :</span>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" onClick={() => set('rating', i)}>
              <Star size={20} className={i <= data.rating ? 'fill-primary text-primary' : 'text-muted'} />
            </button>
          ))}
        </div>

        {/* Tags & categories — mirrors MobileSearchOverlay design, packed */}
        <div className="space-y-4">
          {/* Type — icon grid */}
          <FormSection title="Type" icon={<UtensilsCrossed size={13} />}>
            <div className="grid grid-cols-6 gap-1.5">
              {typeOptions.map((opt) => {
                const active = data.type === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => set('type', opt.value)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border transition-all duration-150 active:scale-95 ${
                      active
                        ? 'bg-primary/12 border-primary/35 text-foreground shadow-sm'
                        : 'bg-card border-border text-muted-foreground active:bg-secondary'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-primary' : ''} />
                    <span className="text-[10px] font-body font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* Season — segmented control */}
          <FormSection title="Saison" icon={<Sun size={13} />}>
            <div className="flex gap-1 bg-secondary/70 rounded-xl p-1">
              {seasonOptions.map((opt) => {
                const active = data.season === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => set('season', data.season === opt.value ? null : opt.value as Season)}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    className={`flex-1 flex items-center justify-center gap-1 text-[12px] py-1.5 rounded-lg font-body font-medium ${
                      active
                        ? 'bg-card text-primary shadow-sm ring-1 ring-primary/35'
                        : 'text-muted-foreground active:text-foreground'
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* Preferences — toggle cards */}
          <FormSection title="Préférences">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => set('tested', !data.tested)}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border transition-all duration-150 active:scale-95 ${
                  data.tested
                    ? 'bg-primary/12 border-primary/35 text-primary'
                    : 'bg-card border-border text-muted-foreground active:bg-secondary'
                }`}
              >
                <Check size={18} />
                <span className="text-[10px] font-body font-semibold">Testé</span>
              </button>
              <button
                onClick={() => toggleDiet('végétarien')}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border transition-all duration-150 active:scale-95 ${
                  data.diets.includes('végétarien')
                    ? 'bg-success/12 border-success/35 text-success'
                    : 'bg-card border-border text-muted-foreground active:bg-secondary'
                }`}
              >
                <Leaf size={18} />
                <span className="text-[10px] font-body font-semibold">Végé</span>
              </button>
            </div>
          </FormSection>

          {/* Tags — outline ghost pills */}
          <FormSection title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {combinedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  className={`text-[13px] pl-3 pr-2 py-1.5 rounded-full border font-body font-medium capitalize transition-all duration-150 active:scale-95 inline-flex items-center gap-1 ${
                    data.tags.includes(tag)
                      ? 'bg-primary/15 border-primary/40 text-primary'
                      : 'bg-transparent border-border text-muted-foreground active:border-foreground/30 active:text-foreground'
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

        <div className="space-y-8">
          {/* Ingredients */}
          <div className="bg-card rounded-lg p-4 shadow-card">
            <h2 className="font-display text-xl font-semibold mb-4 text-card-foreground">Ingrédients</h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={ingredientIds} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
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
            <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="font-body gap-1 mt-3 w-full">
              <Plus size={14} /> Ajouter
            </Button>
          </div>

          {/* Steps */}
          <div>
            <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Préparation</h2>
            <ol className="space-y-4">
              {data.steps.map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full gradient-warm flex items-center justify-center text-primary-foreground font-body font-bold text-sm">
                    {i + 1}
                  </span>
                  <div className="flex gap-2 items-start flex-1">
                    <Textarea data-step-textarea value={step.text} onChange={(e) => updateStep(i, e.target.value)} onKeyDown={(e) => handleStepKeyDown(e, i)} placeholder={`Étape ${i + 1}`} className="font-body min-h-[50px] text-sm [field-sizing:content]" />
                    {data.steps.length > 1 && (
                      <button onClick={() => removeStep(i)} className="text-destructive hover:text-destructive/80 mt-2"><Trash2 size={14} /></button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <Button type="button" variant="outline" size="sm" onClick={addStep} className="font-body gap-1 mt-4">
              <Plus size={14} /> Ajouter une étape
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconDisk({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center [&>img]:[filter:brightness(0)_invert(1)] dark:[&>img]:[filter:brightness(0)]">
      {children}
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
