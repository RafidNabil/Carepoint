export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const dateOnly = value.slice(0, 10);
  const parsed = new Date(`${dateOnly}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: import.meta.env.VITE_CLINIC_TIMEZONE || "Asia/Dhaka",
  }).format(parsed);
}

export function formatMoney(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: import.meta.env.VITE_CURRENCY || "BDT",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "CP";
}

export function humanize(value: string) {
  return value.toLowerCase().split("_").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ");
}
