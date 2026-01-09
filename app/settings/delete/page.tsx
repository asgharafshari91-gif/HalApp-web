"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_70px_rgba(0,0,0,0.45)]">
      <div className="text-lg font-black">{title}</div>
      {desc ? <div className="mt-1 text-sm text-black/60 dark:text-white/60 leading-6">{desc}</div> : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

type ReqRow = {
  id: string;
  user_id: string;
  reason: string | null;
  status: string;
  created_at: string;
};

export default function DeleteAccountPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reason, setReason] = useState("");
  const [existing, setExisting] = useState<ReqRow | null>(null);

  async function ensureAuth() {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id ?? null;
    if (!id) {
      router.replace(`/auth?next=${encodeURIComponent("/settings/delete")}`);
      return null;
    }
    return id;
  }

  async function load(userId: string) {
    const { data, error } = await supabase
      .from("account_deletion_requests")
      .select("id,user_id,reason,status,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    setExisting((data ?? null) as any);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const id = await ensureAuth();
        if (!id) return;
        if (!mounted) return;
        setUid(id);
        await load(id);
      } catch (e: any) {
        toast({ variant: "error", title: "Yüklenemedi", message: e?.message ?? "Hata" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestDelete() {
    if (!uid) return;
    if (existing && existing.status === "requested") {
      toast({ variant: "info", title: "Zaten var", message: "Silme talebin zaten oluşturulmuş." });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("account_deletion_requests").insert({
        user_id: uid,
        reason: reason.trim() ? reason.trim() : null,
        status: "requested",
      });
      if (error) throw error;

      toast({
        variant: "success",
        title: "Talep alındı",
        message: "Hesap silme talebin oluşturuldu. En kısa sürede işleme alınacak.",
        durationMs: 1500,
      });

      setReason("");
      await load(uid);
    } catch (e: any) {
      toast({ variant: "error", title: "Olmadı", message: e?.message ?? "Hata" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Card
        title="Hesap Silme"
        desc="Güvenli yöntem: Silme talebi oluşturulur. İşlem tamamlanınca hesabın kalıcı olarak kapatılır/silinir."
      >
        <div className="rounded-3xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-black/75 dark:text-white/75 leading-6">
          <b>Dikkat:</b> Hesap silme geri alınamaz. Mesajlar/ilanlar gibi veriler politikaya göre tamamen silinebilir veya anonimleştirilebilir.
        </div>

        {existing ? (
          <div className="mt-4 rounded-3xl border border-black/10 bg-black/5 p-4 text-sm text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <div className="font-black">Mevcut Talep</div>
            <div className="mt-1">Durum: <b className="uppercase">{existing.status}</b></div>
            <div className="mt-1">Tarih: <b>{new Date(existing.created_at).toLocaleString("tr-TR")}</b></div>
            {existing.reason ? <div className="mt-2 text-xs opacity-80">Not: {existing.reason}</div> : null}
          </div>
        ) : null}

        <div className="mt-4 rounded-3xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="text-xs font-extrabold text-black/60 dark:text-white/60">Silme sebebi (opsiyonel)</div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2 min-h-[110px] w-full resize-y rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-rose-500/25 dark:border-white/10 dark:bg-black/30"
            placeholder="Neden silmek istiyorsun? (opsiyonel)"
          />
        </div>

        <button
          disabled={saving}
          onClick={requestDelete}
          className={clsx(
            "mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-black transition",
            saving ? "bg-black/10 text-black/40 dark:bg-white/10 dark:text-white/40 cursor-not-allowed" : "bg-rose-500 text-white hover:bg-rose-400"
          )}
        >
          {saving ? "Gönderiliyor…" : "Hesap Silme Talebi Oluştur"}
        </button>
      </Card>
    </div>
  );
}