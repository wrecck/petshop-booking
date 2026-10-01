"use client";

import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import {
  DEFAULT_BRANDING,
  THEME_PRESETS,
  brandingStyle,
  type BrandingTheme,
  type ThemePreset,
} from "@/lib/branding";
import { updateShopBranding } from "@/app/dashboard/actions";

const presetOptions: { id: ThemePreset; label: string; hint: string }[] = [
  { id: "sage", label: "Sage", hint: "Warm greens" },
  { id: "ocean", label: "Ocean", hint: "Cool blues" },
  { id: "sunset", label: "Sunset", hint: "Soft terracotta" },
  { id: "charcoal", label: "Charcoal", hint: "Modern neutrals" },
  { id: "custom", label: "Custom", hint: "Your own colors" },
];

export function BrandingForm({
  initial,
  shopName,
}: {
  initial: BrandingTheme;
  shopName: string;
}) {
  const [theme, setTheme] = useState<BrandingTheme>({
    ...DEFAULT_BRANDING,
    ...initial,
  });

  const previewStyle = useMemo(() => brandingStyle(theme), [theme]);

  function applyPreset(preset: ThemePreset) {
    if (preset === "custom") {
      setTheme((current) => ({ ...current, theme_preset: "custom" }));
      return;
    }
    setTheme((current) => ({
      ...current,
      theme_preset: preset,
      ...THEME_PRESETS[preset],
    }));
  }

  function updateColor(
    key: keyof Pick<
      BrandingTheme,
      | "primary_color"
      | "accent_color"
      | "background_color"
      | "surface_color"
      | "text_color"
    >,
    value: string,
  ) {
    setTheme((current) => ({
      ...current,
      theme_preset: "custom",
      [key]: value,
    }));
  }

  return (
    <div className="branding-layout">
      <form className="tenant-settings-card branding-form" action={updateShopBranding}>
        <div className="settings-card-heading">
          <span>
            <Palette />
          </span>
          <div>
            <h2>Theme & colors</h2>
            <p>Choose a preset or fine-tune your own palette.</p>
          </div>
        </div>

        <input type="hidden" name="themePreset" value={theme.theme_preset} />
        <input type="hidden" name="primaryColor" value={theme.primary_color} />
        <input type="hidden" name="accentColor" value={theme.accent_color} />
        <input
          type="hidden"
          name="backgroundColor"
          value={theme.background_color}
        />
        <input type="hidden" name="surfaceColor" value={theme.surface_color} />
        <input type="hidden" name="textColor" value={theme.text_color} />

        <div className="theme-preset-grid">
          {presetOptions.map((preset) => (
            <button
              type="button"
              key={preset.id}
              className={`theme-preset-card ${
                theme.theme_preset === preset.id ? "selected" : ""
              }`}
              onClick={() => applyPreset(preset.id)}
            >
              <span
                className="theme-swatches"
                style={{
                  background:
                    preset.id === "custom"
                      ? `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})`
                      : `linear-gradient(135deg, ${THEME_PRESETS[preset.id].primary_color}, ${THEME_PRESETS[preset.id].accent_color})`,
                }}
              />
              <strong>{preset.label}</strong>
              <small>{preset.hint}</small>
            </button>
          ))}
        </div>

        <div className="color-grid">
          <label>
            Primary
            <input
              type="color"
              value={theme.primary_color}
              onChange={(event) =>
                updateColor("primary_color", event.target.value)
              }
            />
          </label>
          <label>
            Accent
            <input
              type="color"
              value={theme.accent_color}
              onChange={(event) =>
                updateColor("accent_color", event.target.value)
              }
            />
          </label>
          <label>
            Background
            <input
              type="color"
              value={theme.background_color}
              onChange={(event) =>
                updateColor("background_color", event.target.value)
              }
            />
          </label>
          <label>
            Cards
            <input
              type="color"
              value={theme.surface_color}
              onChange={(event) =>
                updateColor("surface_color", event.target.value)
              }
            />
          </label>
          <label>
            Text
            <input
              type="color"
              value={theme.text_color}
              onChange={(event) => updateColor("text_color", event.target.value)}
            />
          </label>
        </div>

        <label className="wide">
          Hero headline
          <input
            name="heroTitle"
            required
            value={theme.hero_title}
            onChange={(event) =>
              setTheme((current) => ({
                ...current,
                hero_title: event.target.value,
              }))
            }
          />
        </label>
        <label className="wide">
          Supporting sentence
          <textarea
            name="heroSubtitle"
            required
            rows={3}
            value={theme.hero_subtitle}
            onChange={(event) =>
              setTheme((current) => ({
                ...current,
                hero_subtitle: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Ratings note
          <select
            name="showRatings"
            value={theme.show_ratings ? "true" : "false"}
            onChange={(event) =>
              setTheme((current) => ({
                ...current,
                show_ratings: event.target.value === "true",
              }))
            }
          >
            <option value="true">Show on booking page</option>
            <option value="false">Hide from booking page</option>
          </select>
        </label>
        <button className="primary-button wide">Save branding</button>
      </form>

      <aside className="branding-preview" style={previewStyle}>
        <p className="eyebrow">Live preview</p>
        <div className="branding-preview-card">
          <strong>{shopName}</strong>
          <h3>{theme.hero_title}</h3>
          <p>{theme.hero_subtitle}</p>
          <button type="button" className="primary-button">
            Request appointment
          </button>
        </div>
      </aside>
    </div>
  );
}
