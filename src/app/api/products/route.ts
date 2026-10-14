import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { CATEGORIES } from "@/lib/catalog";

export async function GET() {
  const rows = await db
    .select()
    .from(products)
    .orderBy(asc(products.sort), asc(products.name));
  return NextResponse.json({ products: rows });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "Comida");
  const priceCents = Number(body.priceCents);

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json(
      { error: "O nome precisa de 2 a 80 caracteres." },
      { status: 400 },
    );
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }
  if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 1000000) {
    return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
  }

  const dup = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.name, name))
    .limit(1);
  if (dup.length > 0) {
    return NextResponse.json(
      { error: "Já existe um produto com esse nome." },
      { status: 409 },
    );
  }

  const maxSort = await db.select({ sort: products.sort }).from(products);
  const nextSort = maxSort.reduce((m, r) => Math.max(m, r.sort), 0) + 1;

  const [created] = await db
    .insert(products)
    .values({ name, category, priceCents: Math.round(priceCents), sort: nextSort })
    .returning();

  return NextResponse.json({ product: created }, { status: 201 });
}
