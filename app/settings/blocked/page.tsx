"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

const LS_BLOCK = "halapp_block_seller_ids_v1";
const EVT_LOCAL_UPDATED = "halapp:local-filters-updated";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function bust(url: string) {
  if (!url) return "";
  const hasQ = url.includes("?");
  return `${url}${hasQ ? "&" : "?"}t=${Date.now()}`;
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

function safeText(v: any, fallback = "—") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

function readLSSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    const out = new Set<string>();
    if (Array.isArray(arr)) {
      for (const v of arr) {
        const s = String(v ?? "").trim();
        if (s) out.add(s);
      }
    }
    return out;
  } catch {
    return new Set();
  }
}

function writeLSSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {}
}

function removeFromLocalBlocked(blockedId: string) {
  try {
    const set = readLSSet(LS_BLOCK);
    set.delete(String(blockedId));
    writeLSSet(LS_BLOCK, set);
    window.dispatchEvent(new Event(EVT_LOCAL_UPDATED));
  } catch {}
}

function clearLocalBlocked() {
  try {
    writeLSSet(LS_BLOCK, new Set());
    window.dispatchEvent(new Event(EVT_LOCAL_UPDATED));
  } catch {}
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-black">{title}</div>
          {desc ? (
            <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">
              {desc}
            </div>
          ) : null}
        </div>

        <Link
          href="/settings"
          className="rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
        >
          ← Ayarlar
        </Link>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

type PublicProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  public_id: string | null;
  city: string | null;
  district: string | null;
  account_type: string;
  is_premium: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string | null;
};

type RowUI = BlockRow & {
  profile: PublicProfile | null;
};

