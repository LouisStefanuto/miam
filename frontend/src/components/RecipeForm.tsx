import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Star, Save, Camera, X, Check, Minus, ImagePlus, ImageMinus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Recipe, Ingredient, Step, RecipeType, Season, Difficulty, Diet } from '@/data/recipes';
import seasonSpring from '@/assets/icons/season-spring.png';
import seasonSummer from '@/assets/icons/season-summer.png';
import seasonFall from '@/assets/icons/season-fall.png';
import seasonWinter from '@/assets/icons/season-winter.png';
import veganIcon from '@/assets/icons/vegetalien.png';
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

const seasonIcons: Record<string, string> = {
  printemps: seasonSpring,
  été: seasonSummer,
  automne: seasonFall,
  hiver: seasonWinter,
};

interface RecipeFormProps {
  onBack: () => void;
  onSave: (recipe: Recipe) => void;
  initialRecipe?: Recipe;
  allTags?: string[];
  onAddTag?: (tag: string) => void;
  onDeleteTag?: (tag: string) => void;
}

const types: RecipeType[] = ['apéro', 'entrée', 'plat', 'pâtes', 'dessert', 'boisson'];
const seasons: Season[] = ['printemps', 'été', 'automne', 'hiver'];
const difficulties: Difficulty[] = ['facile', 'moyen', 'difficile'];
const dietOptions: Diet[] = ['végétarien'];

const defaultIngredients = (): Ingredient[] =>
  Array.from({ length: 5 }, () => ({ name: '', quantity: '', unit: '' }));

