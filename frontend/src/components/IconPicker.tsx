import { ChevronDown, LucideIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export interface IconPickerOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface IconPickerProps<T extends string> {
  options: IconPickerOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowDeselect?: boolean;
  placeholder?: string;
}

export function IconPicker<T extends string>({
  options,
  value,
  onChange,
  allowDeselect = false,
  placeholder = 'Sélectionner',
}: IconPickerProps<T>) {
  const selected = options.find((o) => o.value === value);
  const SelectedIcon = selected?.icon;

  const handlePick = (v: T) => {
    if (allowDeselect && value === v) {
      onChange(null);
    } else {
      onChange(v);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors active:scale-[0.99] ${
            selected
              ? 'bg-primary/12 border-primary/35 text-foreground shadow-sm'
              : 'bg-card border-border text-muted-foreground'
          }`}
        >
          {SelectedIcon ? (
            <SelectedIcon size={18} className="text-primary shrink-0" />
          ) : (
            <span className="w-[18px] shrink-0" />
          )}
          <span className="text-sm font-body font-medium flex-1 text-left">
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[8rem] p-1"
      >
        {options.map((opt) => {
          const active = value === opt.value;
          const OptIcon = opt.icon;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handlePick(opt.value)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer ${
                active ? 'bg-primary/10 text-primary focus:bg-primary/15' : ''
              }`}
            >
              <OptIcon
                size={16}
                className={active ? 'text-primary' : 'text-muted-foreground'}
              />
              <span className="text-sm font-body font-medium">{opt.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
