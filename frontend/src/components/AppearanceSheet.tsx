import { useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AppearanceSheet({ trigger }: { trigger?: React.ReactNode } = {}) {
  const { theme, setTheme } = useTheme();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  return (
    <Sheet>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <Tooltip open={tooltipOpen}>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                onPointerEnter={() => { timerRef.current = setTimeout(() => setTooltipOpen(true), 800); }}
                onPointerLeave={() => { clearTimeout(timerRef.current); setTooltipOpen(false); }}
              >
                <Palette size={18} />
                <span className="sr-only">Apparence</span>
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>Apparence</TooltipContent>
        </Tooltip>
      )}

      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-display">Apparence</SheetTitle>
          <SheetDescription>
            Personnalisez le mode d'affichage.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Mode */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold font-body">Mode</h3>
            <ToggleGroup
              type="single"
              value={theme}
              onValueChange={(v) => { if (v) setTheme(v); }}
              variant="outline"
              className="justify-start"
            >
              <ToggleGroupItem value="system" aria-label="Automatique" className="gap-2 px-4">
                <Monitor size={16} />
                Auto
              </ToggleGroupItem>
              <ToggleGroupItem value="light" aria-label="Clair" className="gap-2 px-4">
                <Sun size={16} />
                Clair
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Sombre" className="gap-2 px-4">
                <Moon size={16} />
                Sombre
              </ToggleGroupItem>
            </ToggleGroup>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
