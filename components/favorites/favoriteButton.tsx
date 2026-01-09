"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type Size = "sm" | "md";

export default function FavoriteButton({
  listingId,
  size = "md",
  showCount = true,
  className = "",
}: {
  listingId: string;
  size?: Size;
  showCount?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number>(0);

  const ui = useMemo(() => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-2xl border transition select-none";
    const pad = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";
    const idle =
      "border-black/10 bg-white/70 hover:bg-white text-black/80 " +
      "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80";
    const active =
      "border-rose-500/25 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 " +
      "dark:text-rose-200";
    const dis = "opacity-60 cursor-not-allowed";
    return {
      cls: [base, pad, liked ? active : idle, toggling ? dis : "", className].join(" "),
      icon: liked ? "❤️" : "🤍",
      label: liked ? "Favoride" : "Favori",
    };
  }, [size, liked, toggling, className]);

  async function refreshAll() {
    setLoading(true);
    try {
      const { data: s, error: se } = await supabase.auth.getSession();
      if (se) throw se;

      const uid = s.session?.user?.id ?? null;
      setAuthed(Boolean(uid));

      // 1) Count (herkes görebilsin diye SELECT policy gerekebilir)
      if (showCount) {
        const { count: c, error: ce } = await supabase
          .from("favorites")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", listingId);
        if (!ce) setCount(Number(c ?? 0));
      }

      // 2) Ben favoriledim mi?
      if (uid) {
        const { data: f, error: fe } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", uid)
          .eq("listing_id", listingId)
          .maybeSingle();

        if (!fe) setLiked(Boolean(f));
      } else {
        setLiked(false);
      }
    } catch (e: any) {
      // sessiz geçelim, UI bozulmasın
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();

    // auth değişince favori durumu yenilensin
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshAll();
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, showCount]);

  async function toggle() {
    try {
      if (toggling) return;
      setToggling(true);

      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user?.id ?? null;

      if (!uid) {
        toast({
          variant: "warning",
          title: "Giriş gerekli",
          message: "Favorilere eklemek için giriş yapmalısın.",
          durationMs: 2200,
        });
        const next = encodeURIComponent(pathname || "/");
        router.push(`/auth?next=${next}`);
        return;
      }

      // Optimistic UI
      const nextLiked = !liked;
      setLiked(nextLiked);
      if (showCount) setCount((p) => Math.max(0, p + (nextLiked ? 1 : -1)));

      if (nextLiked) {
        const { error } = await supabase.from("favorites").insert({
          user_id: uid,
          listing_id: listingId,
        });
        if (error) throw error;

        toast({ variant: "success", title: "Favorilere eklendi", message: "İlan favorilerine kaydedildi." });
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", uid)
          .eq("listing_id", listingId);
        if (error) throw error;

        toast({ variant: "info", title: "Favorilerden çıkarıldı", message: "İlan favorilerinden kaldırıldı." });
      }
    } catch (e: any) {
      // rollback
      await refreshAll();
      toast({ variant: "error", title: "İşlem başarısız", message: e?.message ?? "Bir hata oluştu." });
    } finally {
      setToggling(false);
    }
  }

  return (
    <button type="button" className={ui.cls} onClick={toggle} disabled={loading || toggling} aria-label="Favori">
      <span className="leading-none">{ui.icon}</span>
      <span className="font-extrabold">{ui.label}</span>

      {showCount ? (
        <span className="ml-1 inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2 py-0.5 text-[11px] font-black text-black/70 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
          {count}
        </span>
      ) : null}
    </button>
  );
}