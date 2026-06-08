"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type ProfileMini = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_online: boolean;
  last_seen_at: string | null;
};

type Msg = {
  client_temp_id?: string;
  id: number;
  conversation_id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string | null;
  body: string | null;
  media_url: string | null;
  media_type: string | null;
  type: string | null;
  created_at: string | null;
  is_read: boolean | null;
  read_at: string | null;
  delivered_at: string | null;
  deleted_at: string | null;
  deleted_for: string[] | null;
};

type ReactionRow = {
  id: number;
  message_id: number;
  user_id: string;
  emoji: "❤️" | "🔥";
  created_at: string;
};

function initials(name?: string | null) {
  const v = (name ?? "").trim();
  if (!v) return "HA";
  const parts = v.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("") || "HA";
}

function dmKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

function pickDisplayName(p?: ProfileMini | null) {
  return (p?.company_name?.trim() ? p.company_name : p?.full_name) ?? "Kullanıcı";
}

function isLikelyUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function msgText(m: Msg) {
  return (m.content ?? m.body ?? "").trim();
}

function tickLabel(m: Msg) {
  // Sadece kendi mesajında göster
  // sent ✓, delivered ✓✓, read ✓✓ (read_at dolu)
  if (!m.created_at) return "";
  const read = !!m.read_at || !!m.is_read;
  const delivered = !!m.delivered_at;
  if (read) return "✓✓";
  if (delivered) return "✓✓";
  return "✓";
}

