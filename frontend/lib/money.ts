/** Ledger amounts are integer cents (TRY assumed). */
export function formatCents(cents?: number | null): string {
  const n = Math.round(Number(cents) || 0);
  const v = Math.abs(n) / 100;
  const sym = `${n < 0 ? "−" : ""}${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
  return sym;
}
