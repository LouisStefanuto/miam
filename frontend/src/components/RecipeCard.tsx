import { Clock, Star, Users, Sun, Snowflake, Flower, LeafyGreen, Vegan } from 'lucide-react';
import beaverIcon from '/icon.png';
import { Recipe } from '@/data/recipes';
import { Badge } from '@/components/ui/badge';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const seasonIcons: Record<string, any> = {
  printemps: Flower,
  été: Sun,
  automne: LeafyGreen,
  hiver: Snowflake,
};

const difficultyLabels: Record<string, { label: string; bars: number }> = {
  facile: { label: 'Facile', bars: 1 },
  moyen: { label: 'Moyen', bars: 2 },
  difficile: { label: 'Difficile', bars: 3 },
};

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const DifficultyBars = ({ level }: { level: number }) => (
  <div className="flex gap-0.5 items-end">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className={`w-1 rounded-sm ${i <= level ? 'bg-primary' : 'bg-muted'}`}
        style={{ height: `${8 + i * 4}px` }}
      />
    ))}
  </div>
);

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={14}
        className={i <= rating ? 'fill-primary text-primary' : 'text-muted'}
      />
    ))}
  </div>
);

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;
  const diff = difficultyLabels[recipe.difficulty];
  const isVegetarian = recipe.diets.includes('végétarien');

  return (
    <button
      onClick={onClick}
      className="group text-left w-full h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-[box-shadow,transform] duration-300 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <img src={beaverIcon} alt="Pas d'image" className="w-10 h-10 opacity-50 grayscale" />
          </div>
        )}
        {/* Season + végé badges top right */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {isVegetarian && (
            <div className="w-8 h-8 rounded-full border-2 border-card/95 bg-card/95 flex items-center justify-center shadow-sm">
              <Vegan size={16} className="text-green-600" />
            </div>
          )}
          {(() => { const SeasonIcon = seasonIcons[recipe.season]; return SeasonIcon ? <div className="w-8 h-8 rounded-full border-2 border-card/95 bg-card/95 flex items-center justify-center shadow-sm"><SeasonIcon size={16} className="text-gray-600 dark:text-gray-300" /></div> : null; })()}
        </div>
        {/* Type badge */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-card/95 text-card-foreground font-body text-xs capitalize">
            {recipe.type}
          </Badge>
          {!recipe.tested && (
            <Badge variant="outline" className="bg-card/95 text-muted-foreground font-body text-xs border-muted-foreground/30">
              À tester
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-lg font-semibold text-card-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>

        <div className="mt-2">
          <StarRating rating={recipe.rating} />
        </div>

        <div className="flex items-end gap-3 text-xs text-muted-foreground font-body mt-2">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {totalTime} min
          </span>
          <span className="flex items-end gap-1">
            <DifficultyBars level={diff.bars} />
            {diff.label}
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} />
            {recipe.servings}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 pt-1 mt-auto min-h-[24px]">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-body">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