export default function BlockedUsersPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [rows, setRows] = useState<RowUI[]>([]);

  const title = useMemo(() => {
    return rows.length ? `Engellenen Satıcılar (${rows.length})` : "Engellenen Satıcılar";
  }, [rows.length]);

  async function ensureAuth() {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id ?? null;
    if (!id) {
      router.replace(`/auth?next=${encodeURIComponent("/settings/blocked")}`);
      return null;
    }
    return id;
  }

  async function load() {
    setLoading(true);
    try {
      const id = await ensureAuth();
      if (!id) return;
      setUid(id);

      // 1) DB blocks
      const { data: blocks, error: e1 } = await supabase
        .from("user_blocks")
        .select("blocker_id, blocked_id, created_at")
        .eq("blocker_id", id)
        .order("created_at", { ascending: false });

      if (e1) throw e1;

      const list = (blocks ?? []) as BlockRow[];

      // 2) local blocked (LiveCard’de kullandığın)
      const localSet = readLSSet(LS_BLOCK);
      const localOnly = Array.from(localSet).filter(
        (bid) => !list.some((x) => x.blocked_id === bid)
      );

      const merged: BlockRow[] = [
        ...list,
        ...localOnly.map((bid) => ({
          blocker_id: id,
          blocked_id: bid,
          created_at: new Date().toISOString(), // local’a tarih uyduruyoruz (UI için)
        })),
      ];

      if (merged.length === 0) {
        setRows([]);
        return;
      }

      const blockedIds = merged.map((x) => x.blocked_id);

      // 3) public profilleri getir (VIEW)
      const { data: profs, error: e2 } = await supabase
        .from("profiles_public")
        .select(
          "id, full_name, company_name, avatar_url, public_id, city, district, account_type, is_premium, is_online, last_seen_at, created_at"
        )
        .in("id", blockedIds);

      if (e2) throw e2;

      const map = new Map<string, PublicProfile>();
      (profs ?? []).forEach((p: any) => map.set(p.id, p as PublicProfile));

      setRows(
        merged.map((b) => ({
          ...b,
          profile: map.get(b.blocked_id) ?? null,
        }))
      );
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Yüklenemedi",
        message: e?.message ?? "Hata oluştu.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unblock(blockedId: string) {
    if (!uid) return;
    const key = `${uid}:${blockedId}`;
    setBusyKey(key);

    try {
      // ✅ DB’den sil (varsa)
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", uid)
        .eq("blocked_id", blockedId);

      // DB’de yoksa da sorun değil (local-only olabilir)
      if (error) {
        // bazen RLS/permission hatası olabilir; yine de local’i temizleyelim ama kullanıcı bilsin
        console.warn("unblock db error:", error);
      }

      // ✅ local’den kaldır
      removeFromLocalBlocked(blockedId);

      // ✅ UI
      setRows((prev) => prev.filter((x) => x.blocked_id !== blockedId));

      toast({
        variant: "success",
        title: "Kaldırıldı",
        message: "Engel kaldırıldı.",
        durationMs: 1200,
      });
    } catch (e: any) {
      toast({ variant: "error", title: "Kaldırılamadı", message: e?.message ?? "Hata" });
    } finally {
      setBusyKey(null);
    }
  }

  async function unblockAll() {
    if (!uid) return;
    const key = `${uid}:ALL`;
    setBusyKey(key);

    try {
      // DB toplu sil
      const { error } = await supabase.from("user_blocks").delete().eq("blocker_id", uid);
      if (error) console.warn("unblockAll db error:", error);

      // local temizle
      clearLocalBlocked();

      setRows([]);
      toast({
        variant: "success",
        title: "Temizlendi",
        message: "Tüm engeller kaldırıldı.",
        durationMs: 1200,
      });
    } catch (e: any) {
      toast({ variant: "error", title: "Olmadı", message: e?.message ?? "Hata" });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card title={title} desc="Engellediğin satıcılar burada görünür. İstersen engeli kaldırabilirsin.">
        {/* top actions */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-black/55 dark:text-white/55">
            Not: Engel hem DB (<code>user_blocks</code>) hem de local (cihaz) olarak tutulabilir.
          </div>

          {rows.length > 0 ? (
            <button
              type="button"
              onClick={unblockAll}
              disabled={busyKey === `${uid}:ALL`}
              className={clsx(
                "inline-flex items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-2 text-xs font-extrabold text-rose-700 hover:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/15 transition",
                busyKey === `${uid}:ALL` && "opacity-70 cursor-not-allowed"
              )}
            >
              {busyKey === `${uid}:ALL` ? "İşleniyor…" : "Tüm engelleri kaldır"}
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm font-semibold text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Yükleniyor…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-semibold text-black/70 dark:text-white/70">
            Şu an engellediğin kimse yok.
          </div>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => {
              const p = r.profile;
              const name =
                (p?.company_name?.trim() || p?.full_name?.trim() || "Kullanıcı") ?? "Kullanıcı";
              const sub = p?.public_id ? `@${p.public_id}` : `UserId: ${r.blocked_id}`;
              const loc = [p?.city, p?.district].filter(Boolean).join(" / ");
              const isBusy = busyKey === `${uid}:${r.blocked_id}`;

              return (
                <div
                  key={`${r.blocker_id}-${r.blocked_id}`}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-3xl ring-1 ring-black/10 bg-black/5 dark:ring-white/10 dark:bg-white/5">
                      {p?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={bust(p.avatar_url)} alt={name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                          {initials(name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-black/90 dark:text-white/90">
                        {name}
                      </div>
                      <div className="mt-0.5 text-xs text-black/55 dark:text-white/55 truncate">
                        {sub}
                        {loc ? ` • ${loc}` : ""}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-black/45 dark:text-white/45">
                        <span>
                          Engellendi:{" "}
                          {new Date(r.created_at).toLocaleString("tr-TR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>

                        {p ? (
                          <span className="rounded-full border border-black/10 bg-black/5 px-2 py-0.5 dark:border-white/10 dark:bg-white/5">
                            {p.is_online ? "Online" : "Offline"}
                          </span>
                        ) : null}

                        {p?.is_premium ? (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-amber-900 dark:text-amber-200">
                            Premium
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {p?.id ? (
                      <Link
                        href={`/profile/${p.id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                      >
                        Profili →
                      </Link>
                    ) : null}

                    <button
                      onClick={() => unblock(r.blocked_id)}
                      disabled={isBusy}
                      className={clsx(
                        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-xs font-black transition",
                        "bg-rose-500 text-white hover:bg-rose-400",
                        isBusy && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isBusy ? "İşleniyor…" : "Engeli Kaldır"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-black/10 bg-black/5 p-4 text-xs text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60 leading-6">
          <b>Not:</b> Bu sayfa DB’den <code>user_blocks</code> kayıtlarını çeker, ayrıca cihazda tutulan local engelleri
          (<code>{LS_BLOCK}</code>) de gösterir. Engel kaldırınca ikisi de temizlenir ve{" "}
          <code>{EVT_LOCAL_UPDATED}</code> olayı tetiklenir.
        </div>
      </Card>
    </div>
  );
}