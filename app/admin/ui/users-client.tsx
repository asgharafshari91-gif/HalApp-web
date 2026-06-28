// app/admin/ui/users-client.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

type UserRow = {
  id: string;
  full_name: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  phone: string | null;
  email: string | null;
  city?: string | null;
  district?: string | null;
  role?: string | null;
  kyc_status?: string | null;
  is_admin: boolean | null;
  is_premium: boolean | null;
  premium_until: string | null;
  banned_until: string | null;
  ban_reason: string | null;
  last_seen_at?: string | null;
  created_at: string;
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

function isBanned(u: UserRow) {
  return !!u.banned_until && new Date(u.banned_until).getTime() > Date.now();
}

function isOnline(u: UserRow) {
  if (!u.last_seen_at) return false;
  return Date.now() - new Date(u.last_seen_at).getTime() < 5 * 60 * 1000;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "H";
  const b = parts[1]?.[0] ?? "";
  return `${a}${b}`.toUpperCase();
}

function Badge({
  children,
  tone = "sky",
}: {
  children: React.ReactNode;
  tone?: "sky" | "emerald" | "rose" | "amber" | "indigo" | "zinc";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
      : tone === "rose"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-200"
        : tone === "amber"
          ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          : tone === "indigo"
            ? "border-indigo-500/25 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200"
            : tone === "zinc"
              ? "border-black/10 bg-black/5 text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
              : "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-200";

  return (
    <span className={clsx("inline-flex rounded-full border px-3 py-1 text-[11px] font-black", cls)}>
      {children}
    </span>
  );
}

function Avatar({ u, name }: { u: UserRow; name: string }) {
  const online = isOnline(u);

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-black text-white dark:border-white/10 dark:bg-white dark:text-black">
      {u.avatar_url ? (
        <img src={u.avatar_url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm font-black">
          {initials(name)}
        </div>
      )}

      <span
        className={clsx(
          "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white dark:border-black",
          online ? "bg-emerald-500" : "bg-zinc-400"
        )}
      />
    </div>
  );
}

export default function UsersClient() {
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [debouncedQ, setDebouncedQ] = useState("");

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (debouncedQ) sp.set("q", debouncedQ);
    sp.set("limit", "100");
    return sp.toString();
  }, [debouncedQ]);

  const stats = useMemo(() => {
    const total = items.length;
    const premium = items.filter((x) => x.is_premium).length;
    const banned = items.filter(isBanned).length;
    const admins = items.filter((x) => x.is_admin).length;

    return { total, premium, banned, admins };
  }, [items]);

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

      toast({
        variant: "error",
        title: "Kullanıcılar yüklenemedi",
        message: e?.message ?? "Hata",
      });
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
      if (next) {
        setItems((prev) => prev.map((u) => (u.id === id ? { ...u, ...next } : u)));
      }

      toast({
        variant: "success",
        title: "Güncellendi",
        message: "İşlem başarılı.",
      });
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Güncellenemedi",
        message: e?.message ?? "Hata",
      });
    } finally {
      setSavingId(null);
    }
  }

  function togglePremium(u: UserRow) {
    const next = !Boolean(u.is_premium);
    const premium_until = next
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    patchUser(u.id, {
      is_premium: next,
      premium_until,
    });
  }

  function toggleBan(u: UserRow) {
    const banned = isBanned(u);

    if (banned) {
      patchUser(u.id, {
        banned_until: null,
        ban_reason: null,
      });
      return;
    }

    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const reason =
      (prompt("Ban sebebi:", u.ban_reason ?? "admin_ban") ?? "").trim() || "admin_ban";

    patchUser(u.id, {
      banned_until: until,
      ban_reason: reason,
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]">
        <div className="relative p-5 md:p-6">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-sky-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
                👤 Kullanıcı operasyon merkezi
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">
                Kullanıcı Yönetimi
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-black/60 dark:text-white/60">
                Profil, premium, admin, ban ve güvenlik durumlarını tek ekrandan yönet.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-3 text-center dark:border-white/10 dark:bg-white/[0.04]">
                <div className="text-xs font-black text-black/50 dark:text-white/50">Toplam</div>
                <div className="text-xl font-black">{stats.total}</div>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                <div className="text-xs font-black text-black/50 dark:text-white/50">Premium</div>
                <div className="text-xl font-black">{stats.premium}</div>
              </div>
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-center">
                <div className="text-xs font-black text-black/50 dark:text-white/50">Admin</div>
                <div className="text-xl font-black">{stats.admins}</div>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-center">
                <div className="text-xs font-black text-black/50 dark:text-white/50">Ban</div>
                <div className="text-xl font-black">{stats.banned}</div>
              </div>
            </div>
          </div>

          <div className="relative mt-5 grid gap-2 md:grid-cols-[1fr_120px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ara: ad / şirket / telefon / email / id"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/35 dark:border-white/10 dark:bg-black/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />

            <button
              onClick={load}
              className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white hover:opacity-90 dark:bg-white dark:text-black"
            >
              Yenile
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-black/10 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="grid gap-3">
          {loading ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-10 text-center text-sm font-semibold text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
              Kullanıcılar yükleniyor…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 px-4 py-10 text-center text-sm font-semibold text-black/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
              Kayıt bulunamadı.
            </div>
          ) : (
            items.map((u) => {
              const busy = savingId === u.id;
              const banned = isBanned(u);
              const premium = !!u.is_premium;
              const name = (u.company_name ?? u.full_name ?? "Kullanıcı").toString();
              const online = isOnline(u);

              return (
                <div
                  key={u.id}
                  className={clsx(
                    "rounded-[24px] border p-4 transition",
                    "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]",
                    banned && "border-rose-500/25 bg-rose-500/5"
                  )}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <Avatar u={u} name={name} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-base font-black">{name}</div>

                          {online ? <Badge tone="emerald">ONLINE</Badge> : <Badge tone="zinc">OFFLINE</Badge>}
                          {u.is_admin ? <Badge tone="indigo">ADMIN</Badge> : null}
                          {premium ? <Badge tone="emerald">PREMIUM</Badge> : null}
                          {banned ? <Badge tone="rose">BAN</Badge> : null}
                          {u.kyc_status ? <Badge tone="amber">KYC: {u.kyc_status}</Badge> : null}
                        </div>

                        <div className="mt-2 grid gap-1 text-xs font-semibold text-black/55 dark:text-white/55 md:grid-cols-2">
                          <div className="truncate">id: {u.id}</div>
                          <div className="truncate">
                            {u.phone ? `tel: ${u.phone}` : "tel: —"}
                            {u.email ? ` • mail: ${u.email}` : ""}
                          </div>
                          <div className="truncate">
                            konum: {[u.city, u.district].filter(Boolean).join(" / ") || "—"}
                          </div>
                          <div className="truncate">rol: {u.role || "—"}</div>
                          <div>created: {fmt(u.created_at)}</div>
                          <div>last_seen: {fmt(u.last_seen_at)}</div>
                          {premium ? <div>premium_until: {fmt(u.premium_until)}</div> : null}
                          {banned ? <div>banned_until: {fmt(u.banned_until)}</div> : null}
                        </div>

                        {u.ban_reason ? (
                          <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-200">
                            Ban sebebi: {u.ban_reason}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid shrink-0 gap-2 sm:grid-cols-3 xl:w-[360px]">
                      <Link
                        href={`/admin/users/${encodeURIComponent(u.id)}`}
                        className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-center text-xs font-black hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                      >
                        Detay →
                      </Link>

                      <button
                        disabled={busy}
                        onClick={() => togglePremium(u)}
                        className={clsx(
                          "rounded-2xl px-4 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60",
                          premium
                            ? "border border-black/10 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                            : "bg-emerald-500 text-black hover:bg-emerald-400"
                        )}
                      >
                        {busy ? "..." : premium ? "Premium Kapat" : "Premium Aç"}
                      </button>

                      <button
                        disabled={busy}
                        onClick={() => toggleBan(u)}
                        className={clsx(
                          "rounded-2xl px-4 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60",
                          banned
                            ? "border border-black/10 bg-white/80 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                            : "bg-rose-600 text-white hover:bg-rose-500"
                        )}
                      >
                        {busy ? "..." : banned ? "Unban" : "Ban"}
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