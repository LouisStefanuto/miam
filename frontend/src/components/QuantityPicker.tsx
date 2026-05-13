import { useEffect, useRef, useState } from 'react';
import { Delete } from 'lucide-react';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { UNIT_CATEGORIES, displayUnit, isCuratedUnit } from '@/lib/units';
import { useIsMobile } from '@/hooks/use-mobile';

const KEYPAD_KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '.', '0', 'backspace',
] as const;

interface QuantityPickerProps {
  quantity: number | string;
  unit: string;
  onConfirm: (quantity: string, unit: string) => void;
  trigger: React.ReactNode;
}

export function QuantityPicker({ quantity, unit, onConfirm, trigger }: QuantityPickerProps) {
  const [open, setOpen] = useState(false);
  const [draftQty, setDraftQty] = useState('');
  const [draftUnit, setDraftUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const isMobile = useIsMobile();
  const qtyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraftQty(quantity == null || quantity === '' ? '' : String(quantity));
    setDraftUnit(unit ?? '');
    setCustomUnit(unit && !isCuratedUnit(unit) ? unit : '');
  }, [open, quantity, unit]);

  useEffect(() => {
    if (!open || isMobile) return;
    const id = window.setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 30);
    return () => window.clearTimeout(id);
  }, [open, isMobile]);

  const customActive = customUnit !== '' && draftUnit === customUnit;

  const pickCurated = (value: string) => {
    if (draftUnit === value && customUnit === '') {
      setDraftUnit('');
      return;
    }
    setDraftUnit(value);
    setCustomUnit('');
  };

  const onCustomChange = (value: string) => {
    setCustomUnit(value);
    setDraftUnit(value);
  };

  const handleConfirm = () => {
    onConfirm(draftQty.trim(), draftUnit.trim());
    setOpen(false);
  };

  const confirmWith = (nextUnit: string) => {
    onConfirm(draftQty.trim(), nextUnit.trim());
    setOpen(false);
  };

  const handleKey = (key: typeof KEYPAD_KEYS[number]) => {
    if (key === 'backspace') {
      setDraftQty((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.') {
      if (draftQty.includes('.')) return;
      setDraftQty((prev) => (prev === '' ? '0.' : prev + '.'));
      return;
    }
    setDraftQty((prev) => prev + key);
  };

  const onQtyInputChange = (raw: string) => {
    let v = raw.replace(',', '.').replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    }
    setDraftQty(v);
  };

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={6}
          className="w-[400px] p-3"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex flex-col gap-2.5">
            <label className="grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 bg-secondary rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/30 cursor-text">
              <div />
              <span className="relative inline-block">
                <span className="invisible whitespace-pre text-2xl font-body font-bold tabular-nums">
                  {draftQty ? draftQty.replace('.', ',') : '0'}
                </span>
                <input
                  ref={qtyInputRef}
                  type="text"
                  inputMode="decimal"
                  value={draftQty.replace('.', ',')}
                  onChange={(e) => onQtyInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                  placeholder="0"
                  className="absolute inset-0 w-full bg-transparent text-2xl font-body font-bold tabular-nums text-center outline-none placeholder:text-muted-foreground/30"
                />
              </span>
              <span className="justify-self-start pl-1 text-base font-body font-medium text-muted-foreground tabular-nums">
                {draftUnit ? displayUnit(draftUnit, draftQty) : ''}
              </span>
            </label>

            <div className="flex flex-col gap-1">
              {UNIT_CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider w-14 shrink-0">
                    {cat.label}
                  </span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {cat.units.map((u) => {
                      const active = draftUnit === u.value && !customActive;
                      return (
                        <button
                          key={u.value}
                          type="button"
                          onClick={() => confirmWith(u.value)}
                          className={`px-2 py-0.5 rounded-md text-xs font-body font-medium transition-colors ${
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-foreground hover:bg-secondary/70'
                          }`}
                        >
                          {u.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider w-14 shrink-0">
                  Autre
                </span>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => onCustomChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirm();
                    }
                  }}
                  placeholder="unité personnalisée…"
                  maxLength={20}
                  className={`flex-1 min-w-0 px-2 py-0.5 rounded-md bg-secondary text-xs font-body outline-none transition-shadow ${
                    customActive ? 'ring-2 ring-primary' : 'focus:ring-2 focus:ring-primary/30'
                  }`}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="h-[97dvh] mt-[3dvh]">
        <div className="mx-auto w-full max-w-md flex-1 flex flex-col min-h-0">
          <DrawerHeader className="py-2">
            <DrawerTitle className="font-display">Quantité</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0 flex flex-col gap-3">
            <div className="shrink-0 w-full grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 px-4 font-body bg-secondary rounded-xl py-4 select-none">
              <div />
              <span className="text-3xl font-bold tabular-nums">
                {draftQty ? draftQty.replace('.', ',') : <span className="text-muted-foreground/30">0</span>}
              </span>
              <span className="justify-self-start text-lg font-medium text-muted-foreground">
                {draftUnit ? displayUnit(draftUnit, draftQty) : ''}
              </span>
            </div>

            <div className="flex-1 min-h-[160px] grid grid-cols-3 grid-rows-4 gap-1.5">
              {KEYPAD_KEYS.map((key) => {
                const isBackspace = key === 'backspace';
                const label = isBackspace ? <Delete size={16} /> : key === '.' ? ',' : key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKey(key)}
                    className={`rounded-lg text-base font-body font-medium tabular-nums transition-colors flex items-center justify-center select-none ${
                      isBackspace
                        ? 'bg-muted text-muted-foreground border border-border/40 hover:bg-muted/70 active:bg-muted/60'
                        : 'bg-card text-foreground border border-border/60 shadow-sm hover:bg-secondary/40 active:bg-secondary/60'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {UNIT_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.units.map((u) => {
                    const active = draftUnit === u.value && !customActive;
                    return (
                      <button
                        key={u.value}
                        type="button"
                        onClick={() => pickCurated(u.value)}
                        className={`px-3.5 py-2 rounded-full text-sm font-body font-medium transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground hover:bg-secondary/70'
                        }`}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1">Personnalisé</p>
              <input
                type="text"
                value={customUnit}
                onChange={(e) => onCustomChange(e.target.value)}
                placeholder="Saisissez une unité…"
                className={`w-full px-3 py-2 rounded-lg bg-secondary text-sm font-body outline-none transition-shadow ${
                  customActive ? 'ring-2 ring-primary' : 'focus:ring-2 focus:ring-primary/30'
                }`}
              />
            </div>
          </div>
          <DrawerFooter className="p-3">
            <Button onClick={handleConfirm} className="w-full">Confirmer</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
