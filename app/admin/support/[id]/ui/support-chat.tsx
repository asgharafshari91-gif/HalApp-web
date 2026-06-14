"use client";

import { useEffect, useRef, useState } from "react";

function fmt(dt?: string | null) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function SupportChat({
  ticketId,
}: {
  ticketId: string;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages() {
    const res = await fetch(
      `/api/admin/support/${ticketId}/messages`,
      { cache: "no-store" }
    );

    const j = await res.json().catch(() => ({}));

    if (res.ok) {
      setMessages(j.items ?? []);
    }
  }

  async function sendMessage() {
    if (!text.trim()) return;

    setSending(true);

    try {
      const res = await fetch(
        `/api/admin/support/${ticketId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text.trim(),
          }),
        }
      );

      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(j?.error ?? "send_failed");
      }

      setText("");
      await loadMessages();
    } catch (e: any) {
      alert(e?.message ?? "send_failed");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="rounded-[32px] border border-black/10 bg-white/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,.06)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-4 text-sm font-black text-zinc-500">
        Ticket Sohbeti
      </div>

      <div className="max-h-[500px] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm text-zinc-500 dark:border-white/10">
            Henüz mesaj yok.
          </div>
        )}

        {messages.map((m) => {
          const isAdmin = m.sender_role === "admin";

          return (
            <div
              key={m.id}
              className={`flex ${
                isAdmin ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                  isAdmin
                    ? "bg-emerald-500 text-black"
                    : "bg-zinc-100 dark:bg-white/10"
                }`}
              >
                <div className="mb-1 text-[11px] font-black opacity-70">
                  {isAdmin ? "Admin" : "Kullanıcı"}
                </div>

                <div className="whitespace-pre-wrap text-sm">
                  {m.message}
                </div>

                <div className="mt-2 text-[10px] opacity-70">
                  {fmt(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Kullanıcıya cevap yaz..."
          className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-black/20"
        />

        <button
          onClick={sendMessage}
          disabled={sending}
          className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black hover:bg-emerald-400 disabled:opacity-60"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}