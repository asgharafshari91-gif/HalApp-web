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
  const s = String(v).trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

function safeStr(v: any) {
  return String(v ?? "").trim();
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
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

function previewText(row: VConv) {
  const t = (row.last_type ?? "text").toLowerCase();
  if (t === "image") return "📷 Fotoğraf";
  if (t === "video") return "🎬 Video";
  if (t === "audio") return "🎤 Ses";
  if (t === "file") return "📎 Dosya";
  return (row.last_body ?? "").trim() || "—";
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
    const { data: s } = await supabase.auth.getSession();
    const uid = s.session?.user?.id ?? null;

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

      // ✅ peer_id: null/""/uuid değilse UI'ye hiç alma
      const cleaned = (data ?? [])
        .map((r: any) => ({
          ...r,
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
        message: e?.message ?? "Hata oluştu.",
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
    if (!uid) return;

    const pid = safeStr(peerId);
    if (!isUuid(pid)) {
      toast({
        variant: "error",
        title: "Kaydedilemedi",
        message: `Geçersiz peer_id: '${pid}'`,
      });
      return;
    }

    const current = rows.find((x) => safeStr(x.peer_id) === pid);

    const next = {
      archived: patch.archived ?? current?.archived ?? false,
      pinned: patch.pinned ?? current?.pinned ?? false,
      muted: patch.muted ?? current?.muted ?? false,
    };

    // ✅ optimistik
    setRows((prev) =>
      prev.map((r) =>
        safeStr(r.peer_id) === pid
          ? { ...r, ...patch, archived: next.archived, pinned: next.pinned, muted: next.muted }
          : r
      )
    );

    const { error } = await supabase
      .from("conversation_settings")
      .upsert(
        {
          user_id: uid,
          peer_id: pid,
          archived: !!next.archived,
          pinned: !!next.pinned,
          muted: !!next.muted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,peer_id" }
      );

    if (error) {
      toast({ variant: "error", title: "Kaydedilemedi", message: error.message });
      await load();
    }
  }

  // ✅ realtime subscribe (messages + settings)
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      const uid = await ensureSession();
      if (!uid) return;

      if (chRef.current) supabase.removeChannel(chRef.current);

      const ch = supabase.channel("halapp-conversations");

      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
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
      if (chRef.current) supabase.removeChannel(chRef.current);
      chRef.current = null;
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const base = rows.filter((r) =>
      tab === "archived" ? !!r.archived : !r.archived
    );

    const withSearch = !needle
      ? base
      : base.filter((r) => {
          const name =
            (r.peer_company_name?.trim()
              ? r.peer_company_name
              : r.peer_full_name) ?? "";
          return name.toLowerCase().includes(needle);
        });

    return withSearch.sort((a, b) => {
      const p = Number(!!b.pinned) - Number(!!a.pinned);
      if (p !== 0) return p;
      const ta = a.last_created_at ? new Date(a.last_created_at).getTime() : 0;
      const tb = b.last_created_at ? new Date(b.last_created_at).getTime() : 0;
      return tb - ta;
    });
  }, [rows, tab, q]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* header */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl font-black tracking-tight">Mesajlar</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            WhatsApp / Sahibinden mantığı: pinned + arşiv.
          </div>
        </div>

        <Link
          href="/"
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
        >
          ← Ana sayfa
        </Link>
      </div>

      {/* search + tabs */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sohbet ara…"
            className="h-11 w-full rounded-2xl border border-black/10 bg-white/70 px-4 text-sm font-semibold outline-none focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/30 dark:text-white"
          />

          <div className="flex shrink-0 rounded-2xl border border-black/10 bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab("active")}
              className={`h-9 rounded-xl px-4 text-sm font-extrabold transition ${
                tab === "active"
                  ? "bg-emerald-500 text-black"
                  : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
              }`}
            >
              Sohbetler
            </button>
            <button
              type="button"
              onClick={() => setTab("archived")}
              className={`h-9 rounded-xl px-4 text-sm font-extrabold transition ${
                tab === "archived"
                  ? "bg-emerald-500 text-black"
                  : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
              }`}
            >
              Arşiv
            </button>
          </div>
        </div>
      </div>

      {/* list */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">
            Yükleniyor…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">
            {tab === "archived" ? "Arşivde sohbet yok." : "Henüz sohbet yok."}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => {
              const peerId = safeStr(r.peer_id);
              const okPeer = isUuid(peerId);

              const name =
                (r.peer_company_name?.trim()
                  ? r.peer_company_name
                  : r.peer_full_name) ?? "Kullanıcı";

              const unread = Number(r.unread_count ?? 0);

              return (
                <div
                  key={r.conversation_id}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  {/* SOL (open chat) */}
                  <button
                    type="button"
                    disabled={!okPeer}
                    className={`flex min-w-0 flex-1 items-center gap-3 text-left transition ${
                      okPeer
                        ? "cursor-pointer hover:opacity-95"
                        : "cursor-not-allowed opacity-60"
                    }`}
                    onClick={() => {
                      if (!okPeer) {
                        toast({
                          variant: "error",
                          title: "Sohbet açılamadı",
                          message: `Geçersiz kullanıcı id: '${peerId}'`,
                        });
                        return;
                      }
                      // ✅ encode: Safari/Next edge-case
                      router.push(`/chat/user/${encodeURIComponent(peerId)}`);
                    }}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                      {r.peer_avatar_url ? (
                        <img
                          src={r.peer_avatar_url}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                          {initials(name)}
                        </div>
                      )}
                      {r.peer_is_online ? (
                        <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">
                          {name}
                          {!!r.pinned ? (
                            <span className="ml-2 text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                              • Sabit
                            </span>
                          ) : null}
                          {!!r.muted ? (
                            <span className="ml-2 text-[11px] font-black text-black/40 dark:text-white/40">
                              • Sessiz
                            </span>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-xs text-black/50 dark:text-white/50">
                          {timeAgoShort(r.last_created_at)}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate text-xs text-black/60 dark:text-white/60">
                          {previewText(r)}
                        </div>

                        {unread > 0 ? (
                          <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-black text-black">
                            {unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>

                  {/* SAĞ AKSİYONLAR */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!okPeer}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!okPeer) return;
                        upsertSetting(peerId, { pinned: !r.pinned });
                      }}
                      className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/20"
                    >
                      {!!r.pinned ? "Sabit ✓" : "Sabit"}
                    </button>

                    <button
                      type="button"
                      disabled={!okPeer}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!okPeer) return;
                        upsertSetting(peerId, { muted: !r.muted });
                      }}
                      className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/20"
                    >
                      {!!r.muted ? "Sessiz ✓" : "Sessiz"}
                    </button>

                    <button
                      type="button"
                      disabled={!okPeer}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!okPeer) return;
                        upsertSetting(peerId, { archived: !r.archived });
                      }}
                      className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-black hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {!!r.archived ? "Çıkar" : "Arşivle"}
                    </button>
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