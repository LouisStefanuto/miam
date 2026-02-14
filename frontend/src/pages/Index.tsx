import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchRecipes } from "@/lib/api";
import { RecipeCard } from "@/components/RecipeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Plus, FileDown, Search, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportMarkdown, exportWord } from "@/lib/api";

const Index = () => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [season, setSeason] = useState<string>("");
  const [isVeggie, setIsVeggie] = useState(false);
  const { toast } = useToast();

  const { data: recipes = [], isLoading, error } = useQuery({
    queryKey: ["recipes", title, category, season, isVeggie],
    queryFn: () =>
      searchRecipes({
        title: title || undefined,
        category: category || undefined,
        season: season || undefined,
        is_veggie: isVeggie || undefined,
      }),
  });

  const handleExport = async (type: "markdown" | "word") => {
    try {
      const blob = type === "markdown" ? await exportMarkdown() : await exportWord();
      const ext = type === "markdown" ? "md" : "docx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recettes.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export réussi", description: `Fichier .${ext} téléchargé.` });
    } catch {
      toast({ title: "Erreur", description: "L'export a échoué.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Livre Recettes</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("markdown")}>
              <FileDown className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Markdown</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("word")}>
              <FileDown className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Word</span>
            </Button>
            <Button asChild>
              <Link to="/create">
                <Plus className="h-4 w-4 mr-1" />
                Nouvelle recette
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-end gap-3 mb-8">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une recette..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="apero">Apéro</SelectItem>
              <SelectItem value="entree">Entrée</SelectItem>
              <SelectItem value="plat">Plat</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Saison" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="winter">Hiver</SelectItem>
              <SelectItem value="spring">Printemps</SelectItem>
              <SelectItem value="summer">Été</SelectItem>
              <SelectItem value="autumn">Automne</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 h-10">
            <Checkbox
              id="veggie"
              checked={isVeggie}
              onCheckedChange={(v) => setIsVeggie(v === true)}
            />
            <Label htmlFor="veggie" className="text-sm cursor-pointer">
              Veggie
            </Label>
          </div>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="text-center py-20 text-muted-foreground">Chargement...</div>
        )}
        {error && (
          <div className="text-center py-20 text-destructive">
            Impossible de charger les recettes. Vérifiez que l'API est accessible.
          </div>
        )}
        {!isLoading && !error && recipes.length === 0 && (
          <div className="text-center py-20">
            <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">Aucune recette trouvée</p>
            <Button asChild className="mt-4">
              <Link to="/create">Créer ma première recette</Link>
            </Button>
          </div>
        )}
        {!isLoading && !error && recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
