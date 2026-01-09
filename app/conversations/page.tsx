"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type ConvRow = {
  conversation_id: string;
  other_id: string;
  other_full_name: string | null;
  other_company_name: string | null;
  other_avatar_url: string | null;
  other_is_online: boolean | null;
  other_last_seen_at: string | null;

  last_message_at: string | null;
  last_message_body: string | null;
  last_message_type: string | null;

  unread_count: number;

  pinned: boolean | null;
  archived: boolean | null;
  muted: boolean | null;
  deleted_at: string | null;
};

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

function timeAgo(iso?: string | null) {
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

function safeName(r: ConvRow) {
  const c = (r.other_company_name ?? "").trim();
  const f = (r.other_full_name ?? "").trim();
  return c || f || "Kullanıcı";
}

function UnreadPill({ n }: { n: number }) {
  if (!n || n <= 0) return null;
  const shown = n > 99 ? "99+" : String(n);
  return (
    <span className="inline-flex items-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white">
      {shown}
    </span>
  );
}

function lastText(r: ConvRow) {
  const t = (r.last_message_type ?? "").toLowerCase();
  if (t === "image") return "📷 Fotoğraf";
  if (t === "video") return "🎬 Video";
  if (t === "audio") return "🎤 Ses";
  return (r.last_message_body ?? "").trim() || "—";
}

function IconBtn({
  title,
  onClick,
  children,
  disabled,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/70 px-2.5 py-2 text-xs font-black text-black/70 hover:bg-white transition",
        "dark:border-white/10 dark:bg-black/30 dark:text-white/75 dark:hover:bg-black/20",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [rows, setRows] = useState<ConvRow[]>([]);

  const [tab, setTab] = useState<"inbox" | "archived" | "trash">("inbox");

  // mobile action sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetRow, setSheetRow] = useState<ConvRow | null>(null);

  const totalUnread = useMemo(() => rows.reduce((a, x) => a + (x.unread_count || 0), 0), [rows]);

  const counts = useMemo(() => {
    const inbox = rows.filter((r) => !r.deleted_at && !r.archived).length;
    const archived = rows.filter((r) => !r.deleted_at && r.archived).length;
    const trash = rows.filter((r) => !!r.deleted_at).length;
    return { inbox, archived, trash };
  }, [rows]);

  const visibleRows = useMemo(() => {
    let list = [...rows];

    if (tab === "trash") {
      list = list.filter((r) => !!r.deleted_at);
    } else if (tab === "archived") {
      list = list.filter((r) => !r.deleted_at && Boolean(r.archived));
    } else {
      list = list.filter((r) => !r.deleted_at && !r.archived);
    }

    // pinned en üst + tarih sırası (trash'te pin önemli değil, ama zarar vermez)
    list.sort((a, b) => {
      const ap = a.pinned ? 1 : 0;
      const bp = b.pinned ? 1 : 0;

      // trash'te pinned sıralama etkisiz
      if (tab !== "trash" && bp !== ap) return bp - ap;

      const at = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bt - at;
    });

    return list;
  }, [rows, tab]);

  async function requireAuthOrRedirect() {
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
      const uid = await requireAuthOrRedirect();
      if (!uid) return;

      const { data, error } = await supabase.rpc("get_conversations_overview", { p_uid: uid });
      if (error) throw error;

      setRows((data ?? []) as ConvRow[]);
    } catch (e: any) {
      toast({ variant: "error", title: "Sohbetler yüklenemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  // ✅ DB: flags update (önce conversation_members dener, olmazsa conversations)
  async function updateFlags(
    conversationId: string,
    patch: Partial<Pick<ConvRow, "pinned" | "archived" | "muted" | "deleted_at">>
  ) {
    if (!myId) return;

    const tryMember = async () => {
      const { error } = await supabase
        .from("conversation_members" as any)
        .update({ ...patch })
        .eq("conversation_id", conversationId)
        .eq("user_id", myId);
      if (error) throw error;
    };

    const tryConversations = async () => {
      const { error } = await supabase.from("conversations").update({ ...patch }).eq("id", conversationId);
      if (error) throw error;
    };

    try {
      await tryMember();
      return;
    } catch {
      // fallback
    }

    await tryConversations();
  }

  function patchLocal(conversationId: string, patch: Partial<ConvRow>) {
    setRows((prev) => prev.map((x) => (x.conversation_id === conversationId ? { ...x, ...patch } : x)));
  }

  async function togglePinned(r: ConvRow) {
    if (r.deleted_at) return;
    try {
      const next = !Boolean(r.pinned);
      patchLocal(r.conversation_id, { pinned: next });
      await updateFlags(r.conversation_id, { pinned: next });
    } catch (e: any) {
      toast({ variant: "error", title: "Pinned değişmedi", message: e?.message ?? "Hata oluştu." });
      load();
    }
  }

  async function toggleArchived(r: ConvRow) {
    if (r.deleted_at) return;
    try {
      const next = !Boolean(r.archived);
      patchLocal(r.conversation_id, { archived: next, pinned: next ? false : r.pinned });
      await updateFlags(r.conversation_id, { archived: next, pinned: next ? false : r.pinned });

      // tab otomatik geçiş
      if (next && tab === "inbox") setTab("archived");
      if (!next && tab === "archived") setTab("inbox");
    } catch (e: any) {
      toast({ variant: "error", title: "Arşiv değişmedi", message: e?.message ?? "Hata oluştu." });
      load();
    }
  }

  async function toggleMuted(r: ConvRow) {
    if (r.deleted_at) return;
    try {
      const next = !Boolean(r.muted);
      patchLocal(r.conversation_id, { muted: next });
      await updateFlags(r.conversation_id, { muted: next });
    } catch (e: any) {
      toast({ variant: "error", title: "Sessiz değişmedi", message: e?.message ?? "Hata oluştu." });
      load();
    }
  }

  async function softDelete(r: ConvRow) {
    if (r.deleted_at) return;
    try {
      const ts = new Date().toISOString();
      patchLocal(r.conversation_id, { deleted_at: ts, pinned: false, archived: false });
      await updateFlags(r.conversation_id, { deleted_at: ts, pinned: false, archived: false });
      toast({ variant: "success", title: "Gizlendi", message: "Sohbet çöp kutusuna taşındı." });
      setSheetOpen(false);
      setTab("trash");
    } catch (e: any) {
      toast({ variant: "error", title: "Silinemedi", message: e?.message ?? "Hata oluştu." });
      load();
    }
  }

  async function restore(r: ConvRow) {
    if (!r.deleted_at) return;
    try {
      patchLocal(r.conversation_id, { deleted_at: null });
      await updateFlags(r.conversation_id, { deleted_at: null });
      toast({ variant: "success", title: "Geri alındı", message: "Sohbet tekrar listede." });
      setSheetOpen(false);
      setTab("inbox");
    } catch (e: any) {
      toast({ variant: "error", title: "Geri alınamadı", message: e?.message ?? "Hata oluştu." });
      load();
    }
  }

  async function markRead(conversationId: string, otherId: string) {
    if (!myId) return;
    patchLocal(conversationId, { unread_count: 0 });

    try {
      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("to_user", myId)
        .eq("from_user", otherId)
        .eq("is_read", false);
    } catch {
      // sessiz
    }
  }

  async function openConversation(r: ConvRow) {
    if (!myId) return;
    if (r.deleted_at) {
      toast({ variant: "info", title: "Çöp Kutusu", message: "Önce geri al, sonra sohbeti aç." });
      return;
    }
    await markRead(r.conversation_id, r.other_id);
    router.push(`/chat/user/${r.other_id}?cid=${encodeURIComponent(r.conversation_id)}`);
  }

  useEffect(() => {
    load();

    const ch1 = supabase
      .channel("conv-msg-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();

    const ch2 = supabase
      .channel("conv-row-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => load())
      .subscribe();

    const ch3 = supabase
      .channel("conv-member-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sheet open/close body scroll
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  function TabBtn({
    value,
    label,
    count,
  }: {
    value: "inbox" | "archived" | "trash";
    label: string;
    count: number;
  }) {
    const active = tab === value;
    return (
      <button
        onClick={() => setTab(value)}
        className={[
          "rounded-2xl px-4 py-2 text-sm font-black transition inline-flex items-center gap-2",
          active
            ? "bg-emerald-500 text-black"
            : "border border-black/10 bg-black/5 text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10",
        ].join(" ")}
      >
        <span>{label}</span>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[11px] font-black",
            active ? "bg-black/15 text-black" : "bg-black/10 text-black/70 dark:bg-white/10 dark:text-white/70",
          ].join(" ")}
        >
          {count}
        </span>
      </button>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black tracking-tight">Mesajlar</div>
          <div className="mt-1 text-sm text-black/60 dark:text-white/60">
            Toplam okunmamış:{" "}
            <span className="font-black text-black/80 dark:text-white/80">{totalUnread}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/live"
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
          >
            Pazar
          </Link>
          <Link
            href="/profile"
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-black hover:bg-emerald-400 transition"
          >
            Profil
          </Link>
        </div>
      </div>

      {/* tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <TabBtn value="inbox" label="Gelen" count={counts.inbox} />
        <TabBtn value="archived" label="Arşiv" count={counts.archived} />
        <TabBtn value="trash" label="Çöp Kutusu" count={counts.trash} />
      </div>

      {/* list */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : visibleRows.length === 0 ? (
          <div className="p-4 text-sm text-black/60 dark:text-white/60">
            {tab === "trash"
              ? "Çöp kutusu boş."
              : tab === "archived"
              ? "Arşivde sohbet yok."
              : "Henüz sohbet yok. Bir ilana girip “Mesaj Gönder” ile sohbet başlatabilirsin."}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleRows.map((r) => {
              const name = safeName(r);
              const online = Boolean(r.other_is_online);
              const sub = online
                ? "Şu an online"
                : r.other_last_seen_at
                ? `Son görülme: ${timeAgo(r.other_last_seen_at)}`
                : "—";

              const last = lastText(r);
              const lastAgo = r.last_message_at ? timeAgo(r.last_message_at) : "";

              const disabledRow = Boolean(r.deleted_at);

              return (
                <button
                  key={r.conversation_id}
                  type="button"
                  onClick={() => openConversation(r)}
                  className={[
                    "group w-full text-left",
                    "flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-3 transition",
                    "hover:bg-black/10",
                    "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                    disabledRow ? "opacity-80" : "",
                  ].join(" ")}
                >
                  {/* avatar */}
                  <div className="relative h-12 w-12 shrink-0">
                    <div className="h-12 w-12 overflow-hidden rounded-3xl ring-1 ring-black/10 bg-white/70 dark:ring-white/10 dark:bg-black/25">
                      {r.other_avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.other_avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                          {initials(name)}
                        </div>
                      )}
                    </div>

                    {!disabledRow && online ? (
                      <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-black" />
                    ) : null}
                  </div>

                  {/* meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 truncate text-sm font-extrabold text-black/90 dark:text-white/90">
                        <span className="mr-2">{name}</span>
                        {!disabledRow && r.pinned ? (
                          <span className="text-xs font-black text-amber-700 dark:text-amber-200">📌</span>
                        ) : null}
                        {!disabledRow && r.muted ? <span className="ml-1 text-xs font-black opacity-70">🔕</span> : null}
                        {disabledRow ? (
                          <span className="ml-2 text-[11px] font-black text-rose-700 dark:text-rose-200">
                            (Çöp kutusunda)
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {!disabledRow ? <UnreadPill n={r.unread_count || 0} /> : null}
                        {lastAgo ? <span className="text-xs text-black/50 dark:text-white/50">{lastAgo}</span> : null}
                      </div>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 truncate text-xs text-black/60 dark:text-white/60">{last}</div>
                      <div className="shrink-0 text-[11px] text-black/45 dark:text-white/45">
                        {disabledRow ? `Silindi: ${timeAgo(r.deleted_at)}` : sub}
                      </div>
                    </div>
                  </div>

                  {/* desktop quick actions */}
                  <div className="hidden sm:flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    {disabledRow ? (
                      <>
                        <IconBtn title="Geri al" onClick={() => restore(r)}>
                          ↩️
                        </IconBtn>
                      </>
                    ) : (
                      <>
                        <IconBtn title={r.pinned ? "Pin kaldır" : "Pinle"} onClick={() => togglePinned(r)}>
                          {r.pinned ? "📌" : "📍"}
                        </IconBtn>
                        <IconBtn title={r.archived ? "Arşivden çıkar" : "Arşivle"} onClick={() => toggleArchived(r)}>
                          {r.archived ? "📂" : "🗄️"}
                        </IconBtn>
                        <IconBtn title={r.muted ? "Sesi aç" : "Sessize al"} onClick={() => toggleMuted(r)}>
                          {r.muted ? "🔔" : "🔕"}
                        </IconBtn>
                        <IconBtn title="Sohbeti gizle" onClick={() => softDelete(r)}>
                          🗑️
                        </IconBtn>
                      </>
                    )}
                  </div>

                  {/* mobile menu */}
                  <div className="sm:hidden">
                    <IconBtn
                      title="Menü"
                      onClick={() => {
                        setSheetRow(r);
                        setSheetOpen(true);
                      }}
                    >
                      ⋯
                    </IconBtn>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* quick */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Link
          href="/favorites"
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition text-center"
        >
          ❤️ Favoriler
        </Link>
        <Link
          href="/my-listings"
          className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition text-center"
        >
          İlanlarım
        </Link>
      </div>

      {/* Mobile Action Sheet */}
      {sheetOpen && sheetRow ? (
        <div className="fixed inset-0 z-[80] sm:hidden">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl">
            <div className="rounded-t-[28px] border border-black/10 bg-white/95 p-5 shadow-[0_-24px_70px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-zinc-950/95">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-black/90 dark:text-white/90 truncate">
                    {safeName(sheetRow)}
                  </div>
                  <div className="mt-1 text-xs text-black/55 dark:text-white/55 truncate">
                    {lastText(sheetRow)}
                  </div>
                </div>
                <button
                  className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
                  onClick={() => setSheetOpen(false)}
                >
                  Kapat
                </button>
              </div>

              <div className="mt-4 grid gap-2">
                {sheetRow.deleted_at ? (
                  <>
                    <button
                      className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-left text-sm font-black text-black hover:bg-emerald-400 transition"
                      onClick={() => restore(sheetRow)}
                    >
                      ↩️ Geri Al
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                      onClick={() => togglePinned(sheetRow)}
                    >
                      {sheetRow.pinned ? "📌 Pin kaldır" : "📍 Pinle"}
                    </button>

                    <button
                      className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                      onClick={() => toggleArchived(sheetRow)}
                    >
                      {sheetRow.archived ? "📂 Arşivden çıkar" : "🗄️ Arşivle"}
                    </button>

                    <button
                      className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                      onClick={() => toggleMuted(sheetRow)}
                    >
                      {sheetRow.muted ? "🔔 Sesi aç" : "🔕 Sessize al"}
                    </button>

                    <button
                      className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-left text-sm font-black text-white hover:bg-rose-400 transition"
                      onClick={() => softDelete(sheetRow)}
                    >
                      🗑️ Çöp kutusuna taşı
                    </button>

                    <button
                      className="w-full rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-left text-sm font-extrabold text-black/80 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                      onClick={() => {
                        setSheetOpen(false);
                        openConversation(sheetRow);
                      }}
                    >
                      💬 Sohbete git
                    </button>
                  </>
                )}
              </div>

              <div className="mt-3 text-xs text-black/50 dark:text-white/50">
                Sohbet ID: <span className="font-mono">{sheetRow.conversation_id}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}