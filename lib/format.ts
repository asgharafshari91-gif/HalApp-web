// lib/format.ts
export function formatTRY(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ₺`;
  }
}

export function formatUnitPrice(
  pricePerUnit?: number | null,
  unit?: string | null
) {
  if (pricePerUnit == null) return "—";
  const u = unit?.trim() ? unit!.trim() : "kg";
  // "₺18 / kg" gibi
  return `${formatTRY(pricePerUnit)} / ${u}`;
}

export function safeText(v?: string | null, fallback = "—") {
  const t = (v ?? "").trim();
  return t ? t : fallback;
}