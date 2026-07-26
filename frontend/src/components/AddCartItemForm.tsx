import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Centered call to action of the empty cart: switches the cart over to the shopping list. */
export function StartManualListButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} className="font-body gap-2">
      <Plus size={18} className="shrink-0" />
      Commencer une liste à la main
    </Button>
  );
}

interface AddCartItemFormProps {
  onAdd: (name: string) => void;
  /** Focus the field as soon as the row appears. */
  autoFocusInput?: boolean;
  /** Called when the field is left empty. */
  onCancel?: () => void;
}

/**
 * Blank row at the bottom of the shopping list, laid out like the items above it.
 * Enter adds the item and keeps the row ready for the next one.
 */
export function AddCartItemForm({ onAdd, autoFocusInput = false, onCancel }: AddCartItemFormProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);

  /** Adds the typed item, if any. Returns false when the field was blank. */
  const commit = () => {
    const name = value.trim();
    if (!name) return false;
    onAdd(name);
    setValue('');
    return true;
  };

  return (
    <li className="flex items-center gap-3 py-0.5 font-body text-base">
      {/* Empty slot matching the drag handle of the items above */}
      <span className="shrink-0 p-1" aria-hidden="true">
        <span className="block w-5 h-5" />
      </span>
      <span
        className="w-6 h-6 shrink-0 rounded border-2 border-dashed border-muted-foreground/30"
        aria-hidden="true"
      />
      <form
        className="flex-1 min-w-0"
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <input
          ref={inputRef}
          autoFocus={autoFocusInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              skipCommitRef.current = true;
              setValue('');
              inputRef.current?.blur();
            }
          }}
          onBlur={() => {
            const cancelled = skipCommitRef.current;
            skipCommitRef.current = false;
            if (cancelled || !commit()) onCancel?.();
          }}
          placeholder="Ajouter un article"
          enterKeyHint="done"
          className="w-full bg-transparent border-0 p-0 outline-none placeholder:text-muted-foreground/60"
          aria-label="Ajouter un article à la liste"
        />
      </form>
    </li>
  );
}
