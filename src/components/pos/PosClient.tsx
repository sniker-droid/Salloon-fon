"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgePercent,
  CheckCircle2,
  Copy,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShoppingBasket,
  Stamp,
  Trash2,
  X,
} from "lucide-react";
import { CATEGORIES, type CartLine, type Product } from "@/lib/catalog";
import { fmtMoney } from "@/lib/money";
import { CategoryIcon, CATEGORY_DOT, CATEGORY_STYLE } from "@/components/CategoryIcon";

type LastSale = {
  code: string;
  lines: CartLine[];
  discountPct: number;
  subtotalCents: number;
  totalCents: number;
};

function buildOrderText(
  lines: CartLine[],
  discountPct: number,
  code?: string,
): string {
  const sub = lines.reduce((a, l) => a + l.unitPriceCents * l.qty, 0);
  const total = Math.round(sub * (1 - discountPct / 100));
  const nameW = Math.min(
    26,
    Math.max(10, ...lines.map((l) => `${l.qty}x ${l.name}`.length)),
  );
  const row = (left: string, right: string) =>
    `${left.padEnd(nameW, ".")} ${right}`;
  const sep = "-".repeat(nameW + 9);
  const out = [
    "=== O SALOON — PEDIDO ===",
    ...(code ? [`Venda ${code}`] : []),
    ...lines.map((l) =>
      row(`${l.qty}x ${l.name}`, fmtMoney(l.unitPriceCents * l.qty)),
    ),
    sep,
    row("Subtotal", fmtMoney(sub)),
    ...(discountPct > 0
      ? [row(`Desconto (${discountPct}%)`, `-${fmtMoney(sub - total)}`)]
      : []),
    row("TOTAL", fmtMoney(total)),
    "Obrigado, volte sempre!",
  ];
  return out.join("\n");
}

