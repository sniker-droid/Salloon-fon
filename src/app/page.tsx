import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import type { Product } from "@/lib/catalog";
import { PosClient } from "@/components/pos/PosClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let rows: Product[] = [];
  try {
    rows = await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.sort), asc(products.name));
  } catch {
    rows = [];
  }

  return <PosClient products={rows} />;
}
