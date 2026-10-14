import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    category: text("category").notNull().default("Comida"),
    priceCents: integer("price_cents").notNull().default(0),
    active: boolean("active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("products_active_idx").on(t.active)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountPct: integer("discount_pct").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    itemCount: integer("item_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("orders_created_idx").on(t.createdAt)],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id"),
    name: text("name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    qty: integer("qty").notNull().default(1),
    lineTotalCents: integer("line_total_cents").notNull().default(0),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export type ProductRow = typeof products.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
