import { useState } from "react";
import { Check, Paintbrush, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  applyColorToken,
  applyMonoFont,
  applySansFont,
  COLOR_GROUPS,
  FONT_MONO_OPTIONS,
  FONT_SANS_OPTIONS,
  getColorOverrides,
  getInitialMonoId,
  getInitialSansId,
  hexToHslTriple,
  PRIMARY_PRESETS,
  readTokenHex,
  resetAllColors,
  resetColorToken,
  resetMonoFont,
  resetSansFont,
  DEFAULT_MONO_ID,
  DEFAULT_SANS_ID,
  type HslTriple,
} from "@/lib/customization";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 mb-2 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
      {children}
    </p>
  );
}

/** A single token row: label + live color swatch wrapping a native picker. */
function ColorRow({
  id,
  label,
  overridden,
  onChange,
  onReset,
}: {
  id: string;
  label: string;
  overridden: boolean;
  onChange: (id: string, hsl: HslTriple) => void;
  onReset: (id: string) => void;
}) {
  const hex = readTokenHex(id);
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="flex items-center gap-2 text-xs text-foreground-secondary">
        {label}
        {overridden && (
          <button
            type="button"
            onClick={() => onReset(id)}
            className="text-foreground-faint transition-colors hover:text-foreground"
            title={`Reset ${label}`}
            aria-label={`Reset ${label}`}
          >
            <RotateCcw size={11} strokeWidth={2} />
          </button>
        )}
      </span>
      <span className="flex items-center gap-2">
        <span className="font-sans text-[10px] uppercase text-foreground-tertiary">{hex}</span>
        <label
          className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-[var(--r-sm)] border border-border"
          style={{ background: hex }}
        >
          <input
            type="color"
            value={hex}
            onChange={(e) => {
              const hsl = hexToHslTriple(e.target.value);
              if (hsl) onChange(id, hsl);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label} color`}
          />
        </label>
      </span>
    </div>
  );
}

function FontSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string; stack: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            <span style={{ fontFamily: o.stack }}>{o.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ThemeCustomizer() {
  const [sans, setSans] = useState<string>(() => getInitialSansId());
  const [mono, setMono] = useState<string>(() => getInitialMonoId());
  const [overrides, setOverrides] = useState<Record<string, HslTriple>>(() => getColorOverrides());
  // Bump to force color rows to re-read computed values after a change.
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const setColor = (id: string, hsl: HslTriple) => {
    applyColorToken(id, hsl);
    setOverrides(getColorOverrides());
    refresh();
  };

  const clearColor = (id: string) => {
    resetColorToken(id);
    setOverrides(getColorOverrides());
    refresh();
  };

  const selectSans = (id: string) => {
    applySansFont(id);
    setSans(id);
  };

  const selectMono = (id: string) => {
    applyMonoFont(id);
    setMono(id);
  };

  const resetEverything = () => {
    resetAllColors();
    resetSansFont();
    resetMonoFont();
    setOverrides({});
    setSans(DEFAULT_SANS_ID);
    setMono(DEFAULT_MONO_ID);
    refresh();
  };

  const isPristine =
    Object.keys(overrides).length === 0 && sans === DEFAULT_SANS_ID && mono === DEFAULT_MONO_ID;
  const activePrimary = overrides.primary;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" className="theme-toggle-button" aria-label="Customize appearance">
          <Paintbrush size={16} strokeWidth={1.8} />
          <span>Customize</span>
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 font-sans sm:max-w-md"
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background px-5 py-4 text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Appearance</SheetTitle>
            <button
              type="button"
              onClick={resetEverything}
              disabled={isPristine}
              className="mr-6 flex items-center gap-1 rounded-[var(--r-sm)] px-2 py-1 text-[11px] font-medium text-foreground-tertiary transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={12} strokeWidth={2} />
              Reset all
            </button>
          </div>
          <SheetDescription className="text-xs">
            Swap fonts and any color token live. Changes persist and apply across light/dark.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-5 py-5">
          {/* Fonts */}
          <section>
            <SectionLabel>Fonts</SectionLabel>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-foreground-secondary">Sans (interface)</span>
                <FontSelect value={sans} options={FONT_SANS_OPTIONS} onChange={selectSans} />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-foreground-secondary">Mono (code &amp; labels)</span>
                <FontSelect value={mono} options={FONT_MONO_OPTIONS} onChange={selectMono} />
              </div>
            </div>
          </section>

          {/* Brand quick swatches */}
          <section>
            <SectionLabel>Brand color</SectionLabel>
            <div className="grid grid-cols-8 gap-1.5">
              {PRIMARY_PRESETS.map((preset) => {
                const active = preset.hsl === activePrimary;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setColor("primary", preset.hsl)}
                    title={preset.label}
                    aria-label={preset.label}
                    aria-pressed={active}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-[var(--r-sm)] ring-offset-2 ring-offset-background transition-transform hover:scale-110",
                      active && "ring-2 ring-foreground",
                    )}
                    style={{ background: `hsl(${preset.hsl})` }}
                  >
                    {active && <Check size={12} strokeWidth={3} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Full token editor */}
          {COLOR_GROUPS.map((group) => (
            <section key={group.title}>
              <SectionLabel>{group.title}</SectionLabel>
              <div className="flex flex-col divide-y divide-border/60">
                {group.tokens.map((token) => (
                  <ColorRow
                    key={token.id}
                    id={token.id}
                    label={token.label}
                    overridden={token.id in overrides}
                    onChange={setColor}
                    onReset={clearColor}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
