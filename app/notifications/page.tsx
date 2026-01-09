"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/toast";

type NotifRow = {
  id: number;
  user_id: string;
  type: "message" | "system" | "listing";
  title: string;
  body: string;
  data: any;
  read_at: string | null;
  created_at: string;
};

function clsx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotifRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) {
        router.replace(`/auth?next=${encodeURIComponent("/notifications")}`);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems((data as any) ?? []);
    } catch (e: any) {
      toast({ variant: "error", title: "Yüklenemedi", message: e?.message ?? "Hata" });
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: number) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setItems((x) => x.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    } catch (e: any) {
      toast({ variant: "error", title: "Güncellenemedi", message: e?.message ?? "Hata" });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="rounded-[28px] border border-black/10 bg-white/80 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-xl font-black">Bildirimler</div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">
          Push ile gelenler burada da görünür. Okundu durumunu yönetebilirsin.
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-black/10 bg-black/5 p-6 text-sm text-black/65 dark:border-white/10 dark:bg-white/5 dark:text-white/65">
          Henüz bildirim yok.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const unread = !n.read_at;
            const url = n.data?.url as string | undefined;

            return (
              <div
                key={n.id}
                className={clsx(
                  "rounded-[22px] border p-5",
                  unread
                    ? "border-emerald-500/25 bg-emerald-500/10"
                    : "border-black/10 bg-white/80 dark:border-white/10 dark:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-black">{n.title}</div>
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">{n.body}</div>
                    <div className="mt-2 text-[11px] text-black/45 dark:text-white/45">
                      {new Date(n.created_at).toLocaleString("tr-TR")}
                      {" • "}
                      Tip: {n.type}
                      {unread ? " • Okunmadı" : " • Okundu"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {unread ? (
                      <button
                        onClick={() => markRead(n.id)}
                        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-black hover:bg-emerald-400 transition"
                      >
                        Okundu Yap
                      </button>
                    ) : null}

                    {url ? (
                      <button
                        onClick={() => router.push(url)}
                        className="rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 transition"
                      >
                        Aç
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}