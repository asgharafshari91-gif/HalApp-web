"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { blockUser, unblockUser, iBlocked, blockedMe, getMyId } from "@/lib/blocking";

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function BlockButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [myId, setMyId] = useState<string | null>(null);
  const [iBlock, setIBlock] = useState(false);
  const [theyBlock, setTheyBlock] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const uid = await getMyId();
        if (!mounted) return;
        setMyId(uid);

        if (!uid) {
          setLoading(false);
          return;
        }
        if (uid === targetUserId) {
          setLoading(false);
          return;
        }

        const [a, b] = await Promise.all([iBlocked(targetUserId), blockedMe(targetUserId)]);
        if (!mounted) return;
        setIBlock(a);
        setTheyBlock(b);
      } catch (e: any) {
        toast({ variant: "error", title: "Hata", message: e?.message ?? "Yüklenemedi" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId]);

  async function ensureLogin() {
    if (myId) return true;
    router.push(`/auth?next=${encodeURIComponent(`/profile/${targetUserId}`)}`);
    return false;
  }

  async function toggle() {
    if (!(await ensureLogin())) return;
    if (!myId || myId === targetUserId) return;

    setBusy(true);
    try {
      if (iBlock) {
        await unblockUser(targetUserId);
        setIBlock(false);
        toast({ variant: "success", title: "Kaldırıldı", message: "Engel kaldırıldı.", durationMs: 1200 });
      } else {
        await blockUser(targetUserId);
        setIBlock(true);
        toast({ variant: "info", title: "Engellendi", message: "Kullanıcı engellendi.", durationMs: 1200 });
      }
    } catch (e: any) {
      toast({ variant: "error", title: "İşlem başarısız", message: e?.message ?? "Hata" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-black/5 px-4 py-2 text-xs font-extrabold text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
        Yükleniyor…
      </div>
    );
  }

  if (!myId || myId === targetUserId) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {theyBlock ? (
        <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
          Bu kullanıcı seni engellemiş.
        </span>
      ) : null}

      <button
        onClick={toggle}
        disabled={busy}
        className={clsx(
          "rounded-2xl px-4 py-2 text-xs font-black transition",
          iBlock ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-rose-500 text-white hover:bg-rose-400",
          busy && "opacity-70 cursor-not-allowed"
        )}
      >
        {busy ? "İşleniyor…" : iBlock ? "Engeli Kaldır" : "Engelle"}
      </button>
    </div>
  );
}