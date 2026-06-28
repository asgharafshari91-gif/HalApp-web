"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Ticket = {
  id: string;
  user_id: string;
  status: "open" | "closed" | string;
  subject: string | null;
  message?: string | null;
  body?: string | null;
  category?: string | null;
  priority?: string | null;
  contact?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(dt);
  }
}

function timeAgo(dt?: string | null) {
  if (!dt) return "—";
  const t = new Date(dt).getTime();
  if (!Number.isFinite(t)) return "—";

  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);

  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} saat önce`;

  return `${Math.floor(hour / 24)} gün önce`;
}

function Badge({
  children,
  tone = "sky",
}: {
  children: React.ReactNode;
  tone?: "sky" | "emerald" | "rose" | "amber" | "zinc";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : tone === "rose"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
        : tone === "amber"
          ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : tone === "zinc"
            ? "border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
            : "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";

  return (
    <span className={clsx("inline-flex rounded-full border px-3 py-1 text-[11px] font-black", cls)}>
      {children}
    </span>
  );
}

function priorityTone(p?: string | null): "sky" | "rose" | "amber" | "zinc" {
  const v = String(p ?? "normal").toLowerCase();
  if (v === "critical") return "rose";
  if (v === "high") return "amber";
  if (v === "low") return "zinc";
  return "sky";
}

function priorityLabel(p?: string | null) {
  const v = String(p ?? "normal").toLowerCase();
  if (v === "critical") return "KRİTİK";
  if (v === "high") return "YÜKSEK";
  if (v === "low") return "DÜŞÜK";
  return "NORMAL";
}

export default function SupportClient() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const r = await fetch("/api/admin/support?status=open", {
        cache: "no-store",
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "support_error");

      setItems((j.items ?? []) as Ticket[]);
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  async function closeTicket(id: string) {
    if (closingId) return;
    if (!confirm("Bu destek talebini kapatmak istiyor musun?")) return;

    try {
      setClosingId(id);

      const r = await fetch(`/api/admin/support/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", status: "closed" }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "kapatma_hatası");

      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Kapatma hatası");
    } finally {
      setClosingId(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const critical = items.filter((x) => String(x.priority ?? "").toLowerCase() === "critical").length;
    const high = items.filter((x) => String(x.priority ?? "").toLowerCase() === "high").length;
    const today = items.filter((x) => {
      const d = new Date(x.created_at);
      const n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    }).length;

    return {
      open: items.length,
      critical,
      high,
      today,
    };
  }, [items]);

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
              🎫 Destek operasyon merkezi
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
              Açık Destek Talepleri
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-black/60 dark:text-white/60">
              Kullanıcı taleplerini hızlıca incele, kritik olanları ayır ve çözülenleri kapat.
            </p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-black text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {loading ? "Yükleniyor…" : "Yenile"}
          </button>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Açık Talep" value={stats.open} tone="sky" />
          <Stat label="Bugün" value={stats.today} tone="emerald" />
          <Stat label="Yüksek Öncelik" value={stats.high} tone="amber" />
          <Stat label="Kritik" value={stats.critical} tone="rose" />
        </div>
      </section>

      {loading ? (
        <section className="rounded-[26px] border border-black/10 bg-white/85 p-8 text-sm font-bold dark:border-white/10 dark:bg-white/[0.04]">
          Destek talepleri yükleniyor…
        </section>
      ) : err ? (
        <section className="rounded-[26px] border border-rose-500/30 bg-rose-500/10 p-6">
          <div className="text-sm font-black text-rose-700 dark:text-rose-200">Hata</div>
          <div className="mt-2 text-sm font-semibold text-rose-700/80 dark:text-rose-200/80">{err}</div>
          <div className="mt-3 text-xs font-semibold text-rose-700/70 dark:text-rose-200/70">
            Not: support_tickets tablosu veya API route eksikse SQL/API tarafını kontrol edeceğiz.
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="rounded-[26px] border border-emerald-500/25 bg-emerald-500/10 p-10 text-center">
          <div className="text-5xl">✅</div>
          <div className="mt-4 text-xl font-black text-emerald-800 dark:text-emerald-200">
            Açık destek talebi yok
          </div>
          <p className="mt-2 text-sm font-semibold text-emerald-800/70 dark:text-emerald-200/70">
            Destek kuyruğu temiz görünüyor.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white/85 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black">Ticket Listesi</div>
                <div className="mt-1 text-xs font-semibold text-black/50 dark:text-white/50">
                  {items.length} açık kayıt gösteriliyor
                </div>
              </div>

              <Link
                href="/admin/support"
                className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
              >
                Tüm destekler →
              </Link>
            </div>
          </div>

          <div className="divide-y divide-black/10 dark:divide-white/10">
            {items.map((t) => {
              const title = t.subject || "Destek Talebi";
              const msg = t.message || t.body || "";
              const lastAt = t.updated_at || t.created_at;
              const contact = t.contact || "—";
              const busy = closingId === t.id;

              return (
                <div key={t.id} className="p-5 transition hover:bg-emerald-500/5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="zinc">#{t.id}</Badge>
                        <Badge tone="amber">OPEN</Badge>
                        <Badge tone={priorityTone(t.priority)}>{priorityLabel(t.priority)}</Badge>
                        {t.category ? <Badge tone="sky">{t.category}</Badge> : null}
                      </div>

                      <div className="mt-3 truncate text-lg font-black">{title}</div>

                      <div className="mt-1 line-clamp-2 text-sm font-semibold text-black/55 dark:text-white/50">
                        {msg || "Mesaj yok."}
                      </div>

                      <div className="mt-2 text-xs font-bold text-black/45 dark:text-white/45">
                        user: {t.user_id} • contact: {contact} • {timeAgo(lastAt)}
                      </div>
                    </div>

                    <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[260px]">
                      <Link
                        href={`/admin/support/${encodeURIComponent(t.id)}`}
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        Detay →
                      </Link>

                      <button
                        onClick={() => closeTicket(t.id)}
                        disabled={busy}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? "Kapatılıyor…" : "Talebi Kapat"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "sky" | "emerald" | "amber" | "rose";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : tone === "amber"
        ? "border-amber-500/20 bg-amber-500/10"
        : tone === "rose"
          ? "border-rose-500/20 bg-rose-500/10"
          : "border-sky-500/20 bg-sky-500/10";

  return (
    <div className={clsx("rounded-2xl border p-4", cls)}>
      <div className="text-xs font-black text-black/50 dark:text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}