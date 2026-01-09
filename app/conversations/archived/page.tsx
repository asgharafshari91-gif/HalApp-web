"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

function previewText(row: ConvRow) {
  const t = (row.last_type ?? "text").toLowerCase();
  if (t === "image") return "📷 Fotoğraf";
  if (t === "video") return "🎬 Video";
  if (t === "audio") return "🎤 Ses";
  if (t === "file") return "📎 Dosya";
  return (row.last_body ?? "").trim() || "—";
}

export default function ArchivedConversationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<ConvRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, MiniProfile>>({});
  const [settings, setSettings] = useState<Record<string, ConvSettings>>({});

  async function load() {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;
      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/conversations/archived")}`);
        return;
      }
      setMyId(uid);

      const { data, error } = await supabase
        .from("v_conversations")
        .select(
          "u1,u2,last_message_id,last_body,last_type,last_media_url,last_created_at,unread_count,viewer_id"
        )
        .eq("viewer_id", uid)
        .order("last_created_at", { ascending: false });

      if (error) throw error;
      const list: ConvRow[] = (data ?? []) as ConvRow[];
      setRows(list);

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

        const { data: ss, error: se } = await supabase
          .from("conversation_settings")
          .select("peer_id,pinned,archived,muted")
          .eq("user_id", uid)
          .in("peer_id", ids);
        if (se) throw se;

        const smap: Record<string, ConvSettings> = {};
        (ss ?? []).forEach((x: any) => {
          smap[String(x.peer_id)] = {
            pinned: !!x.pinned,
            archived: !!x.archived,
            muted: !!x.muted,
          };
        });
        setSettings(smap);
      } else {
        setProfiles({});
        setSettings({});
      }
    } catch (e: any) {
      toast({ variant: "error", title: "Arşiv yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  async function unarchive(peerId: string) {
    const uid = myId;
    if (!uid) return;

    const cur = settings[peerId] ?? { pinned: false, archived: true, muted: false };

    setSettings((prev) => ({ ...prev, [peerId]: { ...cur, archived: false } }));

    const { error } = await supabase.from("conversation_settings").upsert(
      {
        user_id: uid,
        peer_id: peerId,
        pinned: cur.pinned,
        archived: false,
        muted: cur.muted,
      },
      { onConflict: "user_id,peer_id" }
    );

    if (error) {
      setSettings((prev) => ({ ...prev, [peerId]: cur }));
      toast({ variant: "error", title: "Kaydedilemedi", message: error.message });
      return;
    }

    toast({ variant: "success", title: "Arşivden çıkarıldı", message: "Sohbet geri taşındı." });
    load();
  }

  const archived = useMemo(() => {
    const uid = myId;
    if (!uid) return [];
    return rows
      .map((r) => {
        const peerId = r.u1 === uid ? r.u2 : r.u1;
        const s = settings[peerId];
        return { r, peerId, s };
      })
      .filter((x) => x.s?.archived)
      .sort((a, b) => {
        const ta = a.r.last_created_at ? new Date(a.r.last_created_at).getTime() : 0;
        const tb = b.r.last_created_at ? new Date(b.r.last_created_at).getTime() : 0;
        return tb - ta;
      });
  }, [rows, settings, myId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Arşiv</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Arşive aldığın sohbetler burada.
          </div>
        </div>

        <Link
          href="/conversations"
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
        >
          ← Geri
        </Link>
      </div>

      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : archived.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">
            Arşivde sohbet yok.
          </div>
        ) : (
          <div className="space-y-2">
            {archived.map(({ r, peerId }) => {
              const p = profiles[peerId];
              const name =
                (p?.company_name?.trim() ? p.company_name : p?.full_name) ?? "Kullanıcı";
              const unread = Number(r.unread_count ?? 0);

              return (
                <div
                  key={`${r.u1}-${r.u2}`}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <Link href={`/chat/user/${peerId}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30">
                      {p?.avatar_url ? (
                        <img src={p.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                          {initials(name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">
                          {name}
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
                  </Link>

                  <button
                    type="button"
                    onClick={() => unarchive(peerId)}
                    className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
                  >
                    Çıkar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}