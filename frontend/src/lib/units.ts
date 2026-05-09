export interface UnitOption {
  value: string;
  label: string;
}

export interface UnitCategory {
  id: string;
  label: string;
  units: UnitOption[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'weight',
    label: 'Poids',
    units: [
      { value: 'g', label: 'g' },
      { value: 'kg', label: 'kg' },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    units: [
      { value: 'mL', label: 'mL' },
      { value: 'cL', label: 'cL' },
      { value: 'L', label: 'L' },
      { value: 'c. à s.', label: 'c. à s.' },
      { value: 'c. à c.', label: 'c. à c.' },
      { value: 'tasse', label: 'tasse' },
    ],
  },
  {
    id: 'count',
    label: 'Quantité',
    units: [
      { value: 'pièce', label: 'pièce' },
      { value: 'tranche', label: 'tranche' },
      { value: 'gousse', label: 'gousse' },
      { value: 'botte', label: 'botte' },
    ],
  },
  {
    id: 'eyeball',
    label: "À l'œil",
    units: [
      { value: 'pincée', label: 'pincée' },
      { value: 'goutte', label: 'goutte' },
      { value: 'poignée', label: 'poignée' },
      { value: 'à goût', label: 'à goût' },
    ],
  },
];

const CURATED_UNIT_VALUES = new Set(
  UNIT_CATEGORIES.flatMap((cat) => cat.units.map((u) => u.value)),
);

const PLURALIZABLE_UNITS = new Set([
  'pièce', 'tranche', 'gousse', 'botte', 'tasse',
  'pincée', 'goutte', 'poignée',
]);

export function isCuratedUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  return CURATED_UNIT_VALUES.has(unit);
}

export function displayUnit(
  unit: string | null | undefined,
  quantity: number | string | null | undefined,
): string {
  if (!unit) return '';
  const num = typeof quantity === 'number' ? quantity : parseFloat(String(quantity ?? ''));
  if (isNaN(num) || num <= 1) return unit;
  return PLURALIZABLE_UNITS.has(unit) ? unit + 's' : unit;
}
