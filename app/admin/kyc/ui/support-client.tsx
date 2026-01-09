"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  user_id: string;
  status: "open" | "closed";
  subject: string;
  created_at: string;
};

export default function SupportClient() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const r = await fetch("/api/admin/support?status=open", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "support_error");
      setItems(j.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Hata");
    } finally {
      setLoading(false);
    }
  }

  async function closeTicket(id: string) {
    const r = await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    const j = await r.json();
    if (!r.ok) return alert(j?.error || "kapatma_hatası");
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black">🎫 Destek Talepleri</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">
              Açık talepleri görüntüle ve kapat.
            </div>
          </div>
          <button
            onClick={load}
            className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            Yenile
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[22px] border border-black/10 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          Yükleniyor…
        </div>
      ) : err ? (
        <div className="rounded-[22px] border border-rose-500/30 bg-rose-500/10 p-5">
          <div className="text-sm font-black text-rose-700">Hata</div>
          <div className="mt-2 text-sm text-rose-700/80">{err}</div>
          <div className="mt-3 text-xs text-rose-700/70">
            Not: support_tickets tablosu yoksa SQL’de oluşturacağız (sonraki adım).
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
          Açık destek talebi yok ✅
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div
              key={t.id}
              className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="text-sm font-black">{t.subject}</div>
              <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                user: {t.user_id} • {new Date(t.created_at).toLocaleString()}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => closeTicket(t.id)}
                  className="rounded-2xl bg-black/90 px-4 py-2 text-sm font-black text-white hover:bg-black"
                >
                  Talebi Kapat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}