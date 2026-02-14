import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Flame, Leaf } from "lucide-react";
import type { Recipe } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { Link } from "react-router-dom";

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

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalTime =
    (recipe.prep_time_minutes ?? 0) +
    (recipe.cook_time_minutes ?? 0) +
    (recipe.rest_time_minutes ?? 0);

  const firstImage = recipe.images?.[0];

  return (
    <Link to={`/recipe/${recipe.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer group h-full">
        {firstImage ? (
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={getImageUrl(firstImage.id)}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-muted flex items-center justify-center">
            <Flame className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <CardContent className="p-4 space-y-3">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2 font-serif">
            {recipe.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default" className="text-xs">
              {categoryLabels[recipe.category] ?? recipe.category}
            </Badge>
            {recipe.season && (
              <Badge variant="outline" className="text-xs border-secondary text-secondary">
                {seasonLabels[recipe.season] ?? recipe.season}
              </Badge>
            )}
            {recipe.is_veggie && (
              <Badge className="text-xs bg-secondary text-secondary-foreground">
                <Leaf className="h-3 w-3 mr-1" />
                Veggie
              </Badge>
            )}
          </div>
          {totalTime > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalTime} min</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
