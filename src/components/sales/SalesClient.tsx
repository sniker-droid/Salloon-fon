"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgePercent,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Copy,
  ReceiptText,
  Store,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { fmtMoney } from "@/lib/money";
import type { OrderItemRow, OrderRow } from "@/db/schema";

export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

export type SalesStats = {
  todayCents: number;
  weekCents: number;
  totalCents: number;
  orderCount: number;
  avgCents: number;
  top: { name: string; qty: number; cents: number }[];
  daily: { label: string; cents: number; today: boolean }[];
};

const timeFmt = new Intl.DateTimeFormat("pt-PT", {
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "short",
  weekday: "short",
});

export function SalesClient({
  orders,
  stats,
}: {
  orders: OrderWithItems[];
  stats: SalesStats;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.cents));

  function deleteOrder(id: number) {
    startTransition(async () => {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      setConfirmId(null);
      router.refresh();
    });
  }

  function copyOrder(o: OrderWithItems) {
    const lines = [
      `=== O SALOON — VENDA ${o.code} ===`,
      ...o.items.map(
        (it) => `${it.qty}x ${it.name} — ${fmtMoney(it.lineTotalCents)}`,
      ),
      `Subtotal: ${fmtMoney(o.subtotalCents)}`,
      ...(o.discountPct > 0 ? [`Desconto: ${o.discountPct}%`] : []),
      `TOTAL: ${fmtMoney(o.totalCents)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopiedId(o.id);
      setTimeout(() => setCopiedId(null), 1600);
    });
  }

  return (
    <div>
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.4em] text-brand">
          Caixa registadora
        </p>
        <h1 className="mt-1 font-display text-4xl text-cream sm:text-5xl">
          Livro de vendas
        </h1>
        <p className="mt-2 max-w-xl text-[15px] font-light tracking-wide text-mute">
          Cada venda fechada no balcão fica aqui registada. Conta os dólares, vê
          o que sai mais e anula enganos.
        </p>
      </div>

      {/* estatísticas */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Banknote className="size-5" />}
          label="Hoje no caixa"
          value={fmtMoney(stats.todayCents)}
          accent="text-brand border-brand/40 bg-brand/10"
        />
        <StatCard
          icon={<CalendarDays className="size-5" />}
          label="Últimos 7 dias"
          value={fmtMoney(stats.weekCents)}
          accent="text-sage border-sage/40 bg-sage/10"
        />
        <StatCard
          icon={<Store className="size-5" />}
          label="Vendas registadas"
          value={String(stats.orderCount)}
          accent="text-sky2 border-sky2/40 bg-sky2/10"
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Talão médio"
          value={fmtMoney(stats.avgCents)}
          accent="text-brick border-brick/40 bg-brick/10"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* lista de vendas */}
        <section className="overflow-hidden rounded-2xl border border-line bg-panel/60">
          <div className="flex items-center justify-between border-b border-line bg-panel px-5 py-3.5">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-mute2">
              <ReceiptText className="size-4" /> Últimas vendas
            </span>
            <span className="font-type text-sm text-mute">
              total {fmtMoney(stats.totalCents)}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="py-20 text-center">
              <ReceiptText className="mx-auto size-9 text-mute2" />
              <p className="mt-3 font-type text-mute">
                Ainda não entrou dinheiro. Fecha a primeira venda no balcão.
              </p>
            </div>
          ) : (
            <ul>
              {orders.map((o) => {
                const expanded = open === o.id;
                const d = new Date(o.createdAt);
                return (
                  <li key={o.id} className="border-b border-line/50 last:border-0">
                    <button
                      onClick={() => setOpen(expanded ? null : o.id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-panel2/50"
                    >
                      <span className="font-type text-lg text-brand">{o.code}</span>
                      <span className="hidden text-[13px] uppercase tracking-[0.15em] text-mute sm:block">
                        {dateFmt.format(d)} · {timeFmt.format(d)}
                      </span>
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-mute">
                        {o.itemCount} {o.itemCount === 1 ? "item" : "itens"}
                      </span>
                      {o.discountPct > 0 && (
                        <span className="hidden items-center gap-1 rounded-full border border-brick/40 bg-brick/10 px-2.5 py-0.5 text-[11px] font-bold text-brick sm:flex">
                          <BadgePercent className="size-3" /> {o.discountPct}%
                        </span>
                      )}
                      <span className="ml-auto font-type text-lg text-cream">
                        {fmtMoney(o.totalCents)}
                      </span>
                      <motion.span
                        animate={{ rotate: expanded ? 180 : 0 }}
                        className="text-mute"
                      >
                        <ChevronDown className="size-4" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mx-5 mb-4 rounded-xl border border-line bg-night/60 p-4">
                            <ul className="space-y-1.5 font-type text-[14px]">
                              {o.items.map((it) => (
                                <li
                                  key={it.id}
                                  className="flex items-baseline justify-between gap-3"
                                >
                                  <span className="text-cream/90">
                                    {it.qty}× {it.name}
                                  </span>
                                  <span className="text-mute">
                                    {fmtMoney(it.lineTotalCents)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="dash-line my-3 opacity-40" />
                            <div className="flex items-baseline justify-between font-type text-[15px]">
                              <span className="text-mute">
                                Subtotal {fmtMoney(o.subtotalCents)}
                                {o.discountPct > 0 &&
                                  ` · -${o.discountPct}%`}
                              </span>
                              <span className="text-lg font-bold text-brand">
                                {fmtMoney(o.totalCents)}
                              </span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => copyOrder(o)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-mute transition-colors hover:border-brand/60 hover:text-brand"
                              >
                                {copiedId === o.id ? (
                                  <CheckCircle2 className="size-4 text-sage" />
                                ) : (
                                  <Copy className="size-4" />
                                )}
                                {copiedId === o.id ? "Copiado!" : "Copiar"}
                              </button>
                              {confirmId === o.id ? (
                                <>
                                  <button
                                    onClick={() => deleteOrder(o.id)}
                                    disabled={pending}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brick py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-cream hover:bg-brick/80 disabled:opacity-50"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setConfirmId(null)}
                                    className="flex-1 rounded-lg border border-line py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-mute hover:text-cream"
                                  >
                                    Voltar
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmId(o.id)}
                                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line py-2 text-[12px] font-bold uppercase tracking-[0.2em] text-mute transition-colors hover:border-brick/60 hover:text-brick"
                                >
                                  <Trash2 className="size-4" /> Anular venda
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* coluna direita */}
        <div className="space-y-6">
          {/* gráfico 7 dias */}
          <section className="rounded-2xl border border-line bg-panel/60 p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-mute2">
              <TrendingUp className="size-4" /> Caixa da semana
            </p>
            <div className="mt-5 flex h-36 items-end gap-2.5">
              {stats.daily.map((d, i) => (
                <div
                  key={i}
                  className="group flex flex-1 flex-col items-center gap-2"
                  title={fmtMoney(d.cents)}
                >
                  <span className="font-type text-[11px] text-mute opacity-0 transition-opacity group-hover:opacity-100">
                    {fmtMoney(d.cents)}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max(d.cents > 0 ? 8 : 2, (d.cents / maxDaily) * 100)}%`,
                    }}
                    transition={{ delay: i * 0.05, type: "spring", bounce: 0.3 }}
                    className={`w-full rounded-t-md ${
                      d.today
                        ? "bg-gradient-to-t from-brand2 to-brand shadow-[0_0_20px_-4px_rgba(224,164,88,0.6)]"
                        : d.cents > 0
                          ? "bg-line2 group-hover:bg-brand2/70"
                          : "bg-line/60"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold uppercase tracking-widest ${
                      d.today ? "text-brand" : "text-mute2"
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* top produtos */}
          <section className="rounded-2xl border border-line bg-panel/60 p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-mute2">
              <Trophy className="size-4" /> O que mais sai
            </p>
            {stats.top.length === 0 ? (
              <p className="mt-4 font-type text-sm text-mute">
                Sem dados ainda.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {stats.top.map((t, i) => {
                  const pct = (t.qty / stats.top[0].qty) * 100;
                  return (
                    <li key={t.name}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.05em] text-cream">
                          <span className="font-type text-[13px] text-brand">
                            {i + 1}º
                          </span>
                          {t.name}
                        </span>
                        <span className="font-type text-[13px] text-mute">
                          {t.qty}× · {fmtMoney(t.cents)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-night">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.15 + i * 0.06, duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-brand2 to-brand"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-line bg-panel/60 p-4"
    >
      <span
        className={`flex size-10 items-center justify-center rounded-lg border ${accent}`}
      >
        {icon}
      </span>
      <p className="mt-3 font-type text-2xl text-cream">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.25em] text-mute2">
        {label}
      </p>
    </motion.div>
  );
}
