import { Clock, Flame, Star, Users, Check } from 'lucide-react';
import { Recipe } from '@/data/recipes';
import { Badge } from '@/components/ui/badge';
import seasonSpring from '@/assets/icons/season-spring.png';
import seasonSummer from '@/assets/icons/season-summer.png';
import seasonFall from '@/assets/icons/season-fall.png';
import seasonWinter from '@/assets/icons/season-winter.png';
import veganIcon from '@/assets/icons/vegetalien.png';

const seasonIcons: Record<string, string> = {
  printemps: seasonSpring,
  été: seasonSummer,
  automne: seasonFall,
  hiver: seasonWinter,
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
      className="group text-left w-full h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
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
            <Flame className="text-muted-foreground" size={40} />
          </div>
        )}
        {/* Season + végé badges top right */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          {isVegetarian && (
            <div className="w-8 h-8 rounded-full border-2 border-white/50 bg-white/80 backdrop-blur-sm flex items-center justify-center drop-shadow-md">
              <img src={veganIcon} alt="Végétarien" className="w-5 h-5 object-contain" />
            </div>
          )}
          <img src={seasonIcons[recipe.season]} alt={recipe.season} className="w-8 h-8 rounded-full border-2 border-white/50 bg-white/80 backdrop-blur-sm object-cover drop-shadow-md grayscale" />
        </div>
        {/* Type badge */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-card-foreground font-body text-xs capitalize">
            {recipe.type}
          </Badge>
          {!recipe.tested && (
            <Badge variant="outline" className="bg-card/90 backdrop-blur-sm text-muted-foreground font-body text-xs border-muted-foreground/30">
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

        <div className="flex items-center gap-3 text-xs text-muted-foreground font-body mt-2">
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {totalTime} min
          </span>
          <span className="flex items-center gap-1">
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
