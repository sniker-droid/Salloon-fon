import { asc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import type { Product } from "@/lib/catalog";
import { ProductsClient } from "@/components/products/ProductsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catálogo — O Saloon",
};

export default async function ProductsPage() {
  let rows: Product[] = [];
  try {
    rows = await db
      .select()
      .from(products)
      .orderBy(asc(products.sort), asc(products.name));
  } catch {
    rows = [];
  }
  return <ProductsClient products={rows} />;
}
