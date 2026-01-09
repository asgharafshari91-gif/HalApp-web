// app/admin/ui/users-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

type UserRow = {
  id: string;
  full_name: string | null;
  company_name?: string | null;
  phone: string | null;
  email: string | null;
  is_admin: boolean | null;
  is_premium: boolean | null;
  premium_until: string | null;
  banned_until: string | null;
  ban_reason: string | null;
  created_at: string;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function fmt(dt?: string | null) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(dt);
  }
}

function isBanned(u: UserRow) {
  return !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();
}

export default function UsersClient() {
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // küçük debounce (yazarken API'yi boğmasın)
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const controllerRef = useRef<AbortController | null>(null);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set("q", debouncedQ);
    sp.set("limit", "100");
    return sp.toString();
  }, [debouncedQ]);

  async function load() {
    try {
      controllerRef.current?.abort();
      const ac = new AbortController();
      controllerRef.current = ac;

      setLoading(true);
      const r = await fetch(`/api/admin/users?${queryString}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "users_error");
      setItems((j.items || []) as UserRow[]);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      toast({ variant: "error", title: "Kullanıcılar yüklenemedi", message: e?.message ?? "Hata" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  async function patchUser(id: string, patch: Record<string, any>) {
    try {
      setSavingId(id);
      const r = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "update_failed");

      const next = (j.profile ?? null) as UserRow | null;
      if (next) setItems((prev) => prev.map((u) => (u.id === id ? next : u)));

      toast({ variant: "success", title: "Güncellendi", message: "İşlem başarılı" });
    } catch (e: any) {
      toast({ variant: "error", title: "Güncellenemedi", message: e?.message ?? "Hata" });
    } finally {
      setSavingId(null);
    }
  }

  function togglePremium(u: UserRow) {
    const next = !Boolean(u.is_premium);
    const premium_until = next
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // örnek: 30 gün
      : null;

    patchUser(u.id, { is_premium: next, premium_until });
  }

  function toggleBan(u: UserRow) {
    const banned = isBanned(u);
    if (banned) {
      patchUser(u.id, { banned_until: null, ban_reason: null });
      return;
    }

    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // örnek: 7 gün
    const reason = (prompt("Ban sebebi (opsiyonel):", u.ban_reason ?? "admin_ban") ?? "").trim() || "admin_ban";
    patchUser(u.id, { banned_until: until, ban_reason: reason });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[22px] border border-black/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-black">👤 Kullanıcılar</div>
            <div className="mt-1 text-sm text-black/60 dark:text-white/60">Premium / Ban / Admin yönetimi</div>
          </div>

          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ara: ad / şirket / telefon / email / id"
              className="w-full md:w-80 rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <button
              onClick={load}
              className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-black hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-2">
          {loading ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Yükleniyor…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Kayıt yok.
            </div>
          ) : (
            items.map((u) => {
              const busy = savingId === u.id;
              const banned = isBanned(u);
              const premium = !!u.is_premium;
              const name = (u.company_name ?? u.full_name ?? "—").toString();

              return (
                <div
                  key={u.id}
                  className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-black">{name}</div>

                        {u.is_admin ? <span className="rounded-full bg-indigo-500/20 px-2 py-1 text-xs font-black">ADMIN</span> : null}
                        {premium ? <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-black">PREMIUM</span> : null}
                        {banned ? <span className="rounded-full bg-rose-500/20 px-2 py-1 text-xs font-black">BAN</span> : null}
                      </div>

                      <div className="mt-1 text-xs text-black/60 dark:text-white/60 space-y-1">
                        <div className="truncate">id: {u.id}</div>
                        <div className="truncate">
                          {u.phone ? `tel: ${u.phone}` : ""} {u.email ? ` • mail: ${u.email}` : ""}
                        </div>
                        <div>
                          created: {fmt(u.created_at)}
                          {premium && u.premium_until ? ` • premium_until: ${fmt(u.premium_until)}` : ""}
                          {banned && u.banned_until ? ` • banned_until: ${fmt(u.banned_until)}` : ""}
                        </div>
                        {u.ban_reason ? <div className="text-rose-600/90 dark:text-rose-400/90">reason: {u.ban_reason}</div> : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      <Link
                        href={`/admin/users/${encodeURIComponent(u.id)}`}
                        className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
                      >
                        Detay →
                      </Link>

                      <button
                        disabled={busy}
                        onClick={() => togglePremium(u)}
                        className={clsx(
                          "rounded-2xl px-4 py-2 text-xs font-black transition",
                          premium
                            ? "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                            : "bg-emerald-500 hover:bg-emerald-400 text-black",
                          busy && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        Premium {premium ? "Kapat" : "Aç"}
                      </button>

                      <button
                        disabled={busy}
                        onClick={() => toggleBan(u)}
                        className={clsx(
                          "rounded-2xl px-4 py-2 text-xs font-black transition",
                          banned
                            ? "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                            : "bg-rose-500 hover:bg-rose-400 text-white",
                          busy && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {banned ? "Unban" : "Ban"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}