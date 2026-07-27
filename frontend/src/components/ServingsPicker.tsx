import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const PRESETS = [2, 4, 6, 8];
const MAX_SERVINGS = 99;

interface ServingsPickerProps {
  servings: number;
  onChange: (servings: number) => void;
  /** Recipe name, shown as the picker's subtitle. */
  label?: string;
  trigger: React.ReactNode;
}

/** Picks a number of servings with touch-sized controls: a drawer on mobile, a popover on desktop. */
export function ServingsPicker({ servings, onChange, label, trigger }: ServingsPickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const step = (delta: number) => onChange(Math.min(MAX_SERVINGS, Math.max(1, servings + delta)));

  const controls = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Moins de personnes"
          disabled={servings <= 1}
          onClick={() => step(-1)}
          className="w-12 h-12 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70 active:bg-secondary/60 disabled:opacity-40 transition-colors"
        >
          <Minus size={20} />
        </button>
        <div className="flex flex-col items-center min-w-[4.5rem]">
          <span className="font-display text-4xl font-bold tabular-nums leading-none">{servings}</span>
          <span className="font-body text-sm text-muted-foreground mt-1">
            {servings > 1 ? 'personnes' : 'personne'}
          </span>
        </div>
        <button
          type="button"
          aria-label="Plus de personnes"
          disabled={servings >= MAX_SERVINGS}
          onClick={() => step(1)}
          className="w-12 h-12 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/70 active:bg-secondary/60 disabled:opacity-40 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex justify-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              onChange(preset);
              setOpen(false);
            }}
            className={`min-w-[3rem] h-11 px-3 rounded-full font-body text-base font-medium tabular-nums transition-colors ${
              servings === preset
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/70'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="center" sideOffset={6} className="w-auto p-4">
          {controls}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="font-display">Nombre de personnes</DrawerTitle>
            {label && <p className="font-body text-sm text-muted-foreground truncate">{label}</p>}
          </DrawerHeader>
          <div className="px-4 pb-2">{controls}</div>
          <DrawerFooter>
            <Button onClick={() => setOpen(false)} className="w-full font-body">
              Terminé
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
