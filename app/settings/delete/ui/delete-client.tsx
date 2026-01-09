"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function DeleteClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toast } = useToast();

  const next = useMemo(() => (sp.get("next") || "/").trim(), [sp]);

  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    try {
      setBusy(true);

      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id;
      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/settings/delete")}`);
        return;
      }

      if (confirmText.trim().toUpperCase() !== "SIL") {
        toast({
          variant: "warning",
          title: "Onay gerekli",
          message: 'Devam etmek için kutuya "SIL" yazmalısın.',
        });
        return;
      }

      // ✅ Burada hesap silme server-side olmalı (API route / Edge Function)
      // A) API route varsa:
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: uid }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Silme isteği başarısız (HTTP ${res.status})`);
      }

      await supabase.auth.signOut();

      toast({ variant: "success", title: "Hesap silindi", message: "Yönlendiriliyorsun…" });
      router.replace(next || "/");
    } catch (e: any) {
      toast({ variant: "error", title: "Silinemedi", message: e?.message ?? "Hata oluştu." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 sm:p-0">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-2xl font-black tracking-tight text-black/90 dark:text-white">
          Hesabı Sil
        </div>
        <div className="mt-2 text-sm text-black/60 dark:text-white/60 leading-6">
          Bu işlem geri alınamaz. Devam etmek için aşağıya <b>SIL</b> yaz.
        </div>

        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-black/75 dark:text-white/70">
          <b>Dikkat:</b> Hesabın kalıcı olarak kapanır.
        </div>

        <div className="mt-4">
          <div className="text-xs font-extrabold text-black/55 dark:text-white/55">Onay</div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='SIL yaz...'
            className={clsx(
              "mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-extrabold text-black/80 outline-none",
              "focus:ring-2 focus:ring-rose-500/35",
              "dark:border-white/10 dark:bg-black/30 dark:text-white/85"
            )}
          />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-extrabold text-black/75 hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10 transition"
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className={clsx(
              "rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-black hover:bg-rose-400 transition",
              busy && "opacity-60 cursor-not-allowed"
            )}
          >
            {busy ? "Siliniyor…" : "Hesabı Kalıcı Sil"}
          </button>
        </div>
      </div>
    </div>
  );
}