import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { UNIT_CATEGORIES, isCuratedUnit } from '@/lib/units';

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

  useEffect(() => {
    if (!open) return;
    setDraftQty(quantity == null || quantity === '' ? '' : String(quantity));
    setDraftUnit(unit ?? '');
    setCustomUnit(unit && !isCuratedUnit(unit) ? unit : '');
  }, [open, quantity, unit]);

  const customActive = customUnit !== '' && draftUnit === customUnit;

  const pickCurated = (value: string) => {
    onConfirm(draftQty.trim(), value);
    setOpen(false);
  };

  const onCustomChange = (value: string) => {
    setCustomUnit(value);
    setDraftUnit(value);
  };

  const handleConfirm = () => {
    onConfirm(draftQty.trim(), draftUnit.trim());
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="font-display">Quantité</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-5 max-h-[60vh] overflow-y-auto">
            <input
              type="text"
              inputMode="decimal"
              value={draftQty}
              onChange={(e) => setDraftQty(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full text-center font-body text-2xl font-semibold tabular-nums bg-secondary rounded-xl py-3 outline-none focus:bg-secondary/70 placeholder:text-muted-foreground/30 transition-colors"
            />

            {UNIT_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.units.map((u) => {
                    const active = draftUnit === u.value && !customActive;
                    return (
                      <button
                        key={u.value}
                        type="button"
                        onClick={() => pickCurated(u.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-body transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/70'
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
              <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personnalisé</p>
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
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => pickCurated('')}>
              Retirer l'unité
            </Button>
            <Button onClick={handleConfirm} className="flex-1">Confirmer</Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
