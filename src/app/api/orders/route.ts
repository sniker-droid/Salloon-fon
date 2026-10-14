import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";

type IncomingItem = {
  productId?: number;
  name?: string;
  unitPriceCents?: number;
  qty?: number;
};

export async function GET() {
  const rows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(100);

  const ids = rows.map((r) => r.id);
  const items =
    ids.length === 0
      ? []
      : await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));

  const byOrder = new Map<number, typeof items>();
  for (const it of items) {
    const list = byOrder.get(it.orderId) ?? [];
    list.push(it);
    byOrder.set(it.orderId, list);
  }

  return NextResponse.json({
    orders: rows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const rawItems = body.items as IncomingItem[];
  const discountPct = Math.min(90, Math.max(0, Math.round(Number(body.discountPct) || 0)));

  const clean = rawItems
    .map((it) => ({
      productId: Number.isInteger(it.productId) ? Number(it.productId) : null,
      name: String(it.name ?? "").trim().slice(0, 80),
      unitPriceCents: Math.round(Number(it.unitPriceCents)),
      qty: Math.round(Number(it.qty)),
    }))
    .filter(
      (it) =>
        it.name.length > 0 &&
        Number.isFinite(it.unitPriceCents) &&
        it.unitPriceCents >= 0 &&
        Number.isFinite(it.qty) &&
        it.qty >= 1 &&
        it.qty <= 999,
    );

  if (clean.length === 0) {
    return NextResponse.json(
      { error: "O pedido não tem itens válidos." },
      { status: 400 },
    );
  }

  const subtotalCents = clean.reduce(
    (acc, it) => acc + it.unitPriceCents * it.qty,
    0,
  );
  const totalCents = Math.round(subtotalCents * (1 - discountPct / 100));
  const itemCount = clean.reduce((acc, it) => acc + it.qty, 0);

  const result = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        code: "TMP",
        subtotalCents,
        discountPct,
        totalCents,
        itemCount,
      })
      .returning();

    const code = `#${String(order.id).padStart(4, "0")}`;
    const [updated] = await tx
      .update(orders)
      .set({ code })
      .where(eq(orders.id, order.id))
      .returning();

    await tx.insert(orderItems).values(
      clean.map((it) => ({
        orderId: order.id,
        productId: it.productId,
        name: it.name,
        unitPriceCents: it.unitPriceCents,
        qty: it.qty,
        lineTotalCents: it.unitPriceCents * it.qty,
      })),
    );

    return updated;
  });

  return NextResponse.json({ order: result }, { status: 201 });
}