export function PosClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("Todas");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [discount, setDiscount] = useState(0);
  const [customDisc, setCustomDisc] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<LastSale | null>(null);
  const [submitting, startSubmit] = useTransition();

  const lines = useMemo(() => Object.values(cart), [cart]);
  const subtotal = lines.reduce((a, l) => a + l.unitPriceCents * l.qty, 0);
  const total = Math.round(subtotal * (1 - discount / 100));
  const itemCount = lines.reduce((a, l) => a + l.qty, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "Todas" && p.category !== cat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, cat]);

  function addToCart(p: Product) {
    if (lastSale) setLastSale(null);
    setCart((c) => {
      const cur = c[p.id];
      return {
        ...c,
        [p.id]: {
          productId: p.id,
          name: p.name,
          unitPriceCents: p.priceCents,
          qty: Math.min(999, (cur?.qty ?? 0) + 1),
        },
      };
    });
  }

  function setQty(id: number, qty: number) {
    setCart((c) => {
      const cur = c[id];
      if (!cur) return c;
      if (qty <= 0) {
        const next = { ...c };
        delete next[id];
        return next;
      }
      return { ...c, [id]: { ...cur, qty: Math.min(999, qty) } };
    });
  }

  function copyOrder() {
    const closed = lastSale;
    const text = closed
      ? buildOrderText(closed.lines, closed.discountPct, closed.code)
      : buildOrderText(lines, discount);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => setError("Não consegui copiar para a área de transferência."));
  }

  function checkout() {
    if (lines.length === 0 || submitting) return;
    setError(null);
    startSubmit(async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discountPct: discount,
            items: lines.map((l) => ({
              productId: l.productId,
              name: l.name,
              unitPriceCents: l.unitPriceCents,
              qty: l.qty,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Falhou ao registar a venda.");
        setLastSale({
          code: data.order.code as string,
          lines,
          discountPct: discount,
          subtotalCents: subtotal,
          totalCents: total,
        });
        setCart({});
        setDiscount(0);
        setCustomDisc("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro inesperado.");
      }
    });
  }

  const hasProducts = products.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* ————— CATÁLOGO ————— */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.4em] text-brand">
              Serviço de balcão
            </p>
            <h1 className="mt-1 font-display text-4xl text-cream sm:text-5xl">
              O que vai ser, forasteiro?
            </h1>
            <p className="mt-2 max-w-xl text-[15px] font-light tracking-wide text-mute">
              Toca nos produtos para juntar ao talão, aplica o desconto combinado e
              fecha a venda. Sem papel, sem enganos.
            </p>
          </div>
        </div>

        {/* pesquisa + categorias */}
        <div className="sticky top-[73px] z-30 -mx-1 mt-6 bg-night/90 px-1 pb-3 pt-1 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="group relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar guisado, whiskey, isco…"
                className="w-full rounded-full border border-line bg-panel py-3 pl-11 pr-10 text-[15px] tracking-wide text-cream placeholder:text-mute2 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-mute hover:text-cream"
                  aria-label="Limpar pesquisa"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {["Todas", ...CATEGORIES].map((c) => {
                const active = cat === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.15em] transition-all ${
                      active
                        ? "border-brand bg-brand text-night shadow-[0_8px_24px_-10px_rgba(224,164,88,0.9)]"
                        : "border-line bg-panel text-mute hover:border-brand/50 hover:text-cream"
                    }`}
                  >
                    {c !== "Todas" && (
                      <span className={`size-1.5 rounded-full ${CATEGORY_DOT[c]}`} />
                    )}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* grelha de produtos */}
        {hasProducts ? (
          <motion.div layout className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  qty={cart[p.id]?.qty ?? 0}
                  onAdd={() => addToCart(p)}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full rounded-2xl border border-dashed border-line2 py-16 text-center"
              >
                <Search className="mx-auto size-8 text-mute2" />
                <p className="mt-3 font-type text-mute">
                  Nada no balcão com esse nome…
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-line2 py-20 text-center">
            <ReceiptText className="mx-auto size-10 text-mute2" />
            <p className="mt-4 font-type text-lg text-mute">
              Ainda não há produtos no livro.
            </p>
            <a
              href="/produtos"
              className="mt-2 inline-block font-semibold uppercase tracking-[0.2em] text-brand underline-offset-4 hover:underline"
            >
              Abrir o catálogo →
            </a>
          </div>
        )}
      </section>

      {/* ————— TALÃO (desktop) ————— */}
      <aside className="hidden lg:block">
        <div className="sticky top-[92px]">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-mute">
            <ReceiptText className="size-4 text-brand" />
            O teu talão — tudo o que escolheres aparece aqui
          </p>
          <Ticket
            mode={lastSale ? "closed" : "open"}
            lines={lastSale ? lastSale.lines : lines}
            discount={lastSale ? lastSale.discountPct : discount}
            lastSale={lastSale}
            submitting={submitting}
            onSetQty={setQty}
            onDiscount={(d) => {
              setDiscount(d);
              setCustomDisc("");
            }}
            customDisc={customDisc}
            onCustomDisc={(v) => {
              setCustomDisc(v);
              const n = Number(v);
              if (Number.isFinite(n)) setDiscount(Math.min(90, Math.max(0, Math.round(n))));
            }}
            onClear={() => {
              setCart({});
              setDiscount(0);
              setCustomDisc("");
            }}
            onNewSale={() => setLastSale(null)}
            onCopy={copyOrder}
            copied={copied}
            onCheckout={checkout}
            error={error}
          />
        </div>
      </aside>

      {/* ————— barra do talão (mobile) ————— */}
      <div className="lg:hidden">
        <AnimatePresence>
          {(itemCount > 0 || lastSale) && !sheetOpen && (
            <motion.button
              initial={{ y: 90, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 90, opacity: 0 }}
              onClick={() => setSheetOpen(true)}
              className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-full border border-brand/50 bg-panel px-5 py-4 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]"
            >
              <span className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
                <ShoppingBasket className="size-5" />
                {lastSale ? `Venda ${lastSale.code}` : `${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
              </span>
              <span className="font-type text-xl text-cream">
                {fmtMoney(lastSale ? lastSale.totalCents : total)}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sheetOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSheetOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 260 }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-night p-4 pb-8"
              >
                <button
                  onClick={() => setSheetOpen(false)}
                  className="mx-auto mb-4 flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-mute"
                >
                  <X className="size-4" /> Fechar talão
                </button>
                <Ticket
                  mode={lastSale ? "closed" : "open"}
                  lines={lastSale ? lastSale.lines : lines}
                  discount={lastSale ? lastSale.discountPct : discount}
                  lastSale={lastSale}
                  submitting={submitting}
                  onSetQty={setQty}
                  onDiscount={(d) => {
                    setDiscount(d);
                    setCustomDisc("");
                  }}
                  customDisc={customDisc}
                  onCustomDisc={(v) => {
                    setCustomDisc(v);
                    const n = Number(v);
                    if (Number.isFinite(n))
                      setDiscount(Math.min(90, Math.max(0, Math.round(n))));
                  }}
                  onClear={() => {
                    setCart({});
                    setDiscount(0);
                    setCustomDisc("");
                  }}
                  onNewSale={() => setLastSale(null)}
                  onCopy={copyOrder}
                  copied={copied}
                  onCheckout={checkout}
                  error={error}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ————————————————— cartão de produto ————————————————— */

function ProductCard({
  product,
  qty,
  onAdd,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
      whileTap={{ scale: 0.965 }}
      onClick={onAdd}
      className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-colors ${
        qty > 0
          ? "border-brand/70 bg-panel2"
          : "border-line bg-panel hover:border-brand/40 hover:bg-panel2/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${CATEGORY_STYLE[product.category]}`}
        >
          <CategoryIcon category={product.category} className="size-4" />
        </span>
        <span className="font-type text-lg leading-none text-brand">
          {fmtMoney(product.priceCents)}
        </span>
      </div>
      <p className="mt-3 text-lg font-semibold uppercase leading-tight tracking-[0.06em] text-cream">
        {product.name}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] text-mute2">
        {product.category}
      </p>

      <AnimatePresence>
        {qty > 0 && (
          <motion.span
            key="qty"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: -6 }}
            exit={{ scale: 0, rotate: 20 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="absolute -right-2 -top-2 flex size-9 items-center justify-center rounded-full bg-brand font-type text-sm text-night shadow-lg"
          >
            {qty}×
          </motion.span>
        )}
      </AnimatePresence>

      <span className="pointer-events-none absolute bottom-3 right-3 flex size-6 items-center justify-center rounded-full border border-line2 text-mute opacity-0 transition-opacity group-hover:opacity-100">
        <Plus className="size-3.5" />
      </span>
    </motion.button>
  );
}

/* ————————————————— o talão ————————————————— */

function Ticket({
  mode,
  lines,
  discount,
  lastSale,
  submitting,
  copied,
  customDisc,
  error,
  onSetQty,
  onDiscount,
  onCustomDisc,
  onClear,
  onNewSale,
  onCopy,
  onCheckout,
}: {
  mode: "open" | "closed";
  lines: CartLine[];
  discount: number;
  lastSale: LastSale | null;
  submitting: boolean;
  copied: boolean;
  customDisc: string;
  error: string | null;
  onSetQty: (id: number, qty: number) => void;
  onDiscount: (d: number) => void;
  onCustomDisc: (v: string) => void;
  onClear: () => void;
  onNewSale: () => void;
  onCopy: () => void;
  onCheckout: () => void;
}) {
  const subtotal =
    mode === "closed" && lastSale
      ? lastSale.subtotalCents
      : lines.reduce((a, l) => a + l.unitPriceCents * l.qty, 0);
  const total =
    mode === "closed" && lastSale
      ? lastSale.totalCents
      : Math.round(subtotal * (1 - discount / 100));
  const empty = lines.length === 0 && mode === "open";

  return (
    <div className="ticket relative font-type">
      {/* cabeçalho do talão */}
      <div className="border-b-2 border-dashed border-ink/25 px-6 py-5 text-center">
        <p className="font-display text-2xl tracking-wide text-ink">O SALOON</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-ink/60">
          {lastSale ? `Venda registada · ${lastSale.code}` : "Talão de pedido"}
        </p>
      </div>

      {/* itens do pedido */}
      <div className="px-6 py-4">
        {empty ? (
          <ol className="space-y-4 py-4">
            {[
              "Escolhe produtos na lista à esquerda — toca neles para juntar",
              "Ajusta as quantidades e o desconto aqui no talão",
              "Carrega em «Fechar venda» para registar e carimbar",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-cond text-sm font-bold text-paper">
                  {i + 1}
                </span>
                <span className="font-cond text-[15px] font-medium leading-snug text-ink/75">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li
                  key={l.productId}
                  layout
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                  className="overflow-hidden border-b border-ink/10 pb-2 last:border-0"
                >
                  <div className="flex items-baseline justify-between gap-2 text-[15px] text-ink">
                    <span className="leading-tight">
                      <span className="font-bold">{l.qty}×</span> {l.name}
                    </span>
                    <span className="shrink-0 font-bold">
                      {fmtMoney(l.unitPriceCents * l.qty)}
                    </span>
                  </div>
                  {mode === "open" && (
                    <div className="mt-1.5 flex items-center gap-2 font-cond">
                      <Stepper
                        label={`Tirar um ${l.name}`}
                        onClick={() => onSetQty(l.productId, l.qty - 1)}
                      >
                        <Minus className="size-3.5" />
                      </Stepper>
                      <span className="w-6 text-center text-sm font-bold text-ink">
                        {l.qty}
                      </span>
                      <Stepper
                        label={`Juntar um ${l.name}`}
                        onClick={() => onSetQty(l.productId, l.qty + 1)}
                      >
                        <Plus className="size-3.5" />
                      </Stepper>
                      <span className="ml-1 text-xs text-ink/50">
                        {fmtMoney(l.unitPriceCents)} cada
                      </span>
                      <button
                        onClick={() => onSetQty(l.productId, 0)}
                        className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-brick/80 hover:bg-brick/10 hover:text-brick"
                        aria-label={`Remover ${l.name} do talão`}
                      >
                        <Trash2 className="size-3.5" /> Tirar
                      </button>
                    </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* desconto */}
      {mode === "open" && (
        <div className="border-t-2 border-dashed border-ink/25 px-6 py-4 font-cond">
          <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.25em] text-ink/70">
            <BadgePercent className="size-4" /> Desconto (opcional)
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[0, 5, 10, 15, 20].map((d) => (
              <button
                key={d}
                onClick={() => onDiscount(d)}
                className={`rounded-md border px-3.5 py-2 text-[14px] font-bold tracking-wide transition-colors ${
                  discount === d && customDisc === ""
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/30 text-ink/70 hover:border-ink/60"
                }`}
              >
                {d === 0 ? "Sem" : `${d}%`}
              </button>
            ))}
            <input
              value={customDisc}
              onChange={(e) =>
                onCustomDisc(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))
              }
              placeholder="Outro %"
              className="no-spinner w-20 rounded-md border border-ink/30 bg-transparent px-2 py-2 text-center text-[14px] font-bold text-ink placeholder:text-ink/40 focus:border-ink focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* totais */}
      <div className="border-t-2 border-dashed border-ink/25 px-6 py-4">
        <div className="space-y-1.5 text-[15px] text-ink">
          <div className="flex justify-between">
            <span>Soma dos produtos</span>
            <span>{fmtMoney(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between font-bold text-brick">
              <span>Desconto de {discount}%</span>
              <span>-{fmtMoney(subtotal - total)}</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-ink px-4 py-3">
          <span className="font-cond text-[13px] font-bold uppercase tracking-[0.25em] text-paper/80">
            Total a pagar
          </span>
          <motion.span
            key={total}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            className="font-type text-3xl font-bold text-paper"
          >
            {fmtMoney(total)}
          </motion.span>
        </div>
      </div>

      {/* botões */}
      <div className="px-6 pb-6 font-cond">
        {mode === "open" ? (
          <>
            <button
              onClick={onCheckout}
              disabled={empty || submitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brick py-4 text-[16px] font-bold uppercase tracking-[0.2em] text-cream shadow-[0_10px_28px_-12px_rgba(194,74,46,0.9)] transition-all hover:-translate-y-0.5 hover:bg-brick/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <Stamp className="size-5" />
              {submitting ? "A registar…" : "Fechar venda"}
            </button>
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={onCopy}
                disabled={empty}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-ink/25 py-2.5 text-[13px] font-bold uppercase tracking-[0.15em] text-ink/80 transition-colors hover:border-ink hover:text-ink disabled:opacity-35"
              >
                {copied ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Copiado!" : "Copiar pedido"}
              </button>
              <button
                onClick={onClear}
                disabled={empty}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-ink/25 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.15em] text-ink/80 transition-colors hover:border-brick hover:text-brick disabled:opacity-35"
              >
                <Trash2 className="size-4" /> Limpar
              </button>
            </div>
            <p className="mt-2.5 text-center text-[12px] leading-snug text-ink/50">
              «Fechar venda» grava o pedido no livro de vendas. «Copiar pedido»
              escreve o talão em texto para colares onde quiseres.
            </p>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={onCopy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-ink/40 py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                {copied ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Copiado!" : "Copiar talão"}
              </button>
              <button
                onClick={onNewSale}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[13px] font-bold uppercase tracking-[0.15em] text-paper transition-colors hover:bg-brand2 hover:text-night"
              >
                <Plus className="size-4" /> Nova venda
              </button>
            </div>
            <p className="mt-2.5 text-center text-[12px] leading-snug text-ink/50">
              Esta venda já está no livro de vendas. Começa outra quando
              quiseres.
            </p>
          </>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-brick/10 px-3 py-2 text-center text-[13px] font-semibold text-brick">
            {error}
          </p>
        )}
      </div>

      {/* carimbo PAGO */}
      <AnimatePresence>
        {mode === "closed" && (
          <motion.div
            initial={{ scale: 2.2, opacity: 0, rotate: 6 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
            className="stamp pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 px-7 py-3 text-center text-brick"
          >
            <span className="font-display text-4xl tracking-[0.2em]">PAGO</span>
            <span className="mt-1 block font-type text-sm tracking-[0.3em]">
              {lastSale?.code}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stepper({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-md border border-ink/30 text-ink/70 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
    >
      {children}
    </button>
  );
}
