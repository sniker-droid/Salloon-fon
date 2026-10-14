/** Formata centavos em dólares estilo RP: $1.85 */
export function fmtMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Converte string tipo "1.85" / "1,85" para centavos. Devolve null se inválido. */
export function parsePrice(input: string): number | null {
  const clean = input.trim().replace(/\$/g, "").replace(",", ".");
  if (clean === "") return null;
  const n = Number(clean);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
