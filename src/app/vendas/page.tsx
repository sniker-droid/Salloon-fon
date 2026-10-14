import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import {
  SalesClient,
  type OrderWithItems,
  type SalesStats,
} from "@/components/sales/SalesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vendas — O Saloon",
};

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

const DAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default async function SalesPage() {
  let orderList: OrderWithItems[] = [];
  let stats: SalesStats = {
    todayCents: 0,
    weekCents: 0,
    totalCents: 0,
    orderCount: 0,
    avgCents: 0,
    top: [],
    daily: [],
  };

  try {
    const rows = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(100);

    const ids = rows.map((r) => r.id);
    const items =
      ids.length === 0
        ? []
        : await db
            .select()
            .from(orderItems)
            .where(inArray(orderItems.orderId, ids));

    const byOrder = new Map<number, typeof items>();
    for (const it of items) {
      const list = byOrder.get(it.orderId) ?? [];
      list.push(it);
      byOrder.set(it.orderId, list);
    }
    orderList = rows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] }));

    const now = new Date();
    const todayStart = startOfDay(now).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    let todayCents = 0;
    let weekCents = 0;
    let totalCents = 0;
    const dailyMap = new Map<number, number>();
    for (let i = 6; i >= 0; i--) dailyMap.set(todayStart - i * 86400000, 0);

    const topMap = new Map<string, { qty: number; cents: number }>();
    for (const o of orderList) {
      const t = new Date(o.createdAt).getTime();
      totalCents += o.totalCents;
      if (t >= todayStart) todayCents += o.totalCents;
      if (t >= weekStart) weekCents += o.totalCents;
      const day = startOfDay(new Date(t)).getTime();
      if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) ?? 0) + o.totalCents);
      for (const it of o.items) {
        const cur = topMap.get(it.name) ?? { qty: 0, cents: 0 };
        cur.qty += it.qty;
        cur.cents += it.lineTotalCents;
        topMap.set(it.name, cur);
      }
    }

    const top = [...topMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const daily = [...dailyMap.entries()].map(([ts, cents]) => ({
      label: DAY_LABELS[new Date(ts).getDay()],
      cents,
      today: ts === todayStart,
    }));

    stats = {
      todayCents,
      weekCents,
      totalCents,
      orderCount: orderList.length,
      avgCents: orderList.length ? Math.round(totalCents / orderList.length) : 0,
      top,
      daily,
    };
  } catch {
    // tabelas ainda por criar — mostra estado vazio
  }

  return <SalesClient orders={orderList} stats={stats} />;
}
