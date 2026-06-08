import { redirect } from "next/navigation";
import ChatClient from "./ui/chat-client";

export const dynamic = "force-dynamic";

function safeId(v: unknown) {
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

export default async function ChatUserPage({
  params,
}: {
  params:
    | {
        userId?: string;
      }
    | Promise<{
        userId?: string;
      }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const userId = safeId(resolvedParams?.userId);

  if (!userId || !isUuid(userId)) {
    redirect("/conversations");
  }

  return <ChatClient userId={userId} />;
}