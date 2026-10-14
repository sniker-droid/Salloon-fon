import type { ProductRow } from "@/db/schema";

export type { ProductRow as Product };

export const CATEGORIES = [
  "Comida",
  "Bebidas",
  "Pesca",
  "Artesanato",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ORDER: Record<string, number> = {
  Comida: 0,
  Bebidas: 1,
  Pesca: 2,
  Artesanato: 3,
};

export type CartLine = {
  productId: number;
  name: string;
  unitPriceCents: number;
  qty: number;
};

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.unitPriceCents * l.qty, 0);
}

export function cartTotal(lines: CartLine[], discountPct: number): number {
  const sub = cartSubtotal(lines);
  return Math.round(sub * (1 - discountPct / 100));
}
