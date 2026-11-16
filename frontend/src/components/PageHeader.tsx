import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  onBack: () => void;
  backLabel?: string;
  /** Shown on the right, such as a save button. */
  actions?: ReactNode;
  /** Stacking order, for a page whose content floats sticky elements of its own. */
  layer?: string;
}

/**
 * Top bar of the add menu and the pages it opens: back arrow, title, and optional actions. Same height,
 * arrow and title type as the settings and shares headers, so the back arrow never moves between pages.
 */
export default function PageHeader({ title, onBack, backLabel = 'Retour', actions, layer = 'z-20' }: PageHeaderProps) {
  return (
    <header className={`sticky top-0 ${layer} flex items-center gap-3 px-4 h-14 bg-background border-b border-border`}>
      <Button variant="ghost" size="icon" onClick={onBack} aria-label={backLabel} className="shrink-0">
        <ArrowLeft size={20} />
      </Button>
      <h1 className="min-w-0 truncate font-display text-lg font-bold text-foreground">{title}</h1>
      {actions && <div className="ml-auto shrink-0">{actions}</div>}
    </header>
  );
}
