"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { getSignedMediaUrl } from "@/lib/chat/signedMedia";
import MediaLightbox from "@/components/ui/MediaLightbox";
import { uploadChatMediaWithProgress, UploadKind } from "@/lib/chat/uploadMediaProgress";

type Msg = {
  id: number;
  from_user: string;
  to_user: string;
  body: string | null;
  created_at: string;
  type: string | null;

  media_url: string | null;
  media_type: string | null;
  media_path: string | null;
  audio_duration_ms: number | null;

  is_read: boolean;

  conversation_id?: string | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_online?: boolean | null;
  last_seen_at?: string | null;
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
  if (day > 0) return `${day}g önce`;
  if (hr > 0) return `${hr}s önce`;
  if (min > 0) return `${min}dk önce`;
  return "az önce";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function ProgressPill({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-3 py-2 dark:border-white/10 dark:bg-white/5">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs font-black text-black/70 dark:text-white/70">{pct}%</div>
    </div>
  );
}

export default function ChatUserPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const search = useSearchParams();

  const otherId = params.userId;
  const cidFromUrl = (search.get("cid") ?? "").trim(); // ✅ artık bunu kullanacağız

  const [myId, setMyId] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(cidFromUrl || null);

  const [other, setOther] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // upload state
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<UploadKind | null>(null);
  const previewRevokeRef = useRef<string | null>(null);

  const fileInputImg = useRef<HTMLInputElement | null>(null);
  const fileInputVid = useRef<HTMLInputElement | null>(null);
  const fileInputAud = useRef<HTMLInputElement | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // signed url state
  const [resolved, setResolved] = useState<Record<number, string>>({});

  // lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbKind, setLbKind] = useState<"image" | "video">("image");
  const [lbSrc, setLbSrc] = useState<string | null>(null);

  const otherName = useMemo(() => {
    const c = (other?.company_name ?? "").trim();
    const f = (other?.full_name ?? "").trim();
    return c || f || "Kullanıcı";
  }, [other]);

  function scrollBottom() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function ensureConversationId(uid: string): Promise<string> {
    // 1) URL’de cid varsa onu kullan
    if (cidFromUrl) return cidFromUrl;

    // 2) State’de varsa onu kullan
    if (cid) return cid;

    // 3) yoksa RPC ile oluştur
    const { data: convId, error } = await supabase.rpc("get_or_create_conversation", {
      p_user_a: uid,
      p_user_b: otherId,
    });
    if (error) throw error;

    const v = String(convId);
    setCid(v);

    // URL'i de güncelle (opsiyonel ama iyi: refresh olunca cid kaybolmasın)
    router.replace(`/chat/user/${otherId}?cid=${encodeURIComponent(v)}`);

    return v;
  }

  async function markRead(uid: string, conversationId: string) {
    await supabase
      .from("messages")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("to_user", uid)
      .eq("from_user", otherId)
      .eq("is_read", false);
  }

  async function resolveMediaIfNeeded(list: Msg[]) {
    const targets = list.filter(
      (m) => (m.type === "image" || m.type === "video" || m.type === "audio") && (m.media_url || m.media_path)
    );

    for (const m of targets) {
      if (resolved[m.id]) continue;
      try {
        if (m.media_url) {
          setResolved((p) => ({ ...p, [m.id]: m.media_url! }));
          continue;
        }
        if (m.media_path) {
          const url = await getSignedMediaUrl(m.media_path, 60 * 30);
          setResolved((p) => ({ ...p, [m.id]: url }));
        }
      } catch {}
    }
  }

  async function loadInitial() {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;

      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent(`/chat/user/${otherId}${cidFromUrl ? `?cid=${cidFromUrl}` : ""}`)}`);
        return;
      }

      setMyId(uid);

      const conversationId = await ensureConversationId(uid);

      // other profile
      const { data: op } = await supabase
        .from("profiles")
        .select("id,full_name,company_name,avatar_url,is_online,last_seen_at")
        .eq("id", otherId)
        .maybeSingle();

      setOther((op ?? null) as any);

      // ✅ artık conversation_id ile çekiyoruz
      const { data, error } = await supabase
        .from("messages")
        .select("id,from_user,to_user,body,created_at,type,media_url,media_type,media_path,audio_duration_ms,is_read,conversation_id")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(500);

      if (error) throw error;

      const list = (data ?? []) as Msg[];
      setMsgs(list);

      await markRead(uid, conversationId);
      await resolveMediaIfNeeded(list);
      scrollBottom();
    } catch (e: any) {
      toast({ variant: "error", title: "Sohbet açılamadı", message: e?.message ?? "Hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // URL cid değişirse state sync
    setCid(cidFromUrl || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cidFromUrl]);

  useEffect(() => {
    loadInitial();

    return () => {
      // cleanup preview url
      if (previewRevokeRef.current) URL.revokeObjectURL(previewRevokeRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId]);

  // ✅ realtime: sadece bu conversation
  useEffect(() => {
    if (!myId) return;
    if (!cidFromUrl && !cid) return;

    const activeCid = cidFromUrl || cid!;
    const channel = supabase
      .channel(`chat-${activeCid}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeCid}` }, async (payload) => {
        const m = payload.new as unknown as Msg;

        // güvenlik: benim sohbetim mi
        const ok =
          (m.from_user === myId && m.to_user === otherId) ||
          (m.from_user === otherId && m.to_user === myId);

        if (!ok) return;

        setMsgs((prev) => [...prev, m]);

        if (m.to_user === myId) await markRead(myId, activeCid);

        await resolveMediaIfNeeded([m]);
        scrollBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId, otherId, cidFromUrl, cid]);

  function openLightbox(kind: "image" | "video", src: string) {
    setLbKind(kind);
    setLbSrc(src);
    setLbOpen(true);
  }

  async function sendText() {
    const uid = myId;
    const body = text.trim();

    if (!uid) {
      router.replace(`/auth?next=${encodeURIComponent(`/chat/user/${otherId}${cid ? `?cid=${cid}` : ""}`)}`);
      return;
    }

    if (!body) {
      toast({ variant: "info", title: "Boş mesaj", message: "Bir şey yazıp gönder." });
      return;
    }

    try {
      setSending(true);

      const conversationId = await ensureConversationId(uid);

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId, // ✅ EN KRİTİK
        from_user: uid,
        to_user: otherId,
        body,
        type: "text",
        is_read: false,
      });

      if (error) throw error;

      setText("");
      scrollBottom();
    } catch (e: any) {
      toast({ variant: "error", title: "Gönderilemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setSending(false);
    }
  }

  function setPreview(file: File, kind: UploadKind) {
    if (previewRevokeRef.current) URL.revokeObjectURL(previewRevokeRef.current);
    const url = URL.createObjectURL(file);
    previewRevokeRef.current = url;
    setPreviewUrl(url);
    setPreviewKind(kind);
  }

  function clearPreview() {
    if (previewRevokeRef.current) URL.revokeObjectURL(previewRevokeRef.current);
    previewRevokeRef.current = null;
    setPreviewUrl(null);
    setPreviewKind(null);
    setUploadPct(0);
  }

  async function sendMedia(file: File, kind: UploadKind) {
    const uid = myId;

    if (!uid) {
      router.replace(`/auth?next=${encodeURIComponent(`/chat/user/${otherId}${cid ? `?cid=${cid}` : ""}`)}`);
      return;
    }

    const maxMB = kind === "video" ? 80 : kind === "audio" ? 30 : 15;
    if (file.size > maxMB * 1024 * 1024) {
      toast({ variant: "error", title: "Dosya çok büyük", message: `Maksimum ${maxMB}MB.` });
      return;
    }

    try {
      setUploading(true);
      setUploadPct(1);
      setPreview(file, kind);

      const conversationId = await ensureConversationId(uid);

      const up = await uploadChatMediaWithProgress({
        file,
        myId: uid,
        peerId: otherId,
        kind,
        onProgress: (p) => setUploadPct(p),
      });

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId, // ✅ EN KRİTİK
        from_user: uid,
        to_user: otherId,
        body: null,
        type: kind,
        media_url: null,
        media_type: up.mime,
        media_path: up.path,
        is_read: false,
      });

      if (error) throw error;

      toast({
        variant: "success",
        title: "Gönderildi",
        message: kind === "image" ? "Fotoğraf gönderildi." : kind === "video" ? "Video gönderildi." : "Ses gönderildi.",
      });

      clearPreview();
      scrollBottom();
    } catch (e: any) {
      toast({ variant: "error", title: "Yükleme başarısız", message: e?.message ?? "Hata oluştu." });
      // preview kalsın kullanıcı tekrar dener
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <MediaLightbox open={lbOpen} kind={lbKind} src={lbSrc} onClose={() => setLbOpen(false)} />

      {/* Header */}
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center gap-3">
          <button
            className="rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-sm font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            onClick={() => router.push("/conversations")}
          >
            ← Geri
          </button>

          <div className="relative h-11 w-11 overflow-hidden rounded-2xl ring-1 ring-black/10 bg-black/5 dark:ring-white/10 dark:bg-white/5">
            {other?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-black text-black/70 dark:text-white/75">
                {initials(otherName)}
              </div>
            )}
            {other?.is_online ? (
              <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-black" />
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-black/90 dark:text-white/90">{otherName}</div>
            <div className="text-xs text-black/55 dark:text-white/55">
              {other?.is_online ? "Şu an online" : other?.last_seen_at ? `Son görülme: ${timeAgo(other.last_seen_at)}` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="mt-3 rounded-[28px] border border-black/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-4 text-sm text-black/60 dark:text-white/60">Yükleniyor…</div>
          ) : msgs.length === 0 ? (
            <div className="p-4 text-sm text-black/60 dark:text-white/60">Henüz mesaj yok. İlk mesajı sen gönder 🙂</div>
          ) : (
            <div className="space-y-2">
              {msgs.map((m) => {
                const mine = m.from_user === myId;
                const url = resolved[m.id] || null;

                return (
                  <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={[
                        "max-w-[78%] rounded-2xl px-4 py-2 text-sm font-semibold leading-6",
                        mine
                          ? "bg-emerald-500 text-black"
                          : "border border-black/10 bg-black/5 text-black/85 dark:border-white/10 dark:bg-white/5 dark:text-white/85",
                      ].join(" ")}
                    >
                      {m.type === "image" ? (
                        url ? (
                          <button type="button" onClick={() => openLightbox("image", url)} className="block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Fotoğraf" className="max-h-[320px] w-auto rounded-xl object-cover" />
                            <div className="mt-1 text-[11px] font-bold opacity-70">Büyütmek için tıkla</div>
                          </button>
                        ) : (
                          <div className="text-xs opacity-70">Fotoğraf yükleniyor…</div>
                        )
                      ) : m.type === "video" ? (
                        url ? (
                          <div className="space-y-2">
                            <video src={url} controls className="max-h-[360px] w-full rounded-xl" />
                            <button
                              type="button"
                              onClick={() => openLightbox("video", url)}
                              className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
                            >
                              Fullscreen aç
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs opacity-70">Video yükleniyor…</div>
                        )
                      ) : m.type === "audio" ? (
                        url ? <audio src={url} controls className="w-full" /> : <div className="text-xs opacity-70">Ses yükleniyor…</div>
                      ) : (
                        <div>{m.body}</div>
                      )}

                      <div className="mt-1 text-[11px] font-bold opacity-70">{formatTime(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="mt-3 space-y-2">
          {/* Preview + Progress */}
          {previewUrl && previewKind ? (
            <div className="rounded-2xl border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-black text-black/70 dark:text-white/70">Yükleme önizlemesi</div>

                  <div className="mt-2">
                    {previewKind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="preview" className="max-h-[180px] rounded-2xl object-cover" />
                    ) : previewKind === "video" ? (
                      <video src={previewUrl} className="max-h-[220px] w-full rounded-2xl" controls />
                    ) : (
                      <audio src={previewUrl} controls className="w-full" />
                    )}
                  </div>

                  <div className="mt-3">
                    <ProgressPill pct={uploadPct} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearPreview}
                  className="rounded-2xl border border-black/10 bg-white/80 px-3 py-2 text-xs font-extrabold text-black/70 hover:bg-white transition dark:border-white/10 dark:bg-black/30 dark:text-white/75 dark:hover:bg-black/20"
                  disabled={uploading}
                >
                  Kaldır
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              className={[
                "rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition",
                uploading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              onClick={() => fileInputImg.current?.click()}
            >
              📷 Foto
            </button>

            <button
              type="button"
              disabled={uploading}
              className={[
                "rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition",
                uploading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              onClick={() => fileInputVid.current?.click()}
            >
              🎬 Video
            </button>

            <button
              type="button"
              disabled={uploading}
              className={[
                "rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition",
                uploading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
              onClick={() => fileInputAud.current?.click()}
            >
              🎤 Ses
            </button>

            {uploading ? <span className="text-xs font-black text-black/60 dark:text-white/60">Yükleniyor…</span> : null}

            <input
              ref={fileInputImg}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) sendMedia(f, "image");
              }}
            />
            <input
              ref={fileInputVid}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) sendMedia(f, "video");
              }}
            />
            <input
              ref={fileInputAud}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) sendMedia(f, "audio");
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Mesaj yaz…"
              className="w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/40 dark:border-white/10 dark:bg-black/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendText();
              }}
              disabled={uploading}
            />
            <button
              onClick={sendText}
              disabled={sending || uploading}
              className={[
                "rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-black hover:bg-emerald-400 transition",
                sending || uploading ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              Gönder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}