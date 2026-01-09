// app/u/[id]/ui/user-public-shell.tsx
"use client";

import dynamic from "next/dynamic";

const UserPublicClient = dynamic(() => import("./user-public-client"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-[22px] border border-black/10 bg-white/70 p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60">
        Yükleniyor…
      </div>
    </div>
  ),
});

export default function UserPublicShell({ id }: { id: string }) {
  return <UserPublicClient id={id} />;
}