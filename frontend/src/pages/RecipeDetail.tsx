import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRecipe, getImageUrl } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ChefHat, Timer, Leaf } from "lucide-react";

const categoryLabels: Record<string, string> = {
  apero: "Apéro",
  entree: "Entrée",
  plat: "Plat",
  dessert: "Dessert",
};

const seasonLabels: Record<string, string> = {
  winter: "Hiver",
  spring: "Printemps",
  summer: "Été",
  autumn: "Automne",
};

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Recette introuvable.</p>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Retour aux recettes</Link>
        </Button>

        {/* Images */}
        {recipe.images.length > 0 && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={getImageUrl(recipe.images[0].id)}
              alt={recipe.title}
              className="w-full max-h-[400px] object-cover"
            />
          </div>
        )}

        {/* Title + badges */}
        <h1 className="text-4xl font-bold mb-4">{recipe.title}</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="default">{categoryLabels[recipe.category] ?? recipe.category}</Badge>
          {recipe.season && (
            <Badge variant="outline" className="border-secondary text-secondary">
              {seasonLabels[recipe.season] ?? recipe.season}
            </Badge>
          )}
          {recipe.is_veggie && (
            <Badge className="bg-secondary text-secondary-foreground">
              <Leaf className="h-3 w-3 mr-1" />Veggie
            </Badge>
          )}
        </div>

        {/* Times */}
        <div className="flex flex-wrap gap-6 mb-8 text-sm">
          {recipe.prep_time_minutes != null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>Préparation : {recipe.prep_time_minutes} min</span>
            </div>
          )}
          {recipe.cook_time_minutes != null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChefHat className="h-4 w-4 text-primary" />
              <span>Cuisson : {recipe.cook_time_minutes} min</span>
            </div>
          )}
          {recipe.rest_time_minutes != null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4 text-primary" />
              <span>Repos : {recipe.rest_time_minutes} min</span>
            </div>
          )}
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-3">Description</h2>
          <p className="text-foreground/80 whitespace-pre-line leading-relaxed">{recipe.description}</p>
        </section>

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-3">Ingrédients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    {ing.quantity != null && <strong>{ing.quantity}</strong>}
                    {ing.unit && ` ${ing.unit}`}
                    {ing.quantity != null && " — "}
                    {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sources */}
        {recipe.sources.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-3">Sources</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {recipe.sources.map((src, i) => (
                <li key={i}>
                  <span className="font-medium capitalize">{src.type}</span> : {src.raw_content}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default RecipeDetail;
