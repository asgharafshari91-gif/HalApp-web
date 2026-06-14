"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function statusBadge(status: string) {
  const s = String(status || "open").toLowerCase();

  if (s === "closed" || s === "resolved") {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  }

  if (s === "review" || s === "in_review") {
    return "bg-blue-500/10 text-blue-700 border-blue-500/20";
  }

  if (s === "answered") {
    return "bg-violet-500/10 text-violet-700 border-violet-500/20";
  }

  return "bg-orange-500/10 text-orange-700 border-orange-500/20";
}

function fmt(dt?: string | null) {
  if (!dt) return "—";

  try {
    return new Date(dt).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dt;
  }
}

export default function SupportClient({
  initialItems,
  q,
  status,
  page,
  pages,
  total,
  limit,
}: {
  initialItems: any[];
  q: string;
  status: string;
  page: number;
  pages: number;
  total: number;
  limit: number;
}) {
  const router = useRouter();

  const openCount = initialItems.filter(
    (x) => String(x.status ?? "open").toLowerCase() !== "closed"
  ).length;

  const closedCount = initialItems.filter(
    (x) => String(x.status ?? "").toLowerCase() === "closed"
  ).length;

  function submitSearch(formData: FormData) {
    const nextQ = String(formData.get("q") ?? "").trim();
    const nextStatus = String(formData.get("status") ?? "open");

    const sp = new URLSearchParams();

    if (nextQ) sp.set("q", nextQ);
    if (nextStatus) sp.set("status", nextStatus);
    if (limit !== 25) sp.set("limit", String(limit));

    router.push(`/admin/support?${sp.toString()}`);
  }

  function goPage(nextPage: number) {
    const sp = new URLSearchParams();

    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (limit !== 25) sp.set("limit", String(limit));

    sp.set("page", String(nextPage));

    router.push(`/admin/support?${sp.toString()}`);
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-[0_26px_100px_rgba(0,0,0,.07)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.045]">
        <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-28 left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
              ADMIN DESTEK PANELİ
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
              Destek Talepleri
            </h1>

            <p className="mt-2 text-sm font-semibold text-zinc-600 dark:text-white/60">
              Kullanıcı ticketlarını takip et, durum değiştir ve çözüm notu gir.
            </p>
          </div>

          <Link
            href="/support"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white/70 px-5 text-sm font-black text-zinc-800 transition hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
          >
            Kullanıcı Destek Merkezi →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[26px] border border-black/10 bg-white/75 p-5 dark:border-white/10 dark:bg-white/[0.045]">
          <div className="text-sm font-black text-zinc-500">Toplam</div>
          <div className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
            {total}
          </div>
        </div>

        <div className="rounded-[26px] border border-orange-500/20 bg-orange-500/10 p-5">
          <div className="text-sm font-black text-orange-700">Bu Sayfa Açık</div>
          <div className="mt-2 text-3xl font-black text-orange-700">
            {openCount}
          </div>
        </div>

        <div className="rounded-[26px] border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="text-sm font-black text-emerald-700">Bu Sayfa Kapalı</div>
          <div className="mt-2 text-3xl font-black text-emerald-700">
            {closedCount}
          </div>
        </div>

        <div className="rounded-[26px] border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="text-sm font-black text-blue-700">Sayfa</div>
          <div className="mt-2 text-3xl font-black text-blue-700">
            {page}/{pages}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-black/10 bg-white/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,.05)] dark:border-white/10 dark:bg-white/[0.045]">
        <form action={submitSearch} className="grid gap-3 md:grid-cols-[1fr_180px_140px]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Ticket, konu, mesaj veya kullanıcı ara..."
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-semibold outline-none transition focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/20"
          />

          <select
            name="status"
            defaultValue={status}
            className="h-12 rounded-2xl border border-black/10 bg-white px-4 text-sm font-black outline-none dark:border-white/10 dark:bg-black/20"
          >
            <option value="open">Açık</option>
            <option value="closed">Kapalı</option>
            <option value="all">Tümü</option>
          </select>

          <button className="h-12 rounded-2xl bg-emerald-500 text-sm font-black text-black transition hover:bg-emerald-400">
            Filtrele
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-black/10 bg-white/80 shadow-[0_24px_90px_rgba(0,0,0,.06)] dark:border-white/10 dark:bg-white/[0.045]">
        <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
          <div className="text-sm font-black text-zinc-950 dark:text-white">
            Ticket Listesi
          </div>
        </div>

        {initialItems.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-5xl">🎫</div>
            <div className="mt-4 text-xl font-black text-zinc-950 dark:text-white">
              Ticket bulunamadı
            </div>
            <p className="mt-2 text-sm font-semibold text-zinc-500">
              Arama veya filtreyi değiştir.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black/10 dark:divide-white/10">
            {initialItems.map((ticket) => {
              const ticketStatus = String(ticket.status ?? "open").toLowerCase();
              const title = ticket.subject || ticket.title || "Destek Talebi";
              const message = ticket.message || ticket.body || "";
              const contact = ticket.contact || ticket.email || ticket.phone || "—";

              return (
                <Link
                  key={ticket.id}
                  href={`/admin/support/${ticket.id}`}
                  className="group block p-5 transition hover:bg-emerald-500/5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-black text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                          #{ticket.ticket_no || ticket.id}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusBadge(
                            ticketStatus
                          )}`}
                        >
                          {ticketStatus}
                        </span>

                        {ticket.priority ? (
                          <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[11px] font-black text-rose-700">
                            {ticket.priority}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 truncate text-lg font-black text-zinc-950 dark:text-white">
                        {title}
                      </div>

                      <div className="mt-1 line-clamp-1 text-sm font-semibold text-zinc-500 dark:text-white/50">
                        {message || "Mesaj yok"}
                      </div>
                    </div>

                    <div className="shrink-0 text-left lg:text-right">
                      <div className="text-sm font-black text-zinc-700 dark:text-white/75">
                        {contact}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-zinc-500">
                        {fmt(ticket.created_at)}
                      </div>

                      <div className="mt-3 text-xs font-black text-emerald-700 opacity-0 transition group-hover:opacity-100">
                        Detayı aç →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex items-center justify-between gap-3">
        <button
          disabled={page <= 1}
          onClick={() => goPage(page - 1)}
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.045]"
        >
          ← Önceki
        </button>

        <div className="text-sm font-black text-zinc-500">
          Sayfa {page} / {pages}
        </div>

        <button
          disabled={page >= pages}
          onClick={() => goPage(page + 1)}
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-black disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.045]"
        >
          Sonraki →
        </button>
      </section>
    </main>
  );
}