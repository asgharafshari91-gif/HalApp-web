"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
  edited_at?: string | null;
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

const PAGE_SIZE = 40;

const MESSAGE_SELECT =
  "id, conversation_id, sender_id, receiver_id, content, body, media_url, media_type, type, created_at, edited_at, is_read, read_at, delivered_at, deleted_at, deleted_for";

function initials(name?: string | null) {
  const v = String(name ?? "").trim();
  if (!v) return "HA";
  return v
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "HA";
}

function dmKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

function pickDisplayName(p?: ProfileMini | null) {
  return (p?.company_name?.trim() ? p.company_name : p?.full_name) ?? "Kullanıcı";
}

function isLikelyUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function msgText(m: Msg) {
  return (m.content ?? m.body ?? "").trim();
}

function tickLabel(m: Msg) {
  const read = !!m.read_at || !!m.is_read;
  const delivered = !!m.delivered_at;

  if (read) return "✓✓ okundu";
  if (delivered) return "✓✓ teslim";
  return "✓ gönderildi";
}

function timeText(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fileKindFromType(type: string) {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "file";
}

export default function ChatClient({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [myId, setMyId] = useState<string | null>(null);
  const [peer, setPeer] = useState<ProfileMini | null>(null);
  const [convId, setConvId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [peerTyping, setPeerTyping] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const [reactions, setReactions] = useState<Record<number, ReactionRow[]>>({});
  const [pinnedMessageId, setPinnedMessageId] = useState<number | null>(null);
  const [viewer, setViewer] = useState<Msg | null>(null);

  const [editing, setEditing] = useState<Msg | null>(null);
  const [editText, setEditText] = useState("");

  const chRef = useRef<RealtimeChannel | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef(false);

  const title = useMemo(() => pickDisplayName(peer), [peer]);

  const pinnedMsg = useMemo(() => {
    if (!pinnedMessageId) return null;
    return messages.find((m) => m.id === pinnedMessageId) ?? null;
  }, [pinnedMessageId, messages]);

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

  async function loadPeer(peerId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, avatar_url, is_online, last_seen_at")
      .eq("id", peerId)
      .maybeSingle();

    if (error) throw error;
    setPeer((data ?? null) as ProfileMini | null);
  }

  async function ensureConversation(uid: string, peerId: string) {
    const key = dmKey(uid, peerId);

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

    throw new Error("Bu kullanıcıyla sohbet kaydı bulunamadı.");
  }

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
      toast({
        variant: "error",
        title: "Pin kaydedilemedi",
        message: error.message,
      });
      return;
    }

    setPinnedMessageId(messageId);
  }

  async function loadReactions(messageList: Msg[] = messages) {
    const ids = messageList
      .filter((m) => m.id > 0)
      .slice(-200)
      .map((m) => m.id);

    if (ids.length === 0) {
      setReactions({});
      return;
    }

    const { data, error } = await supabase
      .from("message_reactions")
      .select("id, message_id, user_id, emoji, created_at")
      .in("message_id", ids);

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
    if (!uid || messageId < 0) return;

    setReactions((prev) => {
      const cur = prev[messageId] ?? [];
      const hasMine = cur.some((x) => x.user_id === uid);

      const next = hasMine
        ? cur.filter((x) => x.user_id !== uid)
        : [
            ...cur,
            {
              id: -Date.now(),
              message_id: messageId,
              user_id: uid,
              emoji,
              created_at: new Date().toISOString(),
            },
          ];

      return { ...prev, [messageId]: next };
    });

    const { error } = await supabase.rpc("toggle_reaction", {
      p_message_id: messageId,
      p_user_id: uid,
      p_emoji: emoji,
    });

    if (error) {
      toast({
        variant: "error",
        title: "Reaction olmadı",
        message: error.message,
      });

      try {
        await loadReactions();
      } catch {}
    }
  }

  async function deleteMessage(messageId: number) {
    const uid = myId;
    if (!uid) return;

    const target = messages.find((m) => m.id === messageId);
    if (!target) return;

    if (messageId < 0) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      return;
    }

    const oldMessages = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      const deletedFor = Array.isArray(target.deleted_for)
        ? Array.from(new Set([...target.deleted_for, uid]))
        : [uid];

      const { error } = await supabase
        .from("messages")
        .update({ deleted_for: deletedFor })
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

  function beginEdit(m: Msg) {
    if (m.sender_id !== myId) return;
    if (m.media_url) return;

    setEditing(m);
    setEditText(msgText(m));
  }

  async function saveEdit() {
    const uid = myId;
    const msg = editing;
    const next = editText.trim();

    if (!uid || !msg || !next) return;

    const old = messages;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              content: next,
              body: next,
              edited_at: new Date().toISOString(),
            }
          : m
      )
    );

    setEditing(null);
    setEditText("");

    try {
      const { error } = await supabase
        .from("messages")
        .update({
          content: next,
          body: next,
          edited_at: new Date().toISOString(),
        })
        .eq("id", msg.id)
        .eq("sender_id", uid);

      if (error) throw error;
    } catch (e: any) {
      setMessages(old);
      toast({
        variant: "error",
        title: "Mesaj düzenlenemedi",
        message: e?.message ?? "Hata",
      });
    }
  }

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

  async function loadMessagesFirst(conversationId: string, uid: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) throw error;

    const filtered = (data ?? []).filter((m: any) => {
      const arr = (m.deleted_for ?? []) as string[];
      return !arr.includes(uid);
    });

    const asc = [...filtered].reverse() as Msg[];

    setMessages(asc);
    setHasMore((data?.length ?? 0) === PAGE_SIZE);

    await markDelivered(conversationId, uid);
    await markRead(conversationId, uid);
    await loadReactions(asc);
  }

  async function loadMoreOlder() {
    const uid = myId;
    const cid = convId;

    if (!uid || !cid || loadingMore || !hasMore) return;

    const oldest = messages[0]?.created_at;
    if (!oldest) return;

    setLoadingMore(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(MESSAGE_SELECT)
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

      const asc = [...filtered].reverse() as Msg[];

      setMessages((prev) => [...asc, ...prev]);
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Daha eski mesajlar yüklenemedi",
        message: e?.message ?? "Hata",
      });
    } finally {
      setLoadingMore(false);
    }
  }

  async function reloadLatest(conversationId: string, uid: string) {
    await loadMessagesFirst(conversationId, uid);
    await loadPinned(conversationId, uid);
  }

  async function setTyping(isTyping: boolean) {
    const uid = myId;
    const cid = convId;
    if (!uid || !cid) return;

    const now = Date.now();
    if (isTyping && now - lastTypingSentRef.current < 800) return;

    lastTypingSentRef.current = now;

    await supabase.from("typing_events").upsert(
      {
        conversation_id: cid,
        user_id: uid,
        is_typing: isTyping,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" }
    );
  }

  function playNotification() {
    try {
      audioRef.current?.play().catch(() => {});
    } catch {}
}
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
      edited_at: null,
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

      const { data: pub } = supabase.storage
        .from("chat_media")
        .getPublicUrl(path);

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
        .select(MESSAGE_SELECT)
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

  async function sendText() {
    const uid = myId;
    const cid = convId;
    const peerId = userId;
    const content = text.trim();

    if (!uid || !cid || !peerId || !content) return;

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
      edited_at: null,
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
        .select(MESSAGE_SELECT)
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

  async function startRecording() {
    if (recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);

      recorderRef.current = rec;
      recordChunksRef.current = [];
      setRecordSeconds(0);

      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordChunksRef.current.push(e.data);
        }
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        if (recordIntervalRef.current) {
          clearInterval(recordIntervalRef.current);
          recordIntervalRef.current = null;
        }

        const blob = new Blob(recordChunksRef.current, {
          type: "audio/webm",
        });

        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        await uploadAndSend(file, "audio");
        setRecordSeconds(0);
      };

      rec.start();
      setRecording(true);
    } catch (e: any) {
      toast({
        variant: "error",
        title: "Mikrofon açılamadı",
        message: e?.message ?? "Mikrofon izni ver.",
      });
    }
  }

  function stopRecording() {
    if (!recording) return;

    setRecording(false);

    try {
      recorderRef.current?.stop();
    } catch {}

    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
  }

  function subscribeRealtime(conversationId: string, uid: string) {
    if (chRef.current) {
      supabase.removeChannel(chRef.current);
    }

    const ch = supabase.channel(`chat-${conversationId}`);

    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload: any) => {
        const incoming = payload?.new as Msg | undefined;

        if (incoming?.sender_id && incoming.sender_id !== uid) {
          playNotification();
        }

        await reloadLatest(conversationId, uid);
        await markDelivered(conversationId, uid);
        await markRead(conversationId, uid);
      }
    );

    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "message_reactions",
      },
      async () => {
        await loadReactions();
      }
    );

    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "typing_events",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async () => {
        const { data } = await supabase
          .from("typing_events")
          .select("user_id, is_typing, updated_at")
          .eq("conversation_id", conversationId)
          .eq("user_id", userId)
          .maybeSingle();

        const isTyping = !!data?.is_typing;
        const updated = data?.updated_at
          ? new Date(data.updated_at).getTime()
          : 0;

        const fresh = Date.now() - updated < 5000;

        setPeerTyping(isTyping && fresh);

        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }

        typingTimerRef.current = setTimeout(() => {
          setPeerTyping(false);
        }, 5200);
      }
    );

    ch.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      async () => {
        await loadPeer(userId);
      }
    );

    ch.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversation_pins",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async () => {
        await loadPinned(conversationId, uid);
      }
    );

    ch.subscribe();
    chRef.current = ch;
  }

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
  }, []);

  useEffect(() => {
    if (!userId || !isLikelyUuid(userId)) {
      router.replace("/conversations");
    }
  }, [userId, router]);

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

        subscribeRealtime(cid, uid);
        loadedRef.current = true;
      } catch (e: any) {
        toast({
          variant: "error",
          title: "Sohbet açılamadı",
          message: e?.message ?? "Hata",
        });

        router.replace("/conversations");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }

      if (chRef.current) {
        supabase.removeChannel(chRef.current);
      }

      chRef.current = null;
    };
  }, [userId]);

  useEffect(() => {
    const onFocus = async () => {
      if (convId && myId) {
        await markRead(convId, myId);
      }
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [convId, myId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: loadedRef.current ? "smooth" : "auto",
    });
  }, [messages]);

  const headerStatus = useMemo(() => {
    if (peerTyping) return "yazıyor...";
    if (peer?.is_online) return "Çevrimiçi";
    if (peer?.last_seen_at) return "Son görülme var";
    return "—";
  }, [peerTyping, peer?.is_online, peer?.last_seen_at]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/conversations"
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold transition hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            ← Geri
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/60 ring-1 ring-black/10 dark:bg-black/30 dark:ring-white/10">
              {peer?.avatar_url ? (
                <img
                  src={peer.avatar_url}
                  className="h-full w-full object-cover"
                  alt="avatar"
                />
              ) : (
                <span className="text-xs font-black text-black/70 dark:text-white/75">
                  {initials(title)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-black">{title}</div>
              <div className="text-xs text-black/50 dark:text-white/50">
                {peerTyping ? (
                  <span className="inline-flex items-center gap-1">
                    <span>✍️ Yazıyor</span>
                    <span className="animate-bounce">.</span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    >
                      .
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    >
                      .
                    </span>
                  </span>
                ) : (
                  headerStatus
                )}
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-sm font-extrabold text-black/80 transition hover:bg-white dark:border-white/10 dark:bg-black/30 dark:text-white/80"
        >
          Ana sayfa
        </Link>
      </div>

      {pinnedMsg ? (
        <div className="rounded-[22px] border border-black/10 bg-amber-50/80 p-3 dark:border-white/10 dark:bg-white/[0.06]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-black text-black/60 dark:text-white/60">
                📌 Sabitlenen mesaj
              </div>
              <div className="mt-1 truncate text-sm font-bold">
                {msgText(pinnedMsg) || "—"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPinnedMessage(null)}
              className="shrink-0 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-black hover:bg-white dark:border-white/10 dark:bg-black/30"
            >
              Kaldır
            </button>
          </div>
        </div>
      ) : null}
<div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        {loading ? (
          <div className="p-6 text-sm text-black/60 dark:text-white/60">
            Yükleniyor…
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              {hasMore ? (
                <button
                  type="button"
                  onClick={loadMoreOlder}
                  disabled={loadingMore}
                  className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-xs font-black hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-black/30"
                >
                  {loadingMore ? "Yükleniyor…" : "⬆️ Daha eski mesajlar"}
                </button>
              ) : (
                <div className="text-[11px] text-black/40 dark:text-white/40">
                  Başlangıç
                </div>
              )}
            </div>

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

                  const reactSummary = reacts.reduce<Record<string, number>>(
                    (acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                      return acc;
                    },
                    {}
                  );

                  return (
                    <div
                      key={`${m.id}-${m.client_temp_id ?? ""}`}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[78%] space-y-1">
                        <div
                          className={`rounded-2xl px-4 py-2 text-sm transition-all ${
                            isMedia
                              ? "border-0 bg-transparent p-0"
                              : mine
                                ? "border border-emerald-500/20 bg-white text-black shadow-sm dark:bg-zinc-900 dark:text-white"
                                : "border border-black/10 bg-white/70 text-black/90 dark:border-white/10 dark:bg-black/30 dark:text-white"
                          }`}
                          style={
                            mine && !isMedia
                              ? {
                                  boxShadow: "inset 4px 0 0 #22c55e",
                                }
                              : undefined
                          }
                        >
                          {isMedia ? (
                            <div className="space-y-2">
                              {m.media_type === "image" ? (
                                <button
                                  type="button"
                                  onClick={() => setViewer(m)}
                                  className="block w-full overflow-hidden rounded-2xl"
                                >
                                  <img
                                    src={m.media_url!}
                                    className="max-h-[360px] w-full rounded-2xl object-cover transition hover:scale-[1.02]"
                                    alt="Fotoğraf"
                                  />
                                </button>
                              ) : m.media_type === "video" ? (
                                <button
                                  type="button"
                                  onClick={() => setViewer(m)}
                                  className="relative block w-full overflow-hidden rounded-2xl bg-black"
                                >
                                  <video
                                    muted
                                    playsInline
                                    preload="metadata"
                                    src={m.media_url!}
                                    className="max-h-[360px] w-full rounded-2xl bg-black object-cover"
                                  />

                                  <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl text-white">
                                    ▶️
                                  </span>
                                </button>
                              ) : m.media_type === "audio" ? (
                                <div className="rounded-2xl border border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-black/30">
                                  <audio controls src={m.media_url!} className="w-full" />
                                </div>
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

                              <div className="text-xs opacity-80">
                                {txt || "—"}
                              </div>
                            </div>
                          ) : editing?.id === m.id ? (
                            <div className="space-y-2">
                              <input
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-black/30 dark:text-white"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit();
                                  if (e.key === "Escape") {
                                    setEditing(null);
                                    setEditText("");
                                  }
                                }}
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="rounded-xl bg-emerald-500 px-3 py-1 text-xs font-black text-white"
                                >
                                  Kaydet
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditing(null);
                                    setEditText("");
                                  }}
                                  className="rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-black dark:border-white/10 dark:bg-black/30"
                                >
                                  İptal
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="whitespace-pre-line">{txt}</div>
                          )}

                          {!isMedia && m.edited_at ? (
                            <div className="mt-1 text-[10px] opacity-50">
                              düzenlendi
                            </div>
                          ) : null}

                          {!isMedia ? (
                            <div className="mt-1 text-[10px] opacity-50">
                              {timeText(m.created_at)}
                            </div>
                          ) : null}
                        </div>

                        <div
                          className={`flex items-center gap-2 ${
                            mine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleReaction(m.id, "❤️")}
                            className="rounded-xl border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-black hover:bg-white dark:border-white/10 dark:bg-black/30"
                          >
                            ❤️
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleReaction(m.id, "🔥")}
                            className="rounded-xl border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-black hover:bg-white dark:border-white/10 dark:bg-black/30"
                          >
                            🔥
                          </button>

                          <button
                            type="button"
                            onClick={() => setPinnedMessage(m.id)}
                            className="rounded-xl border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-black hover:bg-white dark:border-white/10 dark:bg-black/30"
                          >
                            📌
                          </button>

                          {mine && !m.media_url ? (
                            <button
                              type="button"
                              onClick={() => beginEdit(m)}
                              className="rounded-xl border border-black/10 bg-white/70 px-2 py-1 text-[11px] font-black hover:bg-white dark:border-white/10 dark:bg-black/30"
                            >
                              ✏️
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => deleteMessage(m.id)}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] font-black text-red-700 hover:bg-red-500/20"
                          >
                            🗑️
                          </button>

                          {mine ? (
                            <span className="text-[11px] font-black opacity-70">
                              {tickLabel(m)}
                            </span>
                          ) : null}
                        </div>

                        {reacts.length > 0 ? (
                          <div
                            className={`flex flex-wrap gap-2 text-[11px] font-black ${
                              mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            {reactSummary["❤️"] ? (
                              <span className="rounded-full border border-black/10 bg-white/70 px-2 py-1 dark:border-white/10 dark:bg-black/30">
                                ❤️ {reactSummary["❤️"]}
                              </span>
                            ) : null}

                            {reactSummary["🔥"] ? (
                              <span className="rounded-full border border-black/10 bg-white/70 px-2 py-1 dark:border-white/10 dark:bg-black/30">
                                🔥 {reactSummary["🔥"]}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                <div ref={bottomRef} />
              </div>
            )}

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
                      if (f) uploadAndSend(f, fileKindFromType(f.type) as any);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => (recording ? stopRecording() : startRecording())}
                  className={`rounded-2xl border border-black/10 px-3 py-2 text-xs font-black transition dark:border-white/10 ${
                    recording
                      ? "bg-red-500 text-white"
                      : "bg-white/70 dark:bg-black/30"
                  }`}
                >
                  {recording ? (
                    <span className="flex items-center gap-2">
                      <span>⏹️ {recordSeconds}s</span>
                      <span className="flex items-end gap-1">
                        <span className="h-3 w-1 animate-pulse rounded bg-white" />
                        <span
                          className="h-5 w-1 animate-pulse rounded bg-white"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="h-7 w-1 animate-pulse rounded bg-white"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span
                          className="h-4 w-1 animate-pulse rounded bg-white"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </span>
                    </span>
                  ) : (
                    "🎤 Ses kaydı"
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setTyping(true);

                    if (typingTimerRef.current) {
                      clearTimeout(typingTimerRef.current);
                    }

                    typingTimerRef.current = setTimeout(() => {
                      setTyping(false);
                    }, 1500);
                  }}
                  placeholder="Mesaj yaz…"
                  className="h-12 flex-1 rounded-2xl border border-black/10 bg-white/70 px-4 text-sm font-semibold outline-none focus:border-emerald-500/40 dark:border-white/10 dark:bg-black/30 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendText();
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={sending}
                  onClick={sendText}
                  className={`h-12 rounded-2xl px-6 text-sm font-black transition ${
                    sending
                      ? "cursor-not-allowed bg-emerald-500/60"
                      : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
                >
                  Gönder
                </button>
              </div>

              <div className="mt-2 text-[11px] text-black/50 dark:text-white/50">
                {peerTyping ? (
                  <span className="inline-flex items-center gap-1">
                    <span>✍️ Karşı taraf yazıyor</span>
                    <span className="animate-bounce">.</span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    >
                      .
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    >
                      .
                    </span>
                  </span>
                ) : (
                  " "
                )}
              </div>
            </div>
          </div>
        )}
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
    </div>
  );
}