import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface SortableCartIngredientItemProps {
  id: string;
  name: string;
  details: string;
  onRemove: (id: string) => void;
}

export function SortableCartIngredientItem({ id, name, details, onRemove }: SortableCartIngredientItemProps) {
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
      className="flex items-center gap-2 font-body text-sm group"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-foreground touch-none shrink-0 transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <span className="w-4 h-4 shrink-0 rounded border border-muted-foreground/30" />
      <span className="flex-1 min-w-0">
        {details && <span className="font-medium">{details} </span>}
        {name}
      </span>
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 p-1 rounded-full text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-colors"
        title="Retirer de la liste"
      >
        <X size={14} />
      </button>
    </li>
  );
}