export default function RecipeForm({ onBack, onSave, initialRecipe, allTags = [], onAddTag, onDeleteTag }: RecipeFormProps) {
  const [data, setData] = useState<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>({
    title: initialRecipe?.title ?? '',
    image: initialRecipe?.image,
    type: initialRecipe?.type ?? 'plat',
    season: initialRecipe?.season ?? 'été',
    difficulty: initialRecipe?.difficulty ?? 'moyen',
    servings: initialRecipe?.servings ?? 4,
    prepTime: initialRecipe?.prepTime ?? 30,
    cookTime: initialRecipe?.cookTime ?? 30,
    rating: initialRecipe?.rating ?? 3,
    diets: initialRecipe?.diets ?? [],
    tags: initialRecipe?.tags ?? [],
    ingredients: initialRecipe?.ingredients?.length ? initialRecipe.ingredients : defaultIngredients(),
    steps: initialRecipe?.steps?.length ? initialRecipe.steps : [{ text: '' }],
    tested: initialRecipe?.tested ?? false,
  });
  const [newTag, setNewTag] = useState('');
  const imageRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => setData((d) => ({ ...d, [key]: value }));

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...data.ingredients];
    (updated[i] as any)[field] = value;
    set('ingredients', updated);
  };
  const addIngredient = () => set('ingredients', [...data.ingredients, { name: '', quantity: '', unit: '' }]);
  const removeIngredient = (i: number) => set('ingredients', data.ingredients.filter((_, idx) => idx !== i));

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

  const handleSubmit = () => {
    if (!data.title.trim()) return;
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
    <div className="animate-fade-in">
      {/* Sticky top bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-sm border-b border-border shadow-card px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-body transition-colors">
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="font-body gap-1.5" onClick={onBack}>
            <X size={14} /> Annuler
          </Button>
          <Button size="sm" className="gradient-warm text-primary-foreground font-body gap-1.5" onClick={handleSubmit}>
            <Save size={14} /> Enregistrer
          </Button>
        </div>
      </div>

      {/* Hero image area */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden mt-14">
        {data.image ? (
          <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          {data.image ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-card/80 backdrop-blur-sm rounded-full p-4 hover:bg-card transition-colors">
                  <Camera size={24} className="text-card-foreground" />
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
            <button className="bg-card/80 backdrop-blur-sm rounded-full p-4 hover:bg-card transition-colors" onClick={() => imageRef.current?.click()}>
              <Camera size={24} className="text-card-foreground" />
            </button>
          )}
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-20">
          <div className="flex items-center gap-2 mb-2">
            <Select value={data.type} onValueChange={(v) => set('type', v as RecipeType)}>
              <SelectTrigger className="w-auto h-7 text-xs capitalize font-body bg-primary text-primary-foreground border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t} value={t} className="capitalize font-body text-xs">{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={data.season} onValueChange={(v) => set('season', v as Season)}>
              <SelectTrigger className="w-auto h-7 text-xs capitalize font-body bg-card/80 backdrop-blur-sm border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => <SelectItem key={s} value={s} className="capitalize font-body text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <button
              onClick={() => set('tested', !data.tested)}
              className={`flex items-center gap-1 text-xs font-body px-2 py-1 rounded-full transition-colors cursor-pointer hover:opacity-80 ${
                data.tested ? 'bg-primary text-primary-foreground' : 'bg-card/80 backdrop-blur-sm text-card-foreground'
              }`}
            >
              {data.tested && <Check size={12} />} {data.tested ? 'Testé' : 'À tester'}
            </button>
          </div>
          <Input
            value={data.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Titre de la recette"
            autoFocus={!initialRecipe}
            className="font-display text-3xl md:text-4xl font-bold bg-transparent border-b border-primary-foreground/50 text-primary-foreground h-auto p-0 rounded-none focus-visible:ring-0 placeholder:text-primary-foreground/40"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Quick info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <EditInfoCard icon={melangeIcon} label="Préparation (min)" value={data.prepTime} onChange={(v) => set('prepTime', +v)} />
          <EditInfoCard icon={cuissonIcon} label="Cuisson (min)" value={data.cookTime} onChange={(v) => set('cookTime', +v)} />
          <EditInfoCard icon={servingsIcon} label="Portions" value={data.servings} onChange={(v) => set('servings', +v)} />
          <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
            <DifficultyBars level={difficultyLevels[data.difficulty].bars} />
            <Select value={data.difficulty} onValueChange={(v) => set('difficulty', v as Difficulty)}>
              <SelectTrigger className="h-7 text-xs capitalize font-body border-0 w-auto"><SelectValue /></SelectTrigger>
              <SelectContent>
                {difficulties.map((d) => <SelectItem key={d} value={d} className="capitalize font-body text-xs">{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-body">Difficulté</span>
          </div>
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

        {/* Tags */}
        <div className="space-y-2">
          <span className="font-body text-sm font-semibold text-foreground">Tags</span>
          <div className="flex flex-wrap gap-2">
            {combinedTags.map((tag) => (
              <div key={tag} className="flex items-center gap-0.5">
                <button
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-3 py-1 rounded-full font-body capitalize transition-colors ${
                    data.tags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-primary/20'
                  }`}
                >
                  {tag}
                </button>
                <button onClick={() => onDeleteTag?.(tag)} className="text-destructive/60 hover:text-destructive transition-colors p-0.5" title={`Supprimer le tag "${tag}" partout`}>
                  <X size={10} />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())} placeholder="Nouveau tag…" className="h-7 w-28 text-xs font-body" />
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={addNewTag}><Plus size={12} /></Button>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <span className="font-body text-sm font-semibold text-foreground">Régime</span>
            <div className="flex flex-wrap gap-3">
              {dietOptions.map((diet) => (
                <label key={diet} className="flex items-center gap-2 cursor-pointer font-body text-sm capitalize">
                  <Checkbox checked={data.diets.includes(diet)} onCheckedChange={() => toggleDiet(diet)} />
                  {diet}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_2fr] gap-8">
          {/* Ingredients */}
          <div className="bg-card rounded-lg p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold mb-4 text-card-foreground">Ingrédients</h2>
            <ul className="space-y-2">
              {data.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-2 items-center py-1.5 border-b border-border last:border-0">
                  <Input data-ingredient-name value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} onKeyDown={(e) => handleIngredientKeyDown(e, i)} placeholder="Nom de l'ingrédient" className="font-body text-sm flex-1 h-8" />
                  <Input value={String(ing.quantity)} onChange={(e) => updateIngredient(i, 'quantity', e.target.value)} onKeyDown={(e) => handleIngredientKeyDown(e, i)} placeholder="Qté" className="font-body text-sm w-16 h-8" />
                  <Input value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} onKeyDown={(e) => handleIngredientKeyDown(e, i)} placeholder="Unité" className="font-body text-sm w-20 h-8" />
                  {data.ingredients.length > 1 && (
                    <button onClick={() => removeIngredient(i)} className="text-destructive hover:text-destructive/80"><Trash2 size={14} /></button>
                  )}
                </li>
              ))}
            </ul>
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
                    <Textarea data-step-textarea value={step.text} onChange={(e) => updateStep(i, e.target.value)} onKeyDown={(e) => handleStepKeyDown(e, i)} placeholder={`Étape ${i + 1}`} className="font-body min-h-[50px] text-sm" />
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

function EditInfoCard({ icon, label, value, onChange }: { icon: string; label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
      <img src={icon} alt={label} className="w-8 h-8" />
      <Input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-16 text-center text-sm font-body font-semibold" />
      <span className="text-xs text-muted-foreground font-body">{label}</span>
    </div>
  );
}
