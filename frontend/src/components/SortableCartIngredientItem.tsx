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
      className={`flex items-center gap-2 font-body text-sm group ${checked ? 'text-muted-foreground' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground md:text-muted-foreground/0 md:group-hover:text-muted-foreground hover:!text-foreground touch-none shrink-0 transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={`w-4 h-4 shrink-0 rounded border transition-colors flex items-center justify-center ${
          checked
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        className="shrink-0 p-1 rounded-full text-muted-foreground md:text-muted-foreground/0 md:group-hover:text-muted-foreground hover:!text-destructive transition-colors"
        title="Retirer de la liste"
      >
        <X size={14} />
      </button>
    </li>
  );
}
