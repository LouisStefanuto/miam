import { useEffect, type ReactNode } from "react";

export type AccentColor = "orange" | "rose" | "blue" | "green" | "purple" | "teal";

interface AccentColorDef {
  label: string;
  /** CSS hsl value for the swatch preview */
  preview: string;
  primary: string;
  ring: string;
  sidebarPrimary: string;
  sidebarRing: string;
  gradientWarm: string;
  shadowCardHover: string;
  shadowCardHoverDark: string;
}

export const ACCENT_COLORS: Record<AccentColor, AccentColorDef> = {
  orange: {
    label: "Orange",
    preview: "hsl(27 95% 55%)",
    primary: "27 95% 55%",
    ring: "27 95% 55%",
    sidebarPrimary: "27 95% 55%",
    sidebarRing: "27 95% 55%",
    gradientWarm: "linear-gradient(135deg, hsl(27 95% 55%), hsl(35 85% 55%))",
    shadowCardHover: "0 8px 30px -4px hsl(27 95% 55% / 0.15)",
    shadowCardHoverDark: "0 8px 30px -4px hsl(27 95% 55% / 0.2)",
  },
  rose: {
    label: "Rose",
    preview: "hsl(350 80% 55%)",
    primary: "350 80% 55%",
    ring: "350 80% 55%",
    sidebarPrimary: "350 80% 55%",
    sidebarRing: "350 80% 55%",
    gradientWarm: "linear-gradient(135deg, hsl(350 80% 55%), hsl(0 75% 60%))",
    shadowCardHover: "0 8px 30px -4px hsl(350 80% 55% / 0.15)",
    shadowCardHoverDark: "0 8px 30px -4px hsl(350 80% 55% / 0.2)",
  },
  blue: {
    label: "Bleu",
    preview: "hsl(210 90% 55%)",
    primary: "210 90% 55%",
    ring: "210 90% 55%",
    sidebarPrimary: "210 90% 55%",
    sidebarRing: "210 90% 55%",
    gradientWarm: "linear-gradient(135deg, hsl(210 90% 55%), hsl(220 80% 60%))",
    shadowCardHover: "0 8px 30px -4px hsl(210 90% 55% / 0.15)",
    shadowCardHoverDark: "0 8px 30px -4px hsl(210 90% 55% / 0.2)",
  },
  green: {
    label: "Vert",
    preview: "hsl(150 60% 40%)",
    primary: "150 60% 40%",
    ring: "150 60% 40%",
    sidebarPrimary: "150 60% 40%",
    sidebarRing: "150 60% 40%",
    gradientWarm: "linear-gradient(135deg, hsl(150 60% 40%), hsl(160 50% 45%))",
    shadowCardHover: "0 8px 30px -4px hsl(150 60% 40% / 0.15)",
    shadowCardHoverDark: "0 8px 30px -4px hsl(150 60% 40% / 0.2)",
  },
  purple: {
    label: "Violet",
    preview: "hsl(270 70% 55%)",
    primary: "270 70% 55%",
    ring: "270 70% 55%",
    sidebarPrimary: "270 70% 55%",
    sidebarRing: "270 70% 55%",
    gradientWarm: "linear-gradient(135deg, hsl(270 70% 55%), hsl(280 60% 60%))",
    shadowCardHover: "0 8px 30px -4px hsl(270 70% 55% / 0.15)",
    shadowCardHoverDark: "0 8px 30px -4px hsl(270 70% 55% / 0.2)",
  },
  teal: {
    label: "Sarcelle",
    preview: "hsl(175 65% 40%)",
    primary: "175 65% 40%",
    ring: "175 65% 40%",
    sidebarPrimary: "175 65% 40%",
    sidebarRing: "175 65% 40%",
    gradientWarm: "linear-gradient(135deg, hsl(175 65% 40%), hsl(185 55% 45%))",
    shadowCardHover: "0 8px 30px -4px hsl(175 65% 40% / 0.15)",
    shadowCardHoverDark: "0 8px 30px -4px hsl(175 65% 40% / 0.2)",
  },
};

/** Change this to switch the app's main accent color. */
export const ACCENT_COLOR: AccentColor = "orange";

function applyAccentColor(color: AccentColor) {
  const def = ACCENT_COLORS[color];
  const root = document.documentElement;
  root.style.setProperty("--primary", def.primary);
  root.style.setProperty("--ring", def.ring);
  root.style.setProperty("--sidebar-primary", def.sidebarPrimary);
  root.style.setProperty("--sidebar-ring", def.sidebarRing);
  root.style.setProperty("--gradient-warm", def.gradientWarm);

  const isDark = root.classList.contains("dark");
  root.style.setProperty(
    "--shadow-card-hover",
    isDark ? def.shadowCardHoverDark : def.shadowCardHover,
  );
}

export function AccentColorProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyAccentColor(ACCENT_COLOR);
    const observer = new MutationObserver(() => applyAccentColor(ACCENT_COLOR));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
