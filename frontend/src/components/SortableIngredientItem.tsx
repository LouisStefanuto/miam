import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Ingredient } from '@/data/recipes';
import { displayUnit } from '@/lib/units';
import { QuantityPicker } from './QuantityPicker';

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

  const qtyStr = ingredient.quantity == null ? '' : String(ingredient.quantity).trim();
  const unitStr = (ingredient.unit ?? '').trim();
  const hasQty = qtyStr !== '';
  const hasUnit = unitStr !== '';
  const isEmpty = !hasQty && !hasUnit;
  const display = isEmpty ? 'Quantité' : [qtyStr, displayUnit(unitStr, qtyStr)].filter(Boolean).join(' ');

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
      <QuantityPicker
        quantity={ingredient.quantity}
        unit={ingredient.unit}
        onConfirm={(qty, unit) => {
          onUpdate(index, 'quantity', qty);
          onUpdate(index, 'unit', unit);
        }}
        trigger={
          <button
            type="button"
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-body transition-colors min-w-[68px] text-center ${
              isEmpty
                ? 'border border-dashed border-border text-muted-foreground/60 hover:text-muted-foreground hover:border-muted-foreground/40'
                : 'bg-secondary text-foreground font-medium hover:bg-secondary/70'
            }`}
          >
            {display}
          </button>
        }
      />
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground active:scale-90 transition-colors"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </li>
  );
}
