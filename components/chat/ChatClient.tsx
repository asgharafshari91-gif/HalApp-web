"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type MsgRow = {
  id: number | string;
  from_user: string | null;
  to_user: string | null;
  body: string | null;
  created_at: string | null;

  // uyumluluk alanları (sende var)
  sender_id?: string | null;
  receiver_id?: string | null;
  content?: string | null;
  topic?: string | null;
};

function safeText(v: any, fb: string) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : fb;
}

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0) return `${day}g önce`;
  if (hr > 0) return `${hr}s önce`;
  if (min > 0) return `${min}dk önce`;
  return "az önce";
}

export default function ChatClient({
  listingId,
  peerId,
  peerName,
  peerAvatarUrl,
}: {
  listingId: string;
  peerId: string;
  peerName: string;
  peerAvatarUrl: string | null;
}) {
  const router = useRouter();

  const topic = useMemo(() => `listing:${listingId}`, [listingId]);

  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<MsgRow[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function loadMe() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const id = data.user?.id ?? null;
    setMyId(id);
    return id;
  }

  async function loadMessages(me: string) {
    setErr(null);

    // ✅ ilan bazlı topic + 2 kişi arası mesajlar
    const { data, error } = await supabase
      .from("messages")
      .select("id, from_user, to_user, body, created_at, sender_id, receiver_id, content, topic")
      .eq("topic", topic)
      .or(
        `and(from_user.eq.${me},to_user.eq.${peerId}),and(from_user.eq.${peerId},to_user.eq.${me})`
      )
      .order("created_at", { ascending: true });

    if (error) throw error;
    setMsgs((Array.isArray(data) ? data : []) as any);
    scrollToBottom();
  }

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      try {
        setLoading(true);

        const me = await loadMe();
        if (!me) {
          setLoading(false);
          alert("Sohbet için giriş yapmalısın.");
          router.push("/auth");
          return;
        }
        if (!peerId) {
          setLoading(false);
          setErr("Satıcı bulunamadı (seller_id boş).");
          return;
        }

        await loadMessages(me);
        if (cancelled) return;

        // ✅ realtime: sadece bu ilanın mesajları
        channel = supabase
          .channel(`rt_messages_${topic}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `topic=eq.${topic}` },
            (payload) => {
              const row = payload.new as any as MsgRow;

              // sadece bu iki kişi arasıysa ekle
              const a = row.from_user ?? row.sender_id ?? "";
              const b = row.to_user ?? row.receiver_id ?? "";

              if (
                (a === me && b === peerId) ||
                (a === peerId && b === me)
              ) {
                setMsgs((prev) => {
                  // aynı id gelirse tekrar ekleme
                  const exists = prev.some((x) => String(x.id) === String(row.id));
                  if (exists) return prev;
                  return [...prev, row];
                });
                scrollToBottom();
              }
            }
          )
          .subscribe();
      } catch (e: any) {
        setErr(e?.message ?? "Sohbet yüklenemedi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [peerId, router, topic]);

  async function send() {
    try {
      if (!myId) {
        alert("Giriş yapmalısın.");
        router.push("/auth");
        return;
      }
      const body = text.trim();
      if (!body) return;

      setSending(true);
      setErr(null);

      // ✅ hem eski hem yeni kolonlara yaz (uyumluluk için)
      const payload = {
        topic,
        from_user: myId,
        to_user: peerId,
        body,
        created_at: new Date().toISOString(),

        sender_id: myId,
        receiver_id: peerId,
        content: body,
        type: "text",
        message_type: "text",
        is_read: false,
      };

      const { error } = await supabase.from("messages").insert(payload as any);
      if (error) throw error;

      setText("");
      // realtime ile gelecek ama UX için de aşağı indir
      scrollToBottom();
    } catch (e: any) {
      setErr(e?.message ?? "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 shadow-[0_14px_40px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-black/10 bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-black/5 dark:ring-white/10 dark:bg-white/5">
            {peerAvatarUrl ? (
              <img src={peerAvatarUrl} className="h-full w-full object-cover" alt={peerName} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                {safeText(peerName, "S").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-black/90 dark:text-white/90">
              {peerName}
            </div>
            <div className="text-xs text-black/55 dark:text-white/55">
              İlan sohbeti • {topic}
            </div>
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/70 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-white/10 transition"
          onClick={() => router.refresh()}
        >
          Yenile
        </button>
      </div>

      {/* Body */}
      <div className="h-[60vh] max-h-[620px] overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
        ) : err ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
            {err}
          </div>
        ) : msgs.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/75">
            Henüz mesaj yok. İlk mesajı sen gönder 👇
          </div>
        ) : (
          <div className="space-y-3">
            {msgs.map((m) => {
              const from = (m.from_user ?? m.sender_id ?? "") as string;
              const isMine = myId ? from === myId : false;
              const content = safeText(m.body ?? m.content, "");
              const t = timeAgo(m.created_at ?? null);

              return (
                <div key={String(m.id)} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                      isMine
                        ? "bg-emerald-500 text-black"
                        : "border border-black/10 bg-white/80 text-black/90 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/90",
                    ].join(" ")}
                  >
                    <div className="whitespace-pre-wrap break-words">{content}</div>
                    {t ? (
                      <div className={`mt-1 text-[11px] ${isMine ? "text-black/60" : "text-black/45 dark:text-white/45"}`}>
                        {t}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mesaj yaz…"
            rows={1}
            className="min-h-[44px] max-h-[140px] w-full resize-none rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm text-black/90 outline-none ring-0 focus:border-emerald-500/40 dark:border-white/10 dark:bg-zinc-950/80 dark:text-white"
          />

          <button
            disabled={sending || !text.trim()}
            onClick={send}
            className={[
              "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition",
              sending || !text.trim()
                ? "cursor-not-allowed bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40"
                : "bg-emerald-500 text-black hover:bg-emerald-400",
            ].join(" ")}
          >
            Gönder
          </button>
        </div>

        <div className="mt-2 text-[11px] text-black/45 dark:text-white/45">
          Not: Mesajlar <b>messages</b> tablosuna <b>topic = {topic}</b> ile kaydedilir.
        </div>
      </div>
    </div>
  );
}