export default function ChatClient({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  // ---- core
  const [myId, setMyId] = useState<string | null>(null);
  const [peer, setPeer] = useState<ProfileMini | null>(null);
  const [convId, setConvId] = useState<string | null>(null);

  // ---- messages + pagination
  const PAGE_SIZE = 40;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ---- typing
  const [peerTyping, setPeerTyping] = useState(false);
  const typingTimerRef = useRef<any>(null);
  const lastTypingSentRef = useRef<number>(0);

  // ---- composer
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // ---- voice
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const recordStartedAtRef = useRef<number>(0);

  // ---- reactions
  const [reactions, setReactions] = useState<Record<number, ReactionRow[]>>({});

  // ---- pinned message
  const [pinnedMessageId, setPinnedMessageId] = useState<number | null>(null);
  const pinnedMsg = useMemo(() => {
    if (!pinnedMessageId) return null;
    return messages.find((m) => m.id === pinnedMessageId) ?? null;
  }, [pinnedMessageId, messages]);
const [viewer, setViewer] = useState<Msg | null>(null);
  // ---- realtime
  const chRef = useRef<RealtimeChannel | null>(null);

  const title = useMemo(() => pickDisplayName(peer), [peer]);

  // ---------- Session ----------
  async function ensureSession() {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id ?? null;

    if (!uid) {
      router.replace(`/auth?next=${encodeURIComponent(`/chat/user/${userId}`)}`);
      return null;
    }
    setMyId(uid);
    return uid;
  }

  // ---------- Peer ----------
  async function loadPeer(peerId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, avatar_url, is_online, last_seen_at")
      .eq("id", peerId)
      .maybeSingle();

    if (error) throw error;
    setPeer((data ?? null) as any);
  }

  // ---------- Conversation ----------
  async function ensureConversation(uid: string, peerId: string) {
  const key = dmKey(uid, peerId);

  // 1) Önce dm_key ile ara
  const { data: byKey, error: keyError } = await supabase
    .from("conversations")
    .select("id")
    .eq("dm_key", key)
    .maybeSingle();

  if (keyError) throw keyError;

  if (byKey?.id) {
    setConvId(byKey.id);
    return byKey.id as string;
  }

  // 2) Eski kayıtlar için buyer/seller iki yönlü ara
  const { data: byUsers, error: userError } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(buyer_id.eq.${uid},seller_id.eq.${peerId}),and(buyer_id.eq.${peerId},seller_id.eq.${uid})`
    )
    .limit(1)
    .maybeSingle();

  if (userError) throw userError;

  if (byUsers?.id) {
    setConvId(byUsers.id);
    return byUsers.id as string;
  }

  // 3) Yeni sohbet oluşturmayı client tarafında yapma, RLS patlatıyor
  throw new Error(
    "Bu kullanıcıyla sohbet kaydı bulunamadı. Yeni sohbet başlatma yetkisi için Supabase RLS/RPC ayarı gerekiyor."
  );
}

  // ---------- Pins ----------
  async function loadPinned(conversationId: string, uid: string) {
    const { data, error } = await supabase
      .from("conversation_pins")
      .select("message_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", uid)
      .maybeSingle();

    if (error) throw error;
    setPinnedMessageId((data?.message_id as number | null) ?? null);
  }

  async function setPinnedMessage(messageId: number | null) {
    const uid = myId;
    const cid = convId;
    if (!uid || !cid) return;

    const { error } = await supabase.rpc("set_pinned_message", {
      p_conversation_id: cid,
      p_user_id: uid,
      p_message_id: messageId,
    });

    if (error) {
      toast({ variant: "error", title: "Pin kaydedilemedi", message: error.message });
      return;
    }
    setPinnedMessageId(messageId);
  }

  // ---------- Reactions ----------
  async function loadReactions(conversationId: string) {
    // Son 200 mesajın reactionlarını çekelim (yeter)
    const lastIds = messages.slice(-200).map((m) => m.id);
    if (lastIds.length === 0) return;

    const { data, error } = await supabase
      .from("message_reactions")
      .select("id, message_id, user_id, emoji, created_at")
      .in("message_id", lastIds);

    if (error) throw error;

    const map: Record<number, ReactionRow[]> = {};
    (data ?? []).forEach((r: any) => {
      map[r.message_id] ??= [];
      map[r.message_id].push(r);
    });
    setReactions(map);
  }

  async function toggleReaction(messageId: number, emoji: "❤️" | "🔥") {
    const uid = myId;
    if (!uid) return;

    // Optimistic UI
    setReactions((prev) => {
      const cur = prev[messageId] ?? [];
      const hasMine = cur.some((x) => x.user_id === uid);
      const next = hasMine ? cur.filter((x) => x.user_id !== uid) : [...cur, {
        id: -Date.now(),
        message_id: messageId,
        user_id: uid,
        emoji,
        created_at: new Date().toISOString(),
      } as any];
      return { ...prev, [messageId]: next };
    });

    const { error } = await supabase.rpc("toggle_reaction", {
      p_message_id: messageId,
      p_user_id: uid,
      p_emoji: emoji,
    });

    if (error) {
      toast({ variant: "error", title: "Reaction olmadı", message: error.message });
      // Hard refresh reactions
      if (convId) {
        try {
          await loadReactions(convId);
        } catch {}
      }
    }
  }
async function deleteMessage(messageId: number) {
  const uid = myId;
  if (!uid) return;

  const target = messages.find((m) => m.id === messageId);
  if (!target) return;

  const oldMessages = messages;

  setMessages((prev) => prev.filter((m) => m.id !== messageId));

  try {
    const deletedFor = Array.isArray(target.deleted_for)
      ? Array.from(new Set([...target.deleted_for, uid]))
      : [uid];

    const { error } = await supabase
      .from("messages")
      .update({
        deleted_for: deletedFor,
      })
      .eq("id", messageId);

    if (error) throw error;
  } catch (e: any) {
    setMessages(oldMessages);

    toast({
      variant: "error",
      title: "Mesaj silinemedi",
      message: e?.message ?? "Hata",
    });
  }
}
  // ---------- Delivered / Read ----------
  async function markDelivered(conversationId: string, uid: string) {
    await supabase.rpc("mark_conversation_delivered", {
      p_conversation_id: conversationId,
      p_viewer: uid,
    });
  }

  async function markRead(conversationId: string, uid: string) {
    await supabase.rpc("mark_conversation_read", {
      p_conversation_id: conversationId,
      p_viewer: uid,
    });
  }

  // ---------- Messages load (pagination) ----------
  async function loadMessagesFirst(conversationId: string, uid: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, receiver_id, content, body, media_url, media_type, type, created_at, is_read, read_at, delivered_at, deleted_at, deleted_for"
      )
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) throw error;

    const filtered = (data ?? []).filter((m: any) => {
      const arr = (m.deleted_for ?? []) as string[];
      return !arr.includes(uid);
    });

    // ters çevir (en eski üstte)
    const asc = filtered.reverse();
    setMessages(asc as any);

    setHasMore((data?.length ?? 0) === PAGE_SIZE);

    // Delivered + Read
    await markDelivered(conversationId, uid);
    await markRead(conversationId, uid);
  }

  async function loadMoreOlder() {
    const uid = myId;
    const cid = convId;
    if (!uid || !cid) return;
    if (loadingMore || !hasMore) return;

    const oldest = messages[0]?.created_at;
    if (!oldest) return;

    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, conversation_id, sender_id, receiver_id, content, body, media_url, media_type, type, created_at, is_read, read_at, delivered_at, deleted_at, deleted_for"
        )
        .eq("conversation_id", cid)
        .is("deleted_at", null)
        .lt("created_at", oldest)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (error) throw error;

      const filtered = (data ?? []).filter((m: any) => {
        const arr = (m.deleted_for ?? []) as string[];
        return !arr.includes(uid);
      });

      const asc = filtered.reverse();
      setMessages((prev) => [...(asc as any), ...prev]);

      setHasMore((data?.length ?? 0) === PAGE_SIZE);
    } catch (e: any) {
      toast({ variant: "error", title: "Daha eski mesajlar yüklenemedi", message: e?.message ?? "Hata" });
    } finally {
      setLoadingMore(false);
    }
  }

  async function reloadLatest(conversationId: string, uid: string) {
    // Realtime event geldiğinde en sağlam: son N'i tekrar çek
    await loadMessagesFirst(conversationId, uid);
    // Reactions refresh
    await loadReactions(conversationId);
    // Pin refresh
    await loadPinned(conversationId, uid);
  }

  // ---------- Typing ----------
  async function setTyping(isTyping: boolean) {
    const uid = myId;
    const cid = convId;
    if (!uid || !cid) return;

    // spam kontrol: 800ms
    const now = Date.now();
    if (isTyping && now - lastTypingSentRef.current < 800) return;
    lastTypingSentRef.current = now;

    await supabase
      .from("typing_events")
      .upsert(
        { conversation_id: cid, user_id: uid, is_typing: isTyping, updated_at: new Date().toISOString() },
        { onConflict: "conversation_id,user_id" }
      );
  }

  // ---------- Media upload & send ----------
  async function uploadAndSend(
  file: File,
  kind: "image" | "video" | "file" | "audio"
) {
  const uid = myId;
  const cid = convId;
  const peerId = userId;

  if (!uid || !cid || !peerId) return;

  const tempId = `temp-media-${Date.now()}`;
  const localUrl = URL.createObjectURL(file);

  const fallbackText =
    kind === "image"
      ? "📷 Fotoğraf"
      : kind === "video"
      ? "🎬 Video"
      : kind === "audio"
      ? "🎤 Ses"
      : "📎 Dosya";

  const optimisticMsg: Msg = {
    client_temp_id: tempId,
    id: -Date.now(),
    conversation_id: cid,
    sender_id: uid,
    receiver_id: peerId,
    content: fallbackText,
    body: fallbackText,
    media_url: localUrl,
    media_type: kind,
    type: kind,
    created_at: new Date().toISOString(),
    is_read: false,
    read_at: null,
    delivered_at: null,
    deleted_at: null,
    deleted_for: null,
  };

  setMessages((prev) => [...prev, optimisticMsg]);
  setSending(true);

  try {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();

    const folder =
      kind === "image"
        ? "foto"
        : kind === "video"
        ? "video"
        : kind === "audio"
        ? "ses"
        : "dosya";

    const path = `${folder}/${cid}/${uid}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("chat_media")
      .upload(path, file, {
        contentType: file.type,
      });

    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("chat_media").getPublicUrl(path);
    const url = pub.publicUrl;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: cid,
        sender_id: uid,
        receiver_id: peerId,
        from_user: uid,
        to_user: peerId,
        content: fallbackText,
        body: fallbackText,
        type: kind,
        media_type: kind,
        media_url: url,
        is_read: false,
      })
      .select(
        "id, conversation_id, sender_id, receiver_id, content, body, media_url, media_type, type, created_at, is_read, read_at, delivered_at, deleted_at, deleted_for"
      )
      .single();

    if (error) throw error;

    setMessages((prev) =>
      prev.map((m) =>
        m.client_temp_id === tempId ? ({ ...(data as Msg) } as Msg) : m
      )
    );
  } catch (e: any) {
    setMessages((prev) => prev.filter((m) => m.client_temp_id !== tempId));

    toast({
      variant: "error",
      title: "Yüklenemedi",
      message: e?.message ?? "Hata",
    });
  } finally {
    URL.revokeObjectURL(localUrl);
    setSending(false);
  }
}

  // ---------- Send text ----------
  async function sendText() {
  const uid = myId;
  const cid = convId;
  const peerId = userId;

  const content = text.trim();

  if (!uid || !cid || !peerId) return;
  if (!content) return;

  const tempId = `temp-${Date.now()}`;

  const optimisticMsg: Msg = {
    client_temp_id: tempId,
    id: -Date.now(),
    conversation_id: cid,
    sender_id: uid,
    receiver_id: peerId,
    content,
    body: content,
    media_url: null,
    media_type: "text",
    type: "text",
    created_at: new Date().toISOString(),
    is_read: false,
    read_at: null,
    delivered_at: null,
    deleted_at: null,
    deleted_for: null,
  };

  setMessages((prev) => [...prev, optimisticMsg]);
  setText("");
  setSending(true);

  try {
    await setTyping(false);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: cid,
        sender_id: uid,
        receiver_id: peerId,
        from_user: uid,
        to_user: peerId,
        content,
        body: content,
        type: "text",
        media_type: "text",
        is_read: false,
      })
      .select(
        "id, conversation_id, sender_id, receiver_id, content, body, media_url, media_type, type, created_at, is_read, read_at, delivered_at, deleted_at, deleted_for"
      )
      .single();

    if (error) throw error;

    setMessages((prev) =>
      prev.map((m) =>
        m.client_temp_id === tempId ? ({ ...(data as Msg) } as Msg) : m
      )
    );
  } catch (e: any) {
    setMessages((prev) => prev.filter((m) => m.client_temp_id !== tempId));

    toast({
      variant: "error",
      title: "Gönderilemedi",
      message: e?.message ?? "Hata",
    });
  } finally {
    setSending(false);
  }
}

  // ---------- Voice recording ----------
  async function startRecording() {
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      recordChunksRef.current = [];
      recordStartedAtRef.current = Date.now();

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });

        await uploadAndSend(file, "audio");
      };

      rec.start();
      setRecording(true);
    } catch (e: any) {
      toast({ variant: "error", title: "Mikrofon açılamadı", message: e?.message ?? "İzin ver" });
    }
  }

  function stopRecording() {
    if (!recording) return;
    setRecording(false);
    try {
      recorderRef.current?.stop();
    } catch {}
  }

  // ---------- Realtime subscribe ----------
  function subscribeRealtime(conversationId: string, uid: string) {
    if (chRef.current) supabase.removeChannel(chRef.current);

    const ch = supabase.channel(`chat-${conversationId}`);

    // messages
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      async () => {
        await reloadLatest(conversationId, uid);
        await markDelivered(conversationId, uid);
        await markRead(conversationId, uid);
      }
    );

    // reactions
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "message_reactions" },
      async () => {
        await loadReactions(conversationId);
      }
    );

    // typing
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "typing_events", filter: `conversation_id=eq.${conversationId}` },
      async () => {
        // peer typing state: updated_at son 5s ve is_typing true
        const { data } = await supabase
          .from("typing_events")
          .select("user_id, is_typing, updated_at")
          .eq("conversation_id", conversationId)
          .eq("user_id", userId)
          .maybeSingle();

        const isTyping = !!data?.is_typing;
        const upd = data?.updated_at ? new Date(data.updated_at).getTime() : 0;
        const fresh = Date.now() - upd < 5000;
        setPeerTyping(isTyping && fresh);

        // TTL: 5 saniye sonra otomatik kapat
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setPeerTyping(false), 5200);
      }
    );

    // peer online realtime (profiles)
    ch.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
      async () => {
        await loadPeer(userId);
      }
    );

    // pins
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "conversation_pins", filter: `conversation_id=eq.${conversationId}` },
      async () => {
        await loadPinned(conversationId, uid);
      }
    );

    ch.subscribe();
    chRef.current = ch;
  }

  // ---------- INIT ----------
  useEffect(() => {
    // invalid route guard (client side)
    if (!userId || !isLikelyUuid(userId)) {
      router.replace("/conversations");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const uid = await ensureSession();
        if (!uid || !alive) return;

        await loadPeer(userId);
        const cid = await ensureConversation(uid, userId);
        if (!alive) return;

        await loadPinned(cid, uid);
        await loadMessagesFirst(cid, uid);
        await loadReactions(cid);

        subscribeRealtime(cid, uid);
      } catch (e: any) {
        toast({ variant: "error", title: "Sohbet açılamadı", message: e?.message ?? "Hata" });
        router.replace("/conversations");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (chRef.current) supabase.removeChannel(chRef.current);
      chRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Mark read when window gains focus
  useEffect(() => {
    const onFocus = async () => {
      if (convId && myId) await markRead(convId, myId);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [convId, myId]);

  const headerStatus = useMemo(() => {
    if (peerTyping) return "yazıyor…";
    if (peer?.is_online) return "Çevrimiçi";
    if (peer?.last_seen_at) return "Son görülme var";
    return "—";
  }, [peerTyping, peer?.is_online, peer?.last_seen_at]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/conversations"
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
          >
            ← Geri
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl overflow-hidden ring-1 ring-black/10 bg-white/60 dark:ring-white/10 dark:bg-black/30 flex items-center justify-center">
              {peer?.avatar_url ? (
                <img src={peer.avatar_url} className="h-full w-full object-cover" alt="avatar" />
              ) : (
                <span className="text-xs font-black text-black/70 dark:text-white/75">{initials(title)}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-black">{title}</div>
              <div className="text-xs text-black/50 dark:text-white/50">{headerStatus}</div>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 hover:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white/80 dark:hover:bg-black/20 transition"
        >
          Ana sayfa
        </Link>
      </div>

      {/* PINNED MESSAGE HEADER */}
      {pinnedMsg ? (
        <div className="rounded-[22px] border border-black/10 bg-amber-50/80 p-3 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-black text-black/60 dark:text-white/60">📌 Sabitlenen mesaj</div>
              <div className="mt-1 truncate text-sm font-bold">{msgText(pinnedMsg) || "—"}</div>
            </div>
            <button
              type="button"
              onClick={() => setPinnedMessage(null)}
              className="shrink-0 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/20"
            >
              Kaldır
            </button>
          </div>
        </div>
      ) : null}

      {/* BODY */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-6 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : (
          <div className="space-y-3">
            {/* Pagination */}
            <div className="flex items-center justify-center">
              {hasMore ? (
                <button
                  type="button"
                  onClick={loadMoreOlder}
                  disabled={loadingMore}
                  className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/20"
                >
                  {loadingMore ? "Yükleniyor…" : "⬆️ Daha eski mesajlar"}
                </button>
              ) : (
                <div className="text-[11px] text-black/40 dark:text-white/40">Başlangıç</div>
              )}
            </div>

            {/* Messages */}
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-black/5 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
                Henüz mesaj yok. İlk mesajı sen gönder 🙂
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => {
                  const mine = m.sender_id === myId;
                  const txt = msgText(m);
                  const isMedia = !!m.media_url;
                  const reacts = reactions[m.id] ?? [];
                  const reactSummary = reacts.reduce<Record<string, number>>((acc, r) => {
                    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                    return acc;
                  }, {});
                  const showTicks = mine;
                  const ticks = tickLabel(m);
                  const read = !!m.read_at || !!m.is_read;
                  const delivered = !!m.delivered_at;

                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[78%] space-y-1">
                      <div
  className={`rounded-2xl px-4 py-2 text-sm border transition-all ${
    mine
      ? "bg-white dark:bg-zinc-900 text-black dark:text-white border-emerald-500/20 shadow-sm"
      : "bg-white/70 dark:bg-black/30 text-black/90 dark:text-white border-black/10 dark:border-white/10"
  }`}
  style={
    mine
      ? {
          boxShadow: "inset 4px 0 0 #22c55e",
        }
      : undefined
  }
>
                          {/* Content */}
                          {isMedia ? (
                            <div className="space-y-2">
                           {m.media_type === "image" ? (
  <button
    type="button"
    onClick={() => setViewer(m)}
    className="block w-full overflow-hidden rounded-xl"
  >
    <img
      src={m.media_url!}
      className="max-h-[360px] w-full rounded-xl object-cover transition hover:scale-[1.02]"
      alt="Fotoğraf"
    />
  </button>
) : m.media_type === "video" ? (
  <button
    type="button"
    onClick={() => setViewer(m)}
    className="relative block w-full overflow-hidden rounded-xl bg-black"
  >
    <video
      muted
      playsInline
      preload="metadata"
      src={m.media_url!}
      className="max-h-[360px] w-full rounded-xl bg-black object-cover"
    />
    <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl text-white">
      ▶️
    </span>
  </button>
) : m.media_type === "audio" ? (
  <audio controls src={m.media_url!} className="w-full" />
) : (
  <a
    className="font-bold underline"
    href={m.media_url!}
    target="_blank"
    rel="noreferrer"
  >
    📎 Dosyayı aç
  </a>
)}
                              <div className="text-xs opacity-80">{txt || "—"}</div>
                            </div>
                          ) : (
                            <div>{txt}</div>
                          )}

                          {/* Meta row: ticks + actions */}
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {/* Reactions buttons */}
                              <button
                                type="button"
                                onClick={() => toggleReaction(m.id, "❤️")}
                                className="rounded-xl border border-black/10 bg-white/60 px-2 py-1 text-[11px] font-black hover:bg-white"
                              >
                                ❤️
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleReaction(m.id, "🔥")}
                                className="rounded-xl border border-black/10 bg-white/60 px-2 py-1 text-[11px] font-black hover:bg-white"
                              >
                                🔥
                              </button>

                              {/* Pin message */}
                              <button
                                type="button"
                                onClick={() => setPinnedMessage(m.id)}
                                className="rounded-xl border border-black/10 bg-white/60 px-2 py-1 text-[11px] font-black hover:bg-white"
                              >
                                📌
                              </button>
                            </div>

<button
  type="button"
  onClick={() => deleteMessage(m.id)}
  className="rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-black text-red-700 hover:bg-red-500/20"
>
  🗑️
</button>
                            {/* ticks */}
                            {showTicks ? (
                              <div className="text-[11px] font-black opacity-80">
                                {ticks}
                                {ticks === "✓✓" ? (read ? " okundu" : delivered ? " teslim" : "") : " gönderildi"}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Reaction summary (counts) */}
                        {reacts.length > 0 ? (
                          <div className="flex flex-wrap gap-2 text-[11px] font-black">
                            {reactSummary["❤️"] ? (
                              <span className="rounded-full border border-black/10 bg-white/70 px-2 py-1">❤️ {reactSummary["❤️"]}</span>
                            ) : null}
                            {reactSummary["🔥"] ? (
                              <span className="rounded-full border border-black/10 bg-white/70 px-2 py-1">🔥 {reactSummary["🔥"]}</span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPOSER */}
            <div className="pt-2">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black dark:border-white/10 dark:bg-black/30">
                  📷 Foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAndSend(f, "image");
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                <label className="cursor-pointer rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black dark:border-white/10 dark:bg-black/30">
                  🎬 Video
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAndSend(f, "video");
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                <label className="cursor-pointer rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black dark:border-white/10 dark:bg-black/30">
                  📎 Dosya
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadAndSend(f, "file");
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                {/* Voice */}
                <button
                  type="button"
                  onClick={() => (recording ? stopRecording() : startRecording())}
                  className={`rounded-2xl px-3 py-2 text-xs font-black border border-black/10 ${
                    recording ? "bg-red-500 text-white" : "bg-white/70"
                  } dark:border-white/10 dark:bg-black/30`}
                >
                  {recording ? "⏹️ Kaydı bitir" : "🎤 Ses kaydı"}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);

                    // typing events
                    setTyping(true);
                    // 1.5s sonra typing off
                    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                    typingTimerRef.current = setTimeout(() => setTyping(false), 1500);
                  }}
                  placeholder="Mesaj yaz…"
                  className="h-12 flex-1 rounded-2xl border border-black/10 bg-white/70 px-4 text-sm font-semibold outline-none focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/30 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendText();
                  }}
                />
                <button
                  type="button"
                  disabled={sending}
                  onClick={sendText}
                  className={`h-12 rounded-2xl px-6 text-sm font-black transition ${
                    sending ? "bg-emerald-500/60 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
                >
                  Gönder
                </button>
              </div>
{viewer ? (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4">
    <button
      type="button"
      onClick={() => setViewer(null)}
      className="absolute right-4 top-4 z-10 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur hover:bg-white/20"
    >
      ✕ Kapat
    </button>

    {viewer.media_type === "image" ? (
      <img
        src={viewer.media_url!}
        alt="Fotoğraf"
        className="max-h-[88vh] max-w-[96vw] rounded-2xl object-contain shadow-2xl"
      />
    ) : viewer.media_type === "video" ? (
      <video
        controls
        autoPlay
        playsInline
        src={viewer.media_url!}
        className="max-h-[88vh] max-w-[96vw] rounded-2xl bg-black shadow-2xl"
      />
    ) : null}
  </div>
) : null}
              <div className="mt-2 text-[11px] text-black/50 dark:text-white/50">
                {peerTyping ? "✍️ Karşı taraf yazıyor…" : " "}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}