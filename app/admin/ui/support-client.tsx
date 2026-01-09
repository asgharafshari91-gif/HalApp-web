"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type SupportRow = {
  id: string;
  user_id: string;
  status: string | null;
  subject: string | null;
  message: string | null;
  body: string | null;
  contact: string | null;
  resolution: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

function pill(v: "sky" | "emerald" | "rose" | "amber") {
  if (v === "emerald") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-800";
  if (v === "rose") return "border-rose-500/25 bg-rose-500/10 text-rose-800";
  if (v === "amber") return "border-amber-500/25 bg-amber-500/10 text-amber-800";
  return "border-sky-500/25 bg-sky-500/10 text-sky-800";
}

function Badge({ children, variant }: { children: React.ReactNode; variant: "sky" | "emerald" | "rose" | "amber" }) {
  return <span className={clsx("rounded-full border px-3 py-1 text-[11px] font-extrabold", pill(variant))}>{children}</span>;
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("tr-TR");
}

function normStatus(v: string | null) {
  return (v ?? "open").toLowerCase() === "closed" ? "closed" : "open";
}

async function apiPatch(id: string, body: any) {
  const res = await fetch(`/api/admin/support/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j?.error ?? "request_failed");
  return j;
}

export default function SupportClient({
  initialItems,
  q,
  status,
  page,
  pages,
  total,
  limit = 25, // ✅ DEFAULT
}: {
  initialItems: SupportRow[];
  q: string;
  status: string;
  page: number;
  pages: number;
  total: number;
  limit?: number; // ✅ OPSİYONEL
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const title = useMemo(() => `🎫 Destek Talepleri (${total})`, [total]);

  function pushParams(next: { q?: string; status?: string; page?: number }) {
    const sp = new URLSearchParams();
    if (next.q) sp.set("q", next.q);
    if (next.status) sp.set("status", next.status);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    router.push(`/admin/support?${sp.toString()}`);
  }

  async function toggleClose(r: SupportRow) {
    if (busyId) return;
    const next = normStatus(r.status) === "open" ? "closed" : "open";
    const resolution =
      next === "closed" ? prompt("Çözüm / not:", r.resolution ?? "")?.trim() || null : undefined;

    setBusyId(r.id);
    try {
      const j = await apiPatch(r.id, { status: next, ...(resolution !== undefined ? { resolution } : {}) });
      setItems((p) => p.map((x) => (x.id === r.id ? { ...x, ...j.ticket } : x)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border bg-white/80 p-5">
        <div className="text-lg font-black">{title}</div>
      </div>

      <div className="space-y-2">
        {items.map((r) => {
          const p = r.profiles;
          const open = expanded[r.id];
          return (
            <div key={r.id} className="rounded-2xl border bg-white/70 p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <div className="font-black">{p?.company_name || p?.full_name || "Kullanıcı"}</div>
                  <div className="text-xs opacity-70">
                    {fmt(r.created_at)} • {r.user_id}
                  </div>

                  {open && (
                    <div className="mt-2 text-sm whitespace-pre-wrap">
                      {r.message || r.body || "—"}
                    </div>
                  )}

                  <button
                    className="mt-2 text-xs font-black underline"
                    onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}
                  >
                    {open ? "Gizle" : "Detay"}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href={`/admin/support/${r.id}`} className="text-xs font-black underline">
                    Ticket →
                  </Link>

                  <button
                    disabled={busyId === r.id}
                    onClick={() => toggleClose(r)}
                    className={clsx(
                      "rounded-xl px-3 py-2 text-xs font-black",
                      normStatus(r.status) === "open" ? "bg-emerald-500" : "bg-amber-500"
                    )}
                  >
                    {normStatus(r.status) === "open" ? "Kapat" : "Aç"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-sm">
        <div>Sayfa {page}/{pages}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => pushParams({ q, status, page: page - 1 })}>←</button>
          <button disabled={page >= pages} onClick={() => pushParams({ q, status, page: page + 1 })}>→</button>
        </div>
      </div>
    </div>
  );
}