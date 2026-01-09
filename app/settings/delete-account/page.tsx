"use client";

import { useEffect, useState } from "react";
import { BackBar, Card } from "../_ui";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/me";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const me = useMe();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user?.id ?? null;
      if (!u) {
        router.replace(`/auth?next=${encodeURIComponent("/settings/delete-account")}`);
        return;
      }
      setUid(u);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestDelete() {
    if (!uid) return;

    if (!confirm) {
      toast({ variant: "warning", title: "Onay gerekli", message: "Devam etmek için onay kutusunu işaretle." });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("account_deletion_requests").upsert(
        {
          user_id: uid,
          reason: reason.trim() || null,
          status: "requested",
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast({
        variant: "success",
        title: "Talep alındı",
        message: "Hesap silme talebin alındı. Güvenlik için oturum kapatılıyor.",
      });

      // güvenlik: çıkış yap
      await me.signOut();
      router.push("/");
    } catch (e: any) {
      toast({ variant: "error", title: "Oluşturulamadı", message: e?.message ?? "Hata oluştu." });
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
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <BackBar title="Hesap Silme" />

      <Card
        title="Hesap Silme Talebi"
        desc="Bu işlem geri alınamaz. Talep oluşturulur, ardından admin/otomasyon hesabı siler."
      >
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-black/70 dark:text-white/70 leading-6">
          <b>Dikkat:</b> Hesabın silinince mesajların/ilanların görünürlüğü politikaya göre kaldırılabilir. Eğer emin
          değilsen önce “Engellediklerim” veya “Bildirim ayarları” gibi seçenekleri dene.
        </div>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-2">
            <div className="text-xs font-black text-black/70 dark:text-white/70">Silme sebebi (opsiyonel)</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Kısaca sebebini yazabilirsin…"
              className="w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/5">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <div className="text-sm text-black/75 dark:text-white/75 leading-6">
              Hesabımın silinmesini talep ediyorum ve bunun geri alınamayacağını anladım.
            </div>
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={requestDelete}
            className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400 transition disabled:opacity-60"
          >
            {saving ? "Talep oluşturuluyor…" : "Hesabı Silme Talebi Oluştur"}
          </button>
        </div>
      </Card>
    </div>
  );
}