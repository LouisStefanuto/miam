import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Minus } from 'lucide-react';
import { Ingredient } from '@/data/recipes';

interface SortableIngredientItemProps {
  id: string;
  ingredient: Ingredient;
  index: number;
  onUpdate: (index: number, field: keyof Ingredient, value: string) => void;
  onRemove: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  canRemove: boolean;
}

export function SortableIngredientItem({
  id,
  ingredient,
  index,
  onUpdate,
  onRemove,
  onKeyDown,
  canRemove,
}: SortableIngredientItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 bg-card border border-border/60 rounded-xl px-3 py-2.5"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <input
        data-ingredient-name
        value={ingredient.name}
        onChange={(e) => {
          const v = e.target.value;
          onUpdate(index, 'name', v.charAt(0).toUpperCase() + v.slice(1));
        }}
        onKeyDown={(e) => onKeyDown(e, index)}
        placeholder="Ingrédient"
        className="flex-1 min-w-0 bg-transparent text-base font-body outline-none placeholder:text-muted-foreground/40"
      />
      <div className="flex items-center gap-1 shrink-0">
        <input
          value={String(ingredient.quantity)}
          onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index)}
          placeholder="Qté"
          className="w-14 text-center bg-secondary text-base font-body font-medium rounded-lg py-1.5 outline-none placeholder:text-muted-foreground/40 border border-transparent focus:border-primary/30"
        />
        <input
          value={ingredient.unit}
          onChange={(e) => onUpdate(index, 'unit', e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index)}
          placeholder="Unité"
          className="w-16 text-center bg-secondary text-base font-body rounded-lg py-1.5 outline-none placeholder:text-muted-foreground/40 border border-transparent focus:border-primary/30"
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-90 transition-colors"
        >
          <Minus size={12} strokeWidth={2.5} />
        </button>
      )}
    </li>
  );
}
