"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { timeAgoTR } from "@/lib/time";

type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  city: string | null;
  district: string | null;
  is_premium: boolean | null;
};

type Listing = {
  id: string;
  product_name: string | null;
  title: string | null;
  price: number | null;
  unit: string | null;
  created_at: string;
};

function sellerName(p?: Profile | null) {
  if (!p) return "Satıcı";
  const c = (p.company_name ?? "").trim();
  const f = (p.full_name ?? "").trim();
  return c || f || "Satıcı";
}

function moneyTR(n?: number | null) {
  if (n == null) return "";
  return new Intl.NumberFormat("tr-TR").format(n);
}

export default function UserPublicClient({ id }: { id: string }) {
  const [p, setP] = useState<Profile | null>(null);
  const [list, setList] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data: prof } = await supabase.from("profiles").select("id,full_name,company_name,avatar_url,city,district,is_premium").eq("id", id).maybeSingle();
      const { data: ls } = await supabase.from("listings").select("id,product_name,title,price,unit,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(24);

      if (!mounted) return;
      setP((prof as any) ?? null);
      setList((ls as any) ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/10 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-3xl ring-1 ring-black/10 bg-white/70 dark:ring-white/10 dark:bg-black/25">
              {p?.avatar_url ? <Image src={p.avatar_url} alt="avatar" fill className="object-cover" /> : null}
            </div>
            <div>
              <div className="text-lg font-black text-zinc-900 dark:text-white">
                {sellerName(p)}
                {p?.is_premium ? (
                  <span className="ml-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs font-black text-emerald-800 dark:text-emerald-200">
                    Premium
                  </span>
                ) : null}
              </div>
              <div className="text-sm text-black/60 dark:text-white/60">
                {(p?.city ?? "") + (p?.district ? ` / ${p.district}` : "")}
              </div>
            </div>
          </div>

          <Link href="/pazar" className="rounded-2xl bg-black/5 px-4 py-2 text-sm font-black dark:bg-white/5">
            ← Pazar
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white/70 p-6 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="text-sm font-black text-zinc-900 dark:text-white">İlanlar</div>

        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-2xl bg-black/10 dark:bg-white/10" />
        ) : list.length === 0 ? (
          <div className="mt-4 text-sm text-black/60 dark:text-white/60">Bu satıcının ilanı yok.</div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((x) => (
              <Link
                key={x.id}
                href={`/pazar/${x.id}`}
                className="rounded-2xl border border-black/10 bg-white/70 p-4 hover:bg-white/85 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
              >
                <div className="text-sm font-black text-zinc-900 dark:text-white">{x.product_name || x.title || "İlan"}</div>
                <div className="mt-1 text-xs text-black/60 dark:text-white/60">{timeAgoTR(x.created_at)}</div>
                <div className="mt-3 text-sm font-black text-zinc-900 dark:text-white">
                  {x.price != null ? `${moneyTR(x.price)} ₺` : "—"} <span className="text-xs text-black/60 dark:text-white/60">{x.unit ? `/ ${x.unit}` : ""}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}