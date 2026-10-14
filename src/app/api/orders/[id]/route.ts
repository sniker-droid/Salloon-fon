import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const [deleted] = await db
    .delete(orders)
    .where(eq(orders.id, orderId))
    .returning({ id: orders.id });

  if (!deleted) {
    return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
