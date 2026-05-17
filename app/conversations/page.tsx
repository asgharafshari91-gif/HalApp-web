// app/conversations/page.tsx
import { Suspense } from "react";
import ConversationsClient from "./ui/conversations-client";

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70">Yükleniyor…</div>}>
      <ConversationsClient />
    </Suspense>
  );
}