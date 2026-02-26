import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check, Palette } from "lucide-react";
import { useAccentColor, ACCENT_COLORS, type AccentColor } from "@/contexts/ThemeContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const colorKeys = Object.keys(ACCENT_COLORS) as AccentColor[];

export default function AppearanceSheet() {
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor } = useAccentColor();

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <Palette size={18} />
              <span className="sr-only">Apparence</span>
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>Apparence</TooltipContent>
      </Tooltip>

      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="font-display">Apparence</SheetTitle>
          <SheetDescription>
            Personnalisez les couleurs et le mode d'affichage.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Accent color */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold font-body">Couleur d'accent</h3>
            <div className="flex flex-wrap gap-3">
              {colorKeys.map((key) => {
                const def = ACCENT_COLORS[key];
                const isActive = accentColor === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={def.label}
                    onClick={() => setAccentColor(key)}
                    className="relative h-10 w-10 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{
                      background: def.preview,
                      boxShadow: isActive
                        ? `0 0 0 2px var(--background), 0 0 0 4px ${def.preview}`
                        : undefined,
                    }}
                  >
                    {isActive && (
                      <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

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
