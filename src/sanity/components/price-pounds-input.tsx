import { useEffect, useMemo, useState } from "react";
import { PatchEvent, set, unset, type NumberInputProps } from "sanity";

function penceToPounds(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "";
  }

  return (value / 100).toFixed(2);
}

function poundsToPence(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned.trim()) {
    return null;
  }

  const pounds = Number.parseFloat(cleaned);
  if (!Number.isFinite(pounds) || pounds < 0) {
    return null;
  }

  return Math.round(pounds * 100);
}

export function PricePoundsInput(props: NumberInputProps) {
  const { value, onChange } = props;
  const [displayValue, setDisplayValue] = useState(() => penceToPounds(value));

  useEffect(() => {
    setDisplayValue(penceToPounds(value));
  }, [value]);

  const savedPreview = useMemo(() => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "No price saved yet.";
    }

    return `Saved as £${(value / 100).toFixed(2)}.`;
  }, [value]);

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Price (£)</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span aria-hidden="true" style={{ fontWeight: 700 }}>£</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={displayValue}
            placeholder="10.00"
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              setDisplayValue(nextValue);

              const pence = poundsToPence(nextValue);
              onChange(PatchEvent.from(pence === null ? unset() : set(pence)));
            }}
            onBlur={() => {
              const pence = poundsToPence(displayValue);
              setDisplayValue(pence === null ? "" : (pence / 100).toFixed(2));
            }}
            style={{
              width: "100%",
              border: "1px solid var(--card-border-color)",
              borderRadius: "0.25rem",
              background: "var(--card-bg-color)",
              color: "inherit",
              padding: "0.6rem 0.75rem",
            }}
          />
        </div>
      </label>
      <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--card-muted-fg-color)" }}>
        Enter the price in pounds, for example 10 or 10.00. {savedPreview}
      </p>
    </div>
  );
}
