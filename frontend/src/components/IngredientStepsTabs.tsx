import { useRef, useState } from 'react';

interface Props {
  ingredients: React.ReactNode;
  steps: React.ReactNode;
  stickyTop?: string;
}

export function IngredientStepsTabs({ ingredients, steps, stickyTop = '64px' }: Props) {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipeRef = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = activeTab === 'ingredients' ? 0 : 1;
  const indicatorPos = activeIndex + swipeOffset;
  const slideTransition = isDragging ? 'none' : 'transform 250ms ease-out';

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    // Avoid conflict with SwipeBack edge gesture
    if (t.clientX <= 30) return;
    swipeRef.current = { x: t.clientX, y: t.clientY, dragging: false };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const state = swipeRef.current;
    if (!state) return;
    const t = e.touches[0];
    const dx = t.clientX - state.x;
    const dy = t.clientY - state.y;
    if (!state.dragging) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        state.dragging = true;
        setIsDragging(true);
      } else if (Math.abs(dy) > 10) {
        swipeRef.current = null;
        return;
      } else {
        return;
      }
    }
    const width = containerRef.current?.offsetWidth ?? window.innerWidth;
    const raw = -dx / width;
    const clamped = Math.max(-activeIndex, Math.min(1 - activeIndex, raw));
    setSwipeOffset(clamped);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const state = swipeRef.current;
    swipeRef.current = null;
    setIsDragging(false);
    setSwipeOffset(0);
    if (!state || !state.dragging) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - state.x;
    const dy = Math.abs(t.clientY - state.y);
    if (Math.abs(dx) < 60 || dy > 60) return;
    if (dx < 0 && activeTab === 'ingredients') setActiveTab('steps');
    else if (dx > 0 && activeTab === 'steps') setActiveTab('ingredients');
  };

  const tabs = [
    { id: 'ingredients' as const, label: 'Ingrédients' },
    { id: 'steps' as const, label: 'Préparation' },
  ];
  const panels = [ingredients, steps];

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="tablist"
    >
      <div
        className="sticky z-40 -mx-4 px-4 bg-card/95 backdrop-blur-sm border-b border-border"
        style={{ top: stickyTop }}
      >
        <div className="relative">
          <div className="grid grid-cols-2">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                onClick={() => setActiveTab(t.id)}
                className={`py-3 text-sm font-body transition-colors ${
                  i === activeIndex ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div
            className="absolute -bottom-px left-0 h-0.5 w-1/2 bg-primary rounded-full"
            style={{
              transform: `translateX(${indicatorPos * 100}%)`,
              transition: slideTransition,
            }}
          />
        </div>
      </div>
      <div className="mt-4" style={{ overflowX: 'clip' }}>
        <div
          className="flex"
          style={{
            transform: `translateX(${-indicatorPos * 100}%)`,
            transition: slideTransition,
          }}
        >
          {panels.map((panel, i) => (
            <div
              key={i}
              role="tabpanel"
              aria-hidden={i !== activeIndex}
              className="w-full flex-shrink-0 px-1"
            >
              {panel}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
