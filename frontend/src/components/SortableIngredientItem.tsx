import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
      className="flex gap-2 items-center py-1.5 border-b border-border last:border-0"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <Input
        data-ingredient-name
        value={ingredient.name}
        onChange={(e) => onUpdate(index, 'name', e.target.value)}
        onKeyDown={(e) => onKeyDown(e, index)}
        placeholder="Nom de l'ingrédient"
        className="font-body text-sm flex-1 h-8"
      />
      <Input
        value={String(ingredient.quantity)}
        onChange={(e) => onUpdate(index, 'quantity', e.target.value)}
        onKeyDown={(e) => onKeyDown(e, index)}
        placeholder="Qté"
        className="font-body text-sm w-16 h-8"
      />
      <Input
        value={ingredient.unit}
        onChange={(e) => onUpdate(index, 'unit', e.target.value)}
        onKeyDown={(e) => onKeyDown(e, index)}
        placeholder="Unité"
        className="font-body text-sm w-20 h-8"
      />
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)} className="text-destructive hover:text-destructive/80">
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}
