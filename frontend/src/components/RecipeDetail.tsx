import React, { useState, useMemo, useRef } from 'react';
import { ArrowLeft, Star, Pencil, Save, X, Plus, Trash2, Minus, Camera, Check, ImagePlus, ImageMinus } from 'lucide-react';
import { Recipe, Ingredient, Step, RecipeType, Season, Difficulty, Diet } from '@/data/recipes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
      <div
        key={i}
        className={`w-1.5 rounded-sm ${i <= level ? 'bg-primary' : 'bg-muted'}`}
        style={{ height: `${8 + i * 4}px` }}
      />
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

const difficultyLabels: Record<string, string> = {
  facile: 'Facile',
  moyen: 'Moyen',
  difficile: 'Difficile',
};

const types: RecipeType[] = ['apéro', 'entrée', 'plat', 'pâtes', 'dessert', 'boisson'];
const seasons: Season[] = ['printemps', 'été', 'automne', 'hiver'];
const difficulties: Difficulty[] = ['facile', 'moyen', 'difficile'];
const dietOptions: Diet[] = ['végétarien'];

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
}

export default function RecipeDetail({ recipe, onBack, onRatingChange, onSave, onTestedToggle, allTags, onAddTag, onDeleteTag, onDelete }: RecipeDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Recipe>(recipe);
  const [displayServings, setDisplayServings] = useState(recipe.servings);
  const [newTag, setNewTag] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const servingsRatio = displayServings / recipe.servings;

  const scaleQuantity = (qty: number | string) => {
    const num = typeof qty === 'string' ? parseFloat(qty) : qty;
    if (isNaN(num)) return qty;
    const scaled = Math.round(num * servingsRatio * 100) / 100;
    return scaled % 1 === 0 ? scaled : scaled.toFixed(1);
  };

  const startEdit = () => {
    setEditData({ ...recipe });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData(recipe);
  };

  const saveEdit = () => {
    onSave?.({ ...editData, updatedAt: new Date().toISOString().split('T')[0] });
    setEditing(false);
  };

  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...editData.ingredients];
    (updated[i] as any)[field] = value;
    setEditData({ ...editData, ingredients: updated });
  };

  const addIngredient = () => setEditData({ ...editData, ingredients: [...editData.ingredients, { name: '', quantity: '', unit: '' }] });
  const removeIngredient = (i: number) => setEditData({ ...editData, ingredients: editData.ingredients.filter((_, idx) => idx !== i) });

  const updateStep = (i: number, text: string) => {
    const updated = [...editData.steps];
    updated[i] = { text };
    setEditData({ ...editData, steps: updated });
  };
  const addStep = () => setEditData({ ...editData, steps: [...editData.steps, { text: '' }] });
  const removeStep = (i: number) => setEditData({ ...editData, steps: editData.steps.filter((_, idx) => idx !== i) });

  const toggleDiet = (diet: Diet) => {
    setEditData({
      ...editData,
      diets: editData.diets.includes(diet) ? editData.diets.filter((d) => d !== diet) : [...editData.diets, diet],
    });
  };

  const toggleTag = (tag: string) => {
    setEditData({
      ...editData,
      tags: editData.tags.includes(tag) ? editData.tags.filter((t) => t !== tag) : [...editData.tags, tag],
    });
  };

  const addNewTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !editData.tags.includes(tag)) {
      setEditData({ ...editData, tags: [...editData.tags, tag] });
      onAddTag?.(tag);
    }
    setNewTag('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditData({ ...editData, image: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const current = editing ? editData : recipe;

  return (
    <div className="animate-fade-in">
      {/* Sticky save/cancel bar when editing */}
      {editing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-card px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-body transition-colors">
            <ArrowLeft size={16} /> Menu
          </button>
          <div className="flex gap-2">
          <Button size="sm" variant="outline" className="font-body gap-1.5" onClick={cancelEdit}>
            <X size={14} /> Annuler
          </Button>
          <Button size="sm" className="gradient-warm text-primary-foreground font-body gap-1.5" onClick={saveEdit}>
            <Save size={14} /> Sauvegarder
          </Button>
          </div>
        </div>
      )}

      {/* Header image */}
      <div className={`relative h-[300px] md:h-[400px] overflow-hidden ${editing ? 'mt-14' : ''}`}>
        {current.image ? (
          <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        {!editing && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded-full p-2 hover:bg-card transition-colors"
          >
            <ArrowLeft size={20} className="text-card-foreground" />
          </button>
        )}
        {/* Action buttons top right */}
        <div className="absolute top-4 right-4 flex gap-2">
          {!editing && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm font-body text-destructive hover:bg-red-100 transition-colors">
                    <Trash2 size={14} /> Supprimer
                  </button>
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
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body" onClick={() => onDelete?.()}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <button className="flex items-center gap-1.5 bg-card/80 backdrop-blur-sm rounded-md px-3 py-1.5 text-sm font-body text-card-foreground hover:bg-card transition-colors" onClick={startEdit}>
                <Pencil size={14} /> Modifier
              </button>
            </>
          )}
        </div>
        {/* Image actions when editing */}
        {editing && (
          <>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <div className="absolute inset-0 flex items-center justify-center z-20">
              {editData.image ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="bg-card/80 backdrop-blur-sm rounded-full p-4 hover:bg-card transition-colors">
                      <Camera size={24} className="text-card-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="font-body gap-2" onClick={() => imageInputRef.current?.click()}>
                      <ImagePlus size={16} /> Modifier l'image
                    </DropdownMenuItem>
                    <DropdownMenuItem className="font-body gap-2 text-destructive focus:text-destructive" onClick={() => setEditData({ ...editData, image: undefined })}>
                      <ImageMinus size={16} /> Supprimer l'image
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button className="bg-card/80 backdrop-blur-sm rounded-full p-4 hover:bg-card transition-colors" onClick={() => imageInputRef.current?.click()}>
                  <Camera size={24} className="text-card-foreground" />
                </button>
              )}
            </div>
          </>
        )}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            {editing ? (
              <Select value={editData.type} onValueChange={(v) => setEditData({ ...editData, type: v as RecipeType })}>
                <SelectTrigger className="w-auto h-7 text-xs capitalize font-body bg-primary text-primary-foreground border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => <SelectItem key={t} value={t} className="capitalize font-body text-xs">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Badge className="bg-primary text-primary-foreground capitalize font-body">{current.type}</Badge>
            )}
            {editing ? (
              <Select value={editData.season} onValueChange={(v) => setEditData({ ...editData, season: v as Season })}>
                <SelectTrigger className="w-auto h-7 text-xs capitalize font-body bg-card/80 backdrop-blur-sm border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((s) => <SelectItem key={s} value={s} className="capitalize font-body text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <img src={seasonIcons[current.season]} alt={current.season} className="w-7 h-7 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur-sm object-cover grayscale" />
            )}
            {current.diets.includes('végétarien') && (
              <div className="w-7 h-7 rounded-full border-2 border-white/50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <img src={veganIcon} alt="Végétarien" className="w-5 h-5 object-contain" />
              </div>
            )}
            {/* Testé toggle - always interactive */}
            <button
              onClick={() => {
                if (editing) {
                  setEditData({ ...editData, tested: !editData.tested });
                } else {
                  onTestedToggle?.(!current.tested);
                }
              }}
              className={`flex items-center gap-1 text-xs font-body px-2 py-1 rounded-full transition-colors cursor-pointer hover:opacity-80 ${
                current.tested ? 'bg-primary text-primary-foreground' : 'bg-card/80 backdrop-blur-sm text-card-foreground'
              }`}
            >
              {current.tested && <Check size={12} />} {current.tested ? 'Testé' : 'À tester'}
            </button>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground drop-shadow-lg flex items-center gap-3 flex-wrap">
            {editing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="font-display text-3xl md:text-4xl font-bold bg-transparent border-b border-primary-foreground/50 text-primary-foreground h-auto p-0 rounded-none focus-visible:ring-0"
              />
            ) : (
              current.title
            )}
            {!editing && (
              <span className="flex gap-0.5" onMouseLeave={() => setHoveredStar(0)}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onRatingChange?.(i)}
                    onMouseEnter={() => setHoveredStar(i)}
                    className="cursor-pointer"
                  >
                    <Star
                      size={22}
                      className={
                        (hoveredStar > 0 ? i <= hoveredStar : i <= current.rating)
                          ? 'fill-primary text-primary drop-shadow-md'
                          : 'text-primary-foreground/40'
                      }
                    />
                  </button>
                ))}
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Quick info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {editing ? (
            <>
              <EditInfoCard icon={melangeIcon} label="Préparation (min)" value={editData.prepTime} onChange={(v) => setEditData({ ...editData, prepTime: +v })} />
              <EditInfoCard icon={cuissonIcon} label="Cuisson (min)" value={editData.cookTime} onChange={(v) => setEditData({ ...editData, cookTime: +v })} />
              <EditInfoCard icon={servingsIcon} label="Portions" value={editData.servings} onChange={(v) => setEditData({ ...editData, servings: +v })} />
              <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
                <DifficultyBars level={difficultyLevels[editData.difficulty].bars} />
                <Select value={editData.difficulty} onValueChange={(v) => setEditData({ ...editData, difficulty: v as Difficulty })}>
                  <SelectTrigger className="h-7 text-xs capitalize font-body border-0 w-auto"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => <SelectItem key={d} value={d} className="capitalize font-body text-xs">{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground font-body">Difficulté</span>
              </div>
            </>
          ) : (
            <>
              <InfoCard icon={melangeIcon} label="Préparation" value={`${current.prepTime} min`} />
              <InfoCard icon={cuissonIcon} label="Cuisson" value={`${current.cookTime} min`} />
              <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
                <img src={servingsIcon} alt="Portions" className="w-8 h-8" />
                <div className="flex items-center gap-2">
                  <button onClick={() => setDisplayServings(Math.max(1, displayServings - 1))} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-body font-semibold text-card-foreground min-w-[1.5rem] text-center">{displayServings}</span>
                  <button onClick={() => setDisplayServings(displayServings + 1)} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground font-body">Portions</span>
              </div>
              <InfoCard icon={<DifficultyBars level={difficultyLevels[current.difficulty].bars} />} label="Difficulté" value={difficultyLabels[current.difficulty]} />
            </>
          )}
        </div>

        {/* Rating in edit mode */}
        {editing && (
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold text-foreground">Note :</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" onClick={() => setEditData({ ...editData, rating: i })}>
                <Star size={20} className={i <= editData.rating ? 'fill-primary text-primary' : 'text-muted'} />
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        {editing ? (
          <div className="space-y-2">
            <span className="font-body text-sm font-semibold text-foreground">Tags</span>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...allTags, ...editData.tags])].map((tag) => (
                <div key={tag} className="flex items-center gap-0.5">
                  <button
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1 rounded-full font-body capitalize transition-colors ${
                      editData.tags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-primary/20'
                    }`}
                  >
                    {tag}
                  </button>
                  <button
                    onClick={() => onDeleteTag?.(tag)}
                    className="text-destructive/60 hover:text-destructive transition-colors p-0.5"
                    title={`Supprimer le tag "${tag}" partout`}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                  placeholder="Nouveau tag…"
                  className="h-7 w-28 text-xs font-body"
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={addNewTag}><Plus size={12} /></Button>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <span className="font-body text-sm font-semibold text-foreground">Régime</span>
              <div className="flex flex-wrap gap-3">
                {dietOptions.map((diet) => (
                  <label key={diet} className="flex items-center gap-2 cursor-pointer font-body text-sm capitalize">
                    <Checkbox checked={editData.diets.includes(diet)} onCheckedChange={() => toggleDiet(diet)} />
                    {diet}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ) : (
          current.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {current.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-body capitalize">{tag}</Badge>
              ))}
            </div>
          )
        )}

        <div className="grid md:grid-cols-[1fr_2fr] gap-8">
          {/* Ingredients */}
          <div className="bg-card rounded-lg p-6 shadow-card">
            <h2 className="font-display text-xl font-semibold mb-4 text-card-foreground">Ingrédients</h2>
            <ul className="space-y-2">
              {(editing ? editData.ingredients : current.ingredients).map((ing, i) => (
                <li key={i} className="flex justify-between items-center py-1.5 border-b border-border last:border-0 font-body text-sm">
                  {editing ? (
                    <div className="flex gap-2 items-center w-full">
                      <Input value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} placeholder="Nom de l'ingrédient" className="font-body text-sm flex-1 h-8" />
                      <Input value={String(ing.quantity)} onChange={(e) => updateIngredient(i, 'quantity', e.target.value)} placeholder="Qté" className="font-body text-sm w-16 h-8" />
                      <Input value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} placeholder="Unité" className="font-body text-sm w-20 h-8" />
                      <button onClick={() => removeIngredient(i)} className="text-destructive hover:text-destructive/80"><Trash2 size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-card-foreground">{ing.name}</span>
                      <span className="text-muted-foreground whitespace-nowrap ml-3">
                        {scaleQuantity(ing.quantity)} {ing.unit}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {editing && (
              <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="font-body gap-1 mt-3 w-full">
                <Plus size={14} /> Ajouter
              </Button>
            )}
          </div>

          {/* Steps */}
          <div>
            <h2 className="font-display text-xl font-semibold mb-4 text-foreground">Préparation</h2>
            <ol className="space-y-4">
              {(editing ? editData.steps : current.steps).map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full gradient-warm flex items-center justify-center text-primary-foreground font-body font-bold text-sm">
                    {i + 1}
                  </span>
                  {editing ? (
                    <div className="flex gap-2 items-start flex-1">
                      <Textarea value={step.text} onChange={(e) => updateStep(i, e.target.value)} className="font-body min-h-[50px] text-sm" />
                      <button onClick={() => removeStep(i)} className="text-destructive hover:text-destructive/80 mt-2"><Trash2 size={14} /></button>
                    </div>
                  ) : (
                    <p className="font-body text-foreground pt-1 leading-relaxed">{step.text}</p>
                  )}
                </li>
              ))}
            </ol>
            {editing && (
              <Button type="button" variant="outline" size="sm" onClick={addStep} className="font-body gap-1 mt-4">
                <Plus size={14} /> Ajouter une étape
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string | React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
      {typeof icon === 'string' ? <img src={icon} alt={label} className="w-8 h-8" /> : <div className="w-8 h-8 flex items-center justify-center">{icon}</div>}
      <span className="text-sm font-body font-semibold text-card-foreground">{value}</span>
      <span className="text-xs text-muted-foreground font-body">{label}</span>
    </div>
  );
}

function EditInfoCard({ icon, label, value, onChange }: { icon: string; label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-card flex flex-col items-center gap-1">
      <img src={icon} alt={label} className="w-8 h-8" />
      <Input type="number" min={0} value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-16 text-center text-sm font-body font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
      <span className="text-xs text-muted-foreground font-body">{label}</span>
    </div>
  );
}
