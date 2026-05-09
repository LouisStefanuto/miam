import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { Step } from '@/data/recipes';

interface SortableStepItemProps {
  id: string;
  step: Step;
  index: number;
  onUpdate: (index: number, text: string) => void;
  onRemove: (index: number) => void;
  onKeyDown: (e: React.KeyboardEvent, index: number) => void;
  canRemove: boolean;
}

export function SortableStepItem({
  id,
  step,
  index,
  onUpdate,
  onRemove,
  onKeyDown,
  canRemove,
}: SortableStepItemProps) {
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
    <li ref={setNodeRef} style={style} className="group relative">
      <div className="flex items-start gap-3 bg-card rounded-xl p-4 shadow-card border border-border/60">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground touch-none shrink-0 mt-0.5"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <span className="flex-shrink-0 w-7 h-7 rounded-full gradient-warm flex items-center justify-center text-primary-foreground font-body font-bold text-xs leading-none">
          {index + 1}
        </span>
        <textarea
          data-step-textarea
          value={step.text}
          onChange={(e) => onUpdate(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, index)}
          placeholder={`Décrivez l'étape ${index + 1}…`}
          className="flex-1 bg-transparent font-body text-base leading-7 outline-none resize-none placeholder:text-muted-foreground/40 min-h-[1.75rem] [field-sizing:content]"
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
      </div>
    </li>
  );
}
