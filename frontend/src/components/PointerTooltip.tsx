import { useState, useRef, useCallback } from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface PointerTooltipProps {
  label: string;
  children: React.ReactNode;
  delayDuration?: number;
}

/**
 * A tooltip that only responds to pointer hover, not focus.
 * Prevents the ghost tooltip that appears when Radix restores focus
 * after closing a Sheet or DropdownMenu.
 */
export default function PointerTooltip({ label, children, delayDuration = 800 }: PointerTooltipProps) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handlePointerEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
  }, [delayDuration]);

  const handlePointerLeave = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  }, []);

  const handlePointerDown = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={open}>
        <TooltipTrigger
          asChild
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
