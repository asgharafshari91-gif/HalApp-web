"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type ConvRow = {
  u1: string;
  u2: string;
  last_message_id: number | null;
  last_body: string | null;
  last_type: string | null;
  last_media_url: string | null;
  last_created_at: string | null;
  unread_count: number | null;
  viewer_id: string | null;
};

type MiniProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_online?: boolean | null;
  last_seen_at?: string | null;
};

type ConvSettings = {
  pinned: boolean;
  archived: boolean;
  muted: boolean;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

function bust(url?: string | null) {
  const u = (url ?? "").trim();
  if (!u) return "";
  const hasQ = u.includes("?");
  return `${u}${hasQ ? "&" : "?"}t=${Date.now()}`;
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

function previewText(row: ConvRow) {
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

  const [rows, setRows] = useState<ConvRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, MiniProfile>>({});
  const [settings, setSettings] = useState<Record<string, ConvSettings>>({});

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;

      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/conversations")}`);
        return;
      }

      setMyId(uid);

      // 1) settings (pinned/archived/muted)
      const { data: ss, error: se } = await supabase
        .from("conversation_settings")
        .select("peer_id,pinned,archived,muted")
        .eq("user_id", uid);

      if (se) throw se;

      const smap: Record<string, ConvSettings> = {};
      (ss ?? []).forEach((x: any) => {
        const pid = String(x.peer_id);
        smap[pid] = { pinned: !!x.pinned, archived: !!x.archived, muted: !!x.muted };
      });
      setSettings(smap);

      // 2) conversations (hepsini çekiyoruz; view zaten viewer_id filtreli)
      const { data, error } = await supabase
        .from("v_conversations")
        .select("u1,u2,last_message_id,last_body,last_type,last_media_url,last_created_at,unread_count,viewer_id")
        .eq("viewer_id", uid)
        .order("last_created_at", { ascending: false });

      if (error) throw error;

      const list: ConvRow[] = (data ?? []) as ConvRow[];
      setRows(list);

      // 3) peer ids
      const ids = Array.from(
        new Set(
          list
            .map((r) => (r.u1 === uid ? r.u2 : r.u1))
            .filter((x): x is string => typeof x === "string" && x.length > 0)
        )
      );

      if (ids.length) {
        const { data: ps, error: pe } = await supabase
          .from("profiles")
          .select("id,full_name,company_name,avatar_url,is_online,last_seen_at")
          .in("id", ids);

        if (pe) throw pe;

        const pmap: Record<string, MiniProfile> = {};
        (ps ?? []).forEach((p: any) => (pmap[p.id] = p as MiniProfile));
        setProfiles(pmap);
      } else {
        setProfiles({});
      }
    } catch (e: any) {
      toast({ variant: "error", title: "Sohbetler yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  async function upsertSetting(peerId: string, patch: Partial<ConvSettings>) {
    const uid = myId;
    if (!uid) return;

    const cur: ConvSettings = settings[peerId] ?? { pinned: false, archived: false, muted: false };
    const next: ConvSettings = { ...cur, ...patch };

    setSettings((prev) => ({ ...prev, [peerId]: next }));

    const { error } = await supabase
      .from("conversation_settings")
      .upsert(
        {
          user_id: uid,
          peer_id: peerId,
          pinned: next.pinned,
          archived: next.archived,
          muted: next.muted,
        },
        { onConflict: "user_id,peer_id" }
      );

    if (error) {
      setSettings((prev) => ({ ...prev, [peerId]: cur }));
      toast({ variant: "error", title: "Kaydedilemedi", message: error.message });
      return;
    }

    if (patch.archived === true) {
      toast({ variant: "success", title: "Arşive alındı", message: "Sohbet arşive taşındı." });
    }
    if (patch.archived === false) {
      toast({ variant: "success", title: "Arşivden çıkarıldı", message: "Sohbet geri taşındı." });
    }
  }

  function setupRealtime(uid: string) {
    // önce varsa kapat
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const ch = supabase.channel(`rt_conversations_${uid}`);

    // messages değişirse (yeni mesaj vs) -> reload
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      () => {
        load();
      }
    );

    // settings değişirse -> reload
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversation_settings", filter: `user_id=eq.${uid}` },
      () => {
        load();
      }
    );

    // profile online/last_seen değişirse -> reload (hafif)
    ch.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles" },
      () => {
        // sadece hızlı yenile
        load();
      }
    );

    ch.subscribe();

    channelRef.current = ch;
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!myId) return;
    setupRealtime(myId);
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const visible = useMemo(() => {
    const uid = myId;
    if (!uid) return [];

    const list = rows
      .map((r) => {
        const peerId = r.u1 === uid ? r.u2 : r.u1;
        const s = settings[peerId] ?? { pinned: false, archived: false, muted: false };
        return { r, peerId, s };
      })
      .filter((x) => !x.s.archived); // ana listede arşiv yok

    // pinned önce
    list.sort((a, b) => {
      const pa = a.s.pinned ? 1 : 0;
      const pb = b.s.pinned ? 1 : 0;
      if (pa !== pb) return pb - pa;

      const ta = a.r.last_created_at ? new Date(a.r.last_created_at).getTime() : 0;
      const tb = b.r.last_created_at ? new Date(b.r.last_created_at).getTime() : 0;
      return tb - ta;
    });

    return list;
  }, [rows, settings, myId]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Sohbetler</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Mesajlar, okunmamışlar, pin ve arşiv yönetimi.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/conversations/archived"
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
          >
            Arşiv
          </Link>

          <Link
            href="/new-chat"
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            + Yeni
          </Link>
        </div>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : visible.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Sohbet yok.</div>
        ) : (
          <div className="space-y-2">
            {visible.map(({ r, peerId, s }) => {
              const p = profiles[peerId];
              const name = (p?.company_name?.trim() ? p.company_name : p?.full_name) ?? "Kullanıcı";
              const unread = Number(r.unread_count ?? 0);

              return (
                <div
                  key={`${r.u1}-${r.u2}`}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <Link href={`/chat/user/${peerId}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                      {p?.avatar_url ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={bust(p.avatar_url)} alt="Avatar" className="h-full w-full object-cover" />
                        </>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                          {initials(name)}
                        </div>
                      )}

                      {/* Online dot */}
                      {p?.is_online ? (
                        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/80 dark:ring-black/60" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">{name}</div>

                          {s.pinned ? (
                            <span className="shrink-0 rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[10px] font-black text-black/70 dark:border-white/10 dark:bg-black/30 dark:text-white/70">
                              📌
                            </span>
                          ) : null}

                          {s.muted ? (
                            <span className="shrink-0 rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[10px] font-black text-black/60 dark:border-white/10 dark:bg-black/30 dark:text-white/60">
                              🔇
                            </span>
                          ) : null}
                        </div>

                        <div className="shrink-0 text-xs text-black/50 dark:text-white/50">
                          {timeAgoShort(r.last_created_at)}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate text-xs text-black/60 dark:text-white/60">{previewText(r)}</div>

                        {unread > 0 ? (
                          <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-black text-black">
                            {unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => upsertSetting(peerId, { pinned: !s.pinned })}
                      className={clsx(
                        "rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black text-black/70 hover:bg-white transition",
                        "dark:border-white/10 dark:bg-black/30 dark:text-white/70 dark:hover:bg-black/20"
                      )}
                      title="Pin"
                    >
                      {s.pinned ? "Unpin" : "Pin"}
                    </button>

                    <button
                      type="button"
                      onClick={() => upsertSetting(peerId, { muted: !s.muted })}
                      className={clsx(
                        "rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black text-black/70 hover:bg-white transition",
                        "dark:border-white/10 dark:bg-black/30 dark:text-white/70 dark:hover:bg-black/20"
                      )}
                      title="Sessize al"
                    >
                      {s.muted ? "Unmute" : "Mute"}
                    </button>

                    <button
                      type="button"
                      onClick={() => upsertSetting(peerId, { archived: true })}
                      className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-black text-black hover:bg-emerald-400 transition"
                      title="Arşivle"
                    >
                      Arşiv
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