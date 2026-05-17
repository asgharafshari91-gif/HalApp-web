import { redirect } from "next/navigation";
import ChatClient from "./ui/chat-client";

export const dynamic = "force-dynamic";

function safeId(v: any) {
  // Next param bazen encoded gelebiliyor
  try {
    return decodeURIComponent(String(v ?? "")).trim();
  } catch {
    return String(v ?? "").trim();
  }
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export default function ChatUserPage({
  params,
}: {
  params: { userId: string };
}) {
  const userId = safeId(params?.userId);

  // ✅ asla boş/yanlış uuid ile ChatClient render etme
  if (!userId || !isUuid(userId)) redirect("/conversations");

  return <ChatClient userId={userId} />;
}