"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type VConv = {
  conversation_id: string;
  viewer_id: string;
  peer_id: string | null;

  pinned: boolean | null;
  archived: boolean | null;
  muted: boolean | null;

  title: string | null;
  avatar_url: string | null;
  listing_id: string | null;
  updated_at: string | null;

  peer_full_name: string | null;
  peer_company_name: string | null;
  peer_avatar_url: string | null;
  peer_is_online: boolean | null;
  peer_last_seen_at: string | null;

  last_message_id: number | null;
  last_body: string | null;
  last_type: string | null;
  last_media_url: string | null;
  last_created_at: string | null;

  unread_count: number | null;
};

function isUuid(v?: string | null) {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v).trim()
  );
}

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

function initials(name?: string | null) {
  const v = safeStr(name);
  if (!v) return "HA";
  return (
    v
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "HA"
  );
}

function timeAgoShort(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (day > 0) return `${day}g`;
  if (hr > 0) return `${hr}s`;
  if (min > 0) return `${min}dk`;
  return "az önce";
}

function previewText(row: VConv) {
  const t = safeStr(row.last_type || "text").toLowerCase();

  if (t === "image") return "📷 Fotoğraf";
  if (t === "video") return "🎬 Video";
  if (t === "audio") return "🎤 Ses";
  if (t === "file") return "📎 Dosya";

  return safeStr(row.last_body) || "Henüz mesaj yok";
}

function peerName(row: VConv) {
  return (
    safeStr(row.peer_company_name) ||
    safeStr(row.peer_full_name) ||
    safeStr(row.title) ||
    "Kullanıcı"
  );
}

export default function ConversationsClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<VConv[]>([]);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [q, setQ] = useState("");

  const chRef = useRef<RealtimeChannel | null>(null);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  function scheduleReload() {
    if (reloadTimerRef.current) return;

    reloadTimerRef.current = setTimeout(() => {
      reloadTimerRef.current = null;
      load();
    }, 350);
  }

  async function ensureSession(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;

    if (!uid) {
      router.replace(`/auth?next=${encodeURIComponent("/conversations")}`);
      return null;
    }

    setMyId(uid);
    return uid;
  }

  async function load() {
    setLoading(true);

    try {
      const uid = await ensureSession();
      if (!uid) return;

      const { data, error } = await supabase
        .from("v_conversations")
        .select("*")
        .eq("viewer_id", uid)
        .order("last_created_at", { ascending: false });

      if (error) throw error;

      const cleaned = (data ?? [])
        .map((r: any) => ({
          ...r,
          conversation_id: safeStr(r.conversation_id),
          peer_id: safeStr(r.peer_id) || null,
          pinned: !!r.pinned,
          archived: !!r.archived,
          muted: !!r.muted,
          peer_is_online: !!r.peer_is_online,
        }))
        .filter((r: any) => isUuid(r.peer_id));

      if (!mountedRef.current) return;
      setRows(cleaned as VConv[]);
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Sohbetler yüklenemedi",
        message: e?.message ?? "Bir hata oluştu.",
      });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function upsertSetting(
    peerId: string,
    patch: Partial<Pick<VConv, "archived" | "pinned" | "muted">>
  ) {
    const uid = myId;
    const pid = safeStr(peerId);

    if (!uid || !isUuid(pid)) return;

    const current = rows.find((x) => safeStr(x.peer_id) === pid);

    const next = {
      archived: patch.archived ?? current?.archived ?? false,
      pinned: patch.pinned ?? current?.pinned ?? false,
      muted: patch.muted ?? current?.muted ?? false,
    };

    setRows((prev) =>
      prev.map((r) =>
        safeStr(r.peer_id) === pid
          ? {
              ...r,
              archived: next.archived,
              pinned: next.pinned,
              muted: next.muted,
            }
          : r
      )
    );

    const { error } = await supabase.from("conversation_settings").upsert(
      {
        user_id: uid,
        peer_id: pid,
        archived: next.archived,
        pinned: next.pinned,
        muted: next.muted,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,peer_id",
      }
    );

    if (error) {
      toast({
        variant: "error",
        title: "Kaydedilemedi",
        message: error.message,
      });
      await load();
    }
  }

  function openChat(row: VConv) {
    const peerId = safeStr(row.peer_id);

    if (!isUuid(peerId)) {
      toast({
        variant: "error",
        title: "Sohbet açılamadı",
        message: "Karşı kullanıcı bilgisi geçersiz.",
      });
      return;
    }

    router.push(`/chat/user/${encodeURIComponent(peerId)}`);
  }

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const uid = await ensureSession();
      if (!uid) return;

      if (chRef.current) {
        supabase.removeChannel(chRef.current);
      }

      const ch = supabase.channel("halapp-conversations-premium");

      ch.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => scheduleReload()
      );

      ch.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_settings",
          filter: `user_id=eq.${uid}`,
        },
        () => scheduleReload()
      );

      ch.subscribe();
      chRef.current = ch;
    })();

    return () => {
      mountedRef.current = false;

      if (chRef.current) {
        supabase.removeChannel(chRef.current);
      }

      chRef.current = null;

      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }

      reloadTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("tr-TR");

    const base = rows.filter((r) =>
      tab === "archived" ? !!r.archived : !r.archived
    );

    const searched = !needle
      ? base
      : base.filter((r) => {
          const name = peerName(r).toLocaleLowerCase("tr-TR");
          const body = previewText(r).toLocaleLowerCase("tr-TR");
          return name.includes(needle) || body.includes(needle);
        });

    return searched.sort((a, b) => {
      const pinnedSort = Number(!!b.pinned) - Number(!!a.pinned);
      if (pinnedSort !== 0) return pinnedSort;

      const aTime = a.last_created_at
        ? new Date(a.last_created_at).getTime()
        : 0;
      const bTime = b.last_created_at
        ? new Date(b.last_created_at).getTime()
        : 0;

      return bTime - aTime;
    });
  }, [rows, tab, q]);

  const activeCount = rows.filter((r) => !r.archived).length;
  const archivedCount = rows.filter((r) => !!r.archived).length;
  const unreadTotal = rows.reduce(
    (sum, r) => sum + Number(r.unread_count ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-[36px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-white to-teal-500/10 p-6 shadow-sm dark:via-zinc-950 dark:from-emerald-500/10 dark:to-teal-950/20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
              HalApp Mesaj Merkezi
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-950 dark:text-white">
              Mesajlar
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-zinc-600 dark:text-white/60">
              Alıcı ve satıcı görüşmelerini tek yerden yönet. Sabitle, sessize
              al, arşivle ve hızlıca sohbete devam et.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white/80 px-5 text-sm font-black text-zinc-800 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
          >
            ← Ana sayfa
          </Link>
        </div>

        <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-3">
          <MiniStat label="Aktif Sohbet" value={String(activeCount)} icon="💬" />
          <MiniStat label="Okunmamış" value={String(unreadTotal)} icon="🔔" />
          <MiniStat label="Arşiv" value={String(archivedCount)} icon="🗂️" />
        </div>
      </section>

      <section className="rounded-[32px] border border-zinc-200 bg-white/85 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔎
            </span>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Sohbet ara, kişi veya son mesaj..."
              className="h-13 w-full rounded-2xl border border-zinc-200 bg-white px-12 text-sm font-bold outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
          </div>

          <div className="flex shrink-0 rounded-2xl border border-zinc-200 bg-zinc-100 p-1 dark:border-white/10 dark:bg-white/[0.05]">
            <button
              type="button"
              onClick={() => setTab("active")}
              className={[
                "h-11 rounded-xl px-5 text-sm font-black transition",
                tab === "active"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "text-zinc-600 hover:bg-white dark:text-white/60 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Sohbetler
            </button>

            <button
              type="button"
              onClick={() => setTab("archived")}
              className={[
                "h-11 rounded-xl px-5 text-sm font-black transition",
                tab === "archived"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "text-zinc-600 hover:bg-white dark:text-white/60 dark:hover:bg-white/10",
              ].join(" ")}
            >
              Arşiv
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[34px] border border-zinc-200 bg-white/85 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
        {loading ? (
          <LoadingList />
        ) : filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const peerId = safeStr(r.peer_id);
              const okPeer = isUuid(peerId);
              const name = peerName(r);
              const unread = Number(r.unread_count ?? 0);
              const lastTime = timeAgoShort(r.last_created_at);
              const avatar = r.peer_avatar_url || r.avatar_url;

              return (
                <div
                  key={r.conversation_id}
                  className="group rounded-[28px] border border-zinc-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <button
                      type="button"
                      disabled={!okPeer}
                      onClick={() => openChat(r)}
                      className={[
                        "flex min-w-0 flex-1 items-center gap-4 rounded-2xl p-2 text-left transition",
                        okPeer
                          ? "cursor-pointer hover:bg-emerald-500/5"
                          : "cursor-not-allowed opacity-60",
                      ].join(" ")}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 ring-1 ring-black/10 dark:ring-white/10">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                            {initials(name)}
                          </div>
                        )}

                        {r.peer_is_online ? (
                          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400 shadow-[0_0_14px_rgba(16,185,129,.8)] dark:border-zinc-950" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-base font-black text-zinc-950 dark:text-white">
                              {name}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {r.pinned ? <Badge text="Sabit" icon="📌" /> : null}
                              {r.muted ? <Badge text="Sessiz" icon="🔕" /> : null}
                              {r.peer_is_online ? (
                                <Badge text="Online" icon="🟢" />
                              ) : null}
                            </div>
                          </div>

                          <div className="shrink-0 text-xs font-black text-zinc-400">
                            {lastTime}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="min-w-0 truncate text-sm font-semibold text-zinc-500 dark:text-white/50">
                            {previewText(r)}
                          </div>

                          {unread > 0 ? (
                            <span className="shrink-0 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-black text-white">
                              {unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2 md:pl-2">
                      <ActionButton
                        disabled={!okPeer}
                        active={!!r.pinned}
                        label={r.pinned ? "Sabit ✓" : "Sabit"}
                        onClick={() => upsertSetting(peerId, { pinned: !r.pinned })}
                      />

                      <ActionButton
                        disabled={!okPeer}
                        active={!!r.muted}
                        label={r.muted ? "Sessiz ✓" : "Sessiz"}
                        onClick={() => upsertSetting(peerId, { muted: !r.muted })}
                      />

                      <button
                        type="button"
                        disabled={!okPeer}
                        onClick={() =>
                          upsertSetting(peerId, { archived: !r.archived })
                        }
                        className="rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-black text-white transition hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {r.archived ? "Çıkar" : "Arşivle"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/75 p-4 backdrop-blur-xl dark:bg-white/[0.05]">
      <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-white/40">
        {icon} {label}
      </div>
      <div className="mt-2 text-3xl font-black text-zinc-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
      {icon} {text}
    </span>
  );
}

function ActionButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-2xl border px-4 py-3 text-xs font-black transition disabled:opacity-50",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-black/20 dark:text-white/70 dark:hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function LoadingList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-[28px] bg-zinc-100 dark:bg-white/[0.06]"
        />
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: "active" | "archived" }) {
  return (
    <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-6xl">{tab === "archived" ? "🗂️" : "💬"}</div>
      <h3 className="mt-4 text-2xl font-black text-zinc-950 dark:text-white">
        {tab === "archived" ? "Arşivde sohbet yok" : "Henüz sohbet yok"}
      </h3>
      <p className="mt-2 text-sm font-semibold text-zinc-500 dark:text-white/50">
        {tab === "archived"
          ? "Arşivlediğin görüşmeler burada görünür."
          : "Alıcı veya satıcıyla mesajlaştığında sohbetler burada listelenir."}
      </p>
    </div>
  );
}