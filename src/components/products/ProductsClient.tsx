"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenText,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { CATEGORIES, type Product } from "@/lib/catalog";
import { fmtMoney, parsePrice } from "@/lib/money";
import { CategoryIcon, CATEGORY_DOT, CATEGORY_STYLE } from "@/components/CategoryIcon";

type Draft = {
  id?: number;
  name: string;
  category: string;
  price: string;
};

export function ProductsClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [products, query]);

  const activeCount = products.filter((p) => p.active).length;

  async function call(input: string, init: RequestInit): Promise<string | null> {
    const res = await fetch(input, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return (data.error as string) ?? "Algo correu mal.";
    }
    return null;
  }

  function saveDraft() {
    if (!draft) return;
    setError(null);
    const priceCents = parsePrice(draft.price);
    if (priceCents === null) {
      setError("Escreve um preço válido, ex.: 1.85");
      return;
    }
    startTransition(async () => {
      const err = draft.id
        ? await call(`/api/products/${draft.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: draft.name,
              category: draft.category,
              priceCents,
            }),
          })
        : await call("/api/products", {
            method: "POST",
            body: JSON.stringify({
              name: draft.name,
              category: draft.category,
              priceCents,
            }),
          });
      if (err) {
        setError(err);
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  function toggleActive(p: Product) {
    startTransition(async () => {
      const err = await call(`/api/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !p.active }),
      });
      if (err) setError(err);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    startTransition(async () => {
      const err = await call(`/api/products/${toDelete.id}`, {
        method: "DELETE",
      });
      if (err) setError(err);
      setToDelete(null);
      router.refresh();
    });
  }

  return (
    <div>
      {/* cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.4em] text-brand">
            Livro de preços
          </p>
          <h1 className="mt-1 font-display text-4xl text-cream sm:text-5xl">
            Catálogo do Saloon
          </h1>
          <p className="mt-2 max-w-xl text-[15px] font-light tracking-wide text-mute">
            {products.length} produtos no livro · {activeCount} à venda no balcão.{" "}
            Ajusta preços, junta novidades e tira do balcão o que acabou.
          </p>
        </div>
        <button
          onClick={() =>
            setDraft({ name: "", category: "Comida", price: "" })
          }
          className="notch flex items-center gap-2 bg-brand2 px-5 py-3 text-[13px] font-bold uppercase tracking-[0.2em] text-night shadow-[0_10px_30px_-10px_rgba(224,164,88,0.7)] transition-transform hover:-translate-y-0.5"
        >
          <Plus className="size-4" strokeWidth={3} /> Novo produto
        </button>
      </div>

      {/* pesquisa */}
      <label className="relative mt-6 block max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar no livro…"
          className="w-full rounded-full border border-line bg-panel py-3 pl-11 pr-4 text-[15px] tracking-wide text-cream placeholder:text-mute2 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </label>

      {error && !draft && (
        <p className="mt-4 max-w-md rounded-lg bg-brick/10 px-4 py-2.5 text-sm font-semibold text-brick">
          {error}
        </p>
      )}

      {/* tabela */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-panel/60">
        <div className="hidden grid-cols-[minmax(0,1fr)_150px_110px_110px_130px] gap-4 border-b border-line bg-panel px-5 py-3 text-[11px] font-bold uppercase tracking-[0.3em] text-mute2 md:grid">
          <span>Produto</span>
          <span>Categoria</span>
          <span className="text-right">Preço</span>
          <span className="text-center">No balcão</span>
          <span className="text-right">Ações</span>
        </div>
        <ul>
          <AnimatePresence initial={false}>
            {filtered.map((p) => (
              <motion.li
                layout
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`grid grid-cols-1 gap-3 border-b border-line/50 px-5 py-4 transition-colors last:border-0 hover:bg-panel2/50 md:grid-cols-[minmax(0,1fr)_150px_110px_110px_130px] md:items-center md:gap-4 ${
                  p.active ? "" : "opacity-45"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${CATEGORY_STYLE[p.category]}`}
                  >
                    <CategoryIcon category={p.category} className="size-4" />
                  </span>
                  <span className="text-[17px] font-semibold uppercase tracking-[0.05em] text-cream">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-12 md:pl-0">
                  <span className={`size-1.5 rounded-full ${CATEGORY_DOT[p.category]}`} />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-mute">
                    {p.category}
                  </span>
                </div>
                <div className="pl-12 text-left font-type text-lg text-brand md:pl-0 md:text-right">
                  {fmtMoney(p.priceCents)}
                </div>
                <div className="pl-12 md:pl-0 md:text-center">
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={pending}
                    title={p.active ? "Tirar do balcão" : "Pôr à venda"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                      p.active
                        ? "border-sage/60 bg-sage/25"
                        : "border-line2 bg-night"
                    }`}
                  >
                    <span
                      className={`inline-block size-4 rounded-full transition-transform ${
                        p.active ? "translate-x-6 bg-sage" : "translate-x-1 bg-mute2"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 pl-12 md:justify-end md:pl-0">
                  <IconBtn
                    label="Editar"
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        price: (p.priceCents / 100).toFixed(2),
                      })
                    }
                  >
                    <Pencil className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label={p.active ? "Desativar" : "Ativar"}
                    onClick={() => toggleActive(p)}
                  >
                    <Power className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Apagar"
                    danger
                    onClick={() => setToDelete(p)}
                  >
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <BookOpenText className="mx-auto size-8 text-mute2" />
            <p className="mt-3 font-type text-mute">
              {products.length === 0
                ? "O livro está em branco. Junta o primeiro produto."
                : "Nenhum produto com esse nome."}
            </p>
          </div>
        )}
      </div>

      {/* modal criar/editar */}
      <AnimatePresence>
        {draft && (
          <Modal onClose={() => setDraft(null)}>
            <h2 className="font-display text-2xl text-brand">
              {draft.id ? "Afiar o lápis" : "Novo no livro"}
            </h2>
            <p className="mt-1 text-sm text-mute">
              {draft.id ? "Edita o produto e grava." : "Regista um produto novo do saloon."}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel>Nome do produto</FieldLabel>
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Ex.: Guisado de veado"
                  maxLength={80}
                  className="w-full rounded-lg border border-line bg-night px-4 py-3 text-[15px] tracking-wide text-cream placeholder:text-mute2 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <FieldLabel>Categoria</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setDraft({ ...draft, category: c })}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold uppercase tracking-[0.15em] transition-colors ${
                        draft.category === c
                          ? "border-brand bg-brand text-night"
                          : "border-line bg-night text-mute hover:border-brand/50 hover:text-cream"
                      }`}
                    >
                      <CategoryIcon category={c} className="size-3.5" />
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Preço (dólares)</FieldLabel>
                <div className="relative max-w-[180px]">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-type text-lg text-mute">
                    $
                  </span>
                  <input
                    value={draft.price}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        price: e.target.value.replace(/[^0-9.,]/g, ""),
                      })
                    }
                    onKeyDown={(e) => e.key === "Enter" && saveDraft()}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="w-full rounded-lg border border-line bg-night py-3 pl-9 pr-4 font-type text-lg text-brand placeholder:text-mute2 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-brick/10 px-4 py-2.5 text-sm font-semibold text-brick">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDraft(null)}
                  className="flex-1 rounded-lg border border-line py-3 text-[13px] font-bold uppercase tracking-[0.2em] text-mute transition-colors hover:border-line2 hover:text-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveDraft}
                  disabled={pending || draft.name.trim().length < 2}
                  className="notch flex-[2] bg-brand2 py-3 text-[13px] font-bold uppercase tracking-[0.2em] text-night transition-colors hover:bg-brand disabled:opacity-40"
                >
                  {pending ? "A gravar…" : draft.id ? "Gravar" : "Juntar ao livro"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* modal apagar */}
      <AnimatePresence>
        {toDelete && (
          <Modal onClose={() => setToDelete(null)}>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-brick/40 bg-brick/10 text-brick">
                <TriangleAlert className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-2xl text-brick">
                  Riscar do livro?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-mute">
                  <span className="font-bold text-cream">“{toDelete.name}”</span>{" "}
                  vai desaparecer do catálogo para sempre. As vendas antigas
                  mantêm o registo.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setToDelete(null)}
                className="flex-1 rounded-lg border border-line py-3 text-[13px] font-bold uppercase tracking-[0.2em] text-mute transition-colors hover:border-line2 hover:text-cream"
              >
                Voltar
              </button>
              <button
                onClick={confirmDelete}
                disabled={pending}
                className="flex-1 rounded-lg bg-brick py-3 text-[13px] font-bold uppercase tracking-[0.2em] text-cream transition-colors hover:bg-brick/80 disabled:opacity-40"
              >
                {pending ? "A apagar…" : "Apagar"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-mute">
      {children}
    </p>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex size-9 items-center justify-center rounded-lg border transition-colors ${
        danger
          ? "border-line text-mute hover:border-brick/60 hover:bg-brick/10 hover:text-brick"
          : "border-line text-mute hover:border-brand/60 hover:bg-brand/10 hover:text-brand"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className="fixed left-1/2 top-1/2 z-[80] w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line2 bg-panel p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-mute hover:bg-night hover:text-cream"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
        {children}
      </motion.div>
    </>
  );
}
