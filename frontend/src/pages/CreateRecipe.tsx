import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createRecipe, type RecipeCreate } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

const CreateRecipe = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState<string>("");
  const [cookTime, setCookTime] = useState<string>("");
  const [restTime, setRestTime] = useState<string>("");
  const [category, setCategory] = useState("plat");
  const [season, setSeason] = useState<string>("");
  const [isVeggie, setIsVeggie] = useState(false);
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string; unit: string }[]>([
    { name: "", quantity: "", unit: "" },
  ]);
  const [sources, setSources] = useState<{ type: string; raw_content: string }[]>([]);

  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: (data) => {
      toast({ title: "Recette créée !" });
      navigate(`/recipe/${data.id}`);
    },
    onError: () => {
      toast({ title: "Erreur", description: "La création a échoué.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: RecipeCreate = {
      title,
      description,
      prep_time_minutes: prepTime ? parseInt(prepTime) : null,
      cook_time_minutes: cookTime ? parseInt(cookTime) : null,
      rest_time_minutes: restTime ? parseInt(restTime) : null,
      category,
      season: season || null,
      is_veggie: isVeggie,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name,
          quantity: i.quantity ? parseFloat(i.quantity) : null,
          unit: i.unit || null,
        })),
      images: [],
      sources: sources.filter((s) => s.raw_content.trim()),
    };
    mutation.mutate(payload);
  };

  const addIngredient = () => setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[i] = { ...updated[i], [field]: value };
    setIngredients(updated);
  };

  const addSource = () => setSources([...sources, { type: "manual", raw_content: "" }]);
  const removeSource = (i: number) => setSources(sources.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Nouvelle recette</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
          </div>

          {/* Times */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Préparation (min)</Label>
              <Input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Cuisson (min)</Label>
              <Input type="number" value={cookTime} onChange={(e) => setCookTime(e.target.value)} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Repos (min)</Label>
              <Input type="number" value={restTime} onChange={(e) => setRestTime(e.target.value)} min={0} />
            </div>
          </div>

          {/* Category + Season + Veggie */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apero">Apéro</SelectItem>
                  <SelectItem value="entree">Entrée</SelectItem>
                  <SelectItem value="plat">Plat</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Saison</Label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger><SelectValue placeholder="Aucune" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="winter">Hiver</SelectItem>
                  <SelectItem value="spring">Printemps</SelectItem>
                  <SelectItem value="summer">Été</SelectItem>
                  <SelectItem value="autumn">Automne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="veggie" checked={isVeggie} onCheckedChange={(v) => setIsVeggie(v === true)} />
            <Label htmlFor="veggie" className="cursor-pointer">Recette végétarienne</Label>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ingrédients</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="h-3 w-3 mr-1" />Ajouter
              </Button>
            </div>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Nom" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} className="flex-1" />
                <Input placeholder="Qté" value={ing.quantity} onChange={(e) => updateIngredient(i, "quantity", e.target.value)} className="w-20" type="number" step="any" />
                <Input placeholder="Unité" value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)} className="w-24" />
                {ingredients.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredient(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Sources */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sources</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSource}>
                <Plus className="h-3 w-3 mr-1" />Ajouter
              </Button>
            </div>
            {sources.map((src, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={src.type} onValueChange={(v) => {
                  const updated = [...sources];
                  updated[i] = { ...updated[i], type: v };
                  setSources(updated);
                }}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manuel</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="photo">Photo</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Contenu" value={src.raw_content} onChange={(e) => {
                  const updated = [...sources];
                  updated[i] = { ...updated[i], raw_content: e.target.value };
                  setSources(updated);
                }} className="flex-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSource(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Création..." : "Créer la recette"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipe;
