"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type NotifRow = {
  id: string;
  user_id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  link_url: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function timeAgoShort(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}g`;
  if (hr > 0) return `${hr}s`;
  if (min > 0) return `${min}dk`;
  return "az önce";
}

function safeFilter(v: string | null) {
  // /notifications?f=all|unread
  if (!v) return "all";
  if (!["all", "unread"].includes(v)) return "all";
  return v as "all" | "unread";
}

export default function NotificationsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  const filter = useMemo(() => safeFilter(sp.get("f")), [sp]);

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<NotifRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;

      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/notifications")}`);
        return;
      }
      setMyId(uid);

      let q = supabase
        .from("notifications")
        .select("id,user_id,title,body,type,link_url,is_read,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (filter === "unread") {
        q = q.eq("is_read", false);
      }

      const { data, error } = await q;
      if (error) throw error;

      setRows((data ?? []) as NotifRow[]);
    } catch (e: any) {
      toast({ variant: "error", title: "Bildirimler yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    const uid = myId;
    if (!uid) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", uid)
        .eq("is_read", false);

      if (error) throw error;

      toast({ variant: "success", title: "Tamam", message: "Tüm bildirimler okundu." });
      load();
    } catch (e: any) {
      toast({ variant: "error", title: "Kaydedilemedi", message: e?.message ?? "Hata oluştu." });
    }
  }

  async function markOneRead(id: string) {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    } catch (e: any) {
      toast({ variant: "error", title: "Kaydedilemedi", message: e?.message ?? "Hata oluştu." });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const unreadCount = useMemo(() => rows.filter((x) => !x.is_read).length, [rows]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Bildirimler</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            {filter === "unread" ? "Okunmamış bildirimler" : "Tüm bildirimler"}{" "}
            {unreadCount > 0 ? <b>({unreadCount} okunmamış)</b> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications?f=all"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              filter === "all"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            Tümü
          </Link>

          <Link
            href="/notifications?f=unread"
            className={clsx(
              "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
              filter === "unread"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
            )}
          >
            Okunmamış
          </Link>

          <button
            onClick={markAllRead}
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            Hepsini Oku
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Bildirim yok.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((n) => {
              const title = n.title?.trim() || "Bildirim";
              const body = n.body?.trim() || "";
              const href = (n.link_url ?? "").trim();

              return (
                <div
                  key={n.id}
                  className={clsx(
                    "rounded-2xl border p-3 transition",
                    n.is_read
                      ? "border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5"
                      : "border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-400/20 dark:bg-emerald-400/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">{title}</div>
                      {body ? (
                        <div className="mt-1 text-xs text-black/60 dark:text-white/60 leading-5">{body}</div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-xs text-black/50 dark:text-white/50">{timeAgoShort(n.created_at)}</div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => markOneRead(n.id)}
                        className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-extrabold text-black/75 hover:bg-white transition dark:border-white/10 dark:bg-black/30 dark:text-white/80 dark:hover:bg-black/20"
                      >
                        Aç
                      </Link>
                    ) : null}

                    {!n.is_read ? (
                      <button
                        onClick={() => markOneRead(n.id)}
                        className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-black hover:bg-emerald-400 transition"
                      >
                        Okundu
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}