import { Beer, Fish, Hammer, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Comida: UtensilsCrossed,
  Bebidas: Beer,
  Pesca: Fish,
  Artesanato: Hammer,
};

export const CATEGORY_STYLE: Record<string, string> = {
  Comida: "text-brand border-brand/40 bg-brand/10",
  Bebidas: "text-sky2 border-sky2/40 bg-sky2/10",
  Pesca: "text-sage border-sage/40 bg-sage/10",
  Artesanato: "text-brick border-brick/40 bg-brick/10",
};

export const CATEGORY_DOT: Record<string, string> = {
  Comida: "bg-brand",
  Bebidas: "bg-sky2",
  Pesca: "bg-sage",
  Artesanato: "bg-brick",
};

export function CategoryIcon({
  category,
  className = "size-4",
  strokeWidth = 2.2,
}: {
  category: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[category] ?? UtensilsCrossed;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
