import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { CATEGORIES } from "@/lib/catalog";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const patch: Partial<{
    name: string;
    category: string;
    priceCents: number;
    active: boolean;
  }> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { error: "O nome precisa de 2 a 80 caracteres." },
        { status: 400 },
      );
    }
    patch.name = name;
  }
  if (body.category !== undefined) {
    const category = String(body.category);
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      return NextResponse.json(
        { error: "Categoria inválida." },
        { status: 400 },
      );
    }
    patch.category = category;
  }
  if (body.priceCents !== undefined) {
    const priceCents = Number(body.priceCents);
    if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 1000000) {
      return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
    }
    patch.priceCents = Math.round(priceCents);
  }
  if (body.active !== undefined) {
    patch.active = Boolean(body.active);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const [updated] = await db
    .update(products)
    .set(patch)
    .where(eq(products.id, productId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, productId))
    .returning({ id: products.id });

  if (!deleted) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
