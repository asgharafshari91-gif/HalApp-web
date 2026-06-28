"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, User, ShieldCheck, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";

type ResultItem = {
  id: string;
  type: "user" | "kyc" | "ticket";
  title: string;
  subtitle?: string;
};

export default function AdminGlobalSearch() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;

      if (cmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((s) => !s);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);

        const r = await fetch(
          `/api/admin/search?q=${encodeURIComponent(q.trim())}`,
          { cache: "no-store" }
        );

        const j = await r.json();

        if (r.ok) {
          setResults(j.items ?? []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [q]);

  const count = useMemo(() => results.length, [results]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="
          flex h-11 items-center gap-2 rounded-2xl
          border border-black/10 bg-white/80
          px-4 text-sm font-black
          hover:bg-white
          dark:border-white/10
          dark:bg-white/[0.04]
        "
      >
        <Search size={16} />
        Ara...
        <span className="ml-2 rounded-lg bg-black/5 px-2 py-1 text-[10px] dark:bg-white/10">
          Ctrl K
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm">
      <div className="mx-auto mt-24 w-full max-w-2xl px-4">
        <div
          className="
            overflow-hidden rounded-[30px]
            border border-black/10
            bg-white shadow-2xl
            dark:border-white/10
            dark:bg-zinc-950
          "
        >
          <div className="border-b border-black/10 dark:border-white/10">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Kullanıcı, KYC veya Ticket ara..."
              className="
                h-16 w-full bg-transparent
                px-6 text-lg font-black
                outline-none
              "
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-sm font-semibold">
                Aranıyor...
              </div>
            ) : count === 0 ? (
              <div className="p-6 text-sm font-semibold text-black/50 dark:text-white/50">
                Sonuç bulunamadı.
              </div>
            ) : (
              results.map((item) => {
                const icon =
                  item.type === "user" ? (
                    <User size={16} />
                  ) : item.type === "kyc" ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <Ticket size={16} />
                  );

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (item.type === "user") {
                        router.push(`/admin/users/${item.id}`);
                      }

                      if (item.type === "kyc") {
                        router.push(`/admin/kyc/${item.id}`);
                      }

                      if (item.type === "ticket") {
                        router.push(`/admin/support/${item.id}`);
                      }

                      setOpen(false);
                    }}
                    className="
                      flex w-full items-start gap-3
                      border-b border-black/5
                      px-5 py-4 text-left
                      hover:bg-black/[0.03]
                      dark:border-white/5
                      dark:hover:bg-white/[0.03]
                    "
                  >
                    <div className="mt-1">{icon}</div>

                    <div>
                      <div className="font-black">
                        {item.title}
                      </div>

                      <div className="text-xs text-black/55 dark:text-white/55">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-black/10 px-4 py-3 text-xs font-semibold text-black/50 dark:border-white/10 dark:text-white/50">
            ESC kapat • Ctrl+K aç
          </div>
        </div>
      </div>
    </div>
  );
}