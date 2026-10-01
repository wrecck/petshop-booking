import type { CSSProperties } from "react";

export type ThemePreset = "sage" | "ocean" | "sunset" | "charcoal" | "custom";

export type BrandingTheme = {
  theme_preset: ThemePreset;
  primary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  hero_title: string;
  hero_subtitle: string;
  show_ratings: boolean;
};

export type ShopPage = {
  id: string;
  shop_id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  sort_order: number;
};

export const THEME_PRESETS: Record<
  Exclude<ThemePreset, "custom">,
  Omit<BrandingTheme, "theme_preset" | "hero_title" | "hero_subtitle" | "show_ratings">
> = {
  sage: {
    primary_color: "#2f6256",
    accent_color: "#a35f38",
    background_color: "#fbf8f0",
    surface_color: "#fffefa",
    text_color: "#173c35",
  },
  ocean: {
    primary_color: "#1f4f6e",
    accent_color: "#2a7a8c",
    background_color: "#f3f7fa",
    surface_color: "#ffffff",
    text_color: "#163246",
  },
  sunset: {
    primary_color: "#9c4a3a",
    accent_color: "#d0894a",
    background_color: "#fbf5ef",
    surface_color: "#fffaf5",
    text_color: "#3b241d",
  },
  charcoal: {
    primary_color: "#2d3438",
    accent_color: "#7a8b75",
    background_color: "#f4f3f0",
    surface_color: "#ffffff",
    text_color: "#1c2226",
  },
};

export const DEFAULT_BRANDING: BrandingTheme = {
  theme_preset: "sage",
  ...THEME_PRESETS.sage,
  hero_title: "Let’s get your best friend looking their best.",
  hero_subtitle:
    "Pick a service and a time that works for you. We’ll handle the rest.",
  show_ratings: true,
};

export function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  if (Number.isNaN(int) || value.length !== 6) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function lighten(hex: string, amount = 0.82) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount);
  return `#${[mix(rgb.r), mix(rgb.g), mix(rgb.b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function rgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(47, 98, 86, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function brandingStyle(theme: BrandingTheme): CSSProperties {
  const primarySoft = lighten(theme.primary_color, 0.84);
  return {
    ["--ink" as string]: theme.text_color,
    ["--ink-soft" as string]: rgba(theme.text_color, 0.62),
    ["--cream" as string]: theme.background_color,
    ["--paper" as string]: theme.surface_color,
    ["--sage" as string]: primarySoft,
    ["--sage-dark" as string]: theme.primary_color,
    ["--peach" as string]: lighten(theme.accent_color, 0.72),
    ["--gold" as string]: theme.accent_color,
    ["--line" as string]: rgba(theme.text_color, 0.14),
    ["--shadow" as string]: `0 20px 60px ${rgba(theme.primary_color, 0.12)}`,
    ["--accent" as string]: theme.accent_color,
    color: theme.text_color,
    background: `
      radial-gradient(circle at 85% 4%, ${rgba(theme.primary_color, 0.16)}, transparent 25rem),
      ${theme.background_color}
    `,
    minHeight: "100vh",
  };
}

export function createPageSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const reservedPageSlugs = new Set([
  "pages",
  "book",
  "login",
  "dashboard",
  "api",
  "auth",
  "home",
]);
