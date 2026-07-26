import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface SortableCartIngredientItemProps {
  id: string;
  name: string;
  details: string;
  checked: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SortableCartIngredientItem({ id, name, details, checked, onToggle, onRemove }: SortableCartIngredientItemProps) {
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
      className={`flex items-center gap-3 py-0.5 font-body text-base group ${checked ? 'text-muted-foreground' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground md:text-muted-foreground/0 md:group-hover:text-muted-foreground hover:!text-foreground touch-none shrink-0 transition-colors p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={`w-6 h-6 shrink-0 rounded border-2 transition-colors flex items-center justify-center ${
          checked
            ? 'bg-muted-foreground border-muted-foreground text-background'
            : 'border-muted-foreground/30 hover:border-muted-foreground'
        }`}
      >
        {checked && (
          <svg width="14" height="14" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 5.5L4 7.5L8 3" />
          </svg>
        )}
      </button>
      <span className={`flex-1 min-w-0 ${checked ? 'line-through' : ''}`}>
        {details && <span>{details} </span>}
        {name}
      </span>
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 p-2 rounded-full text-muted-foreground md:text-muted-foreground/0 md:group-hover:text-muted-foreground hover:!text-destructive transition-colors"
        title="Retirer de la liste"
      >
        <X size={20} />
      </button>
    </li>
  );
}
