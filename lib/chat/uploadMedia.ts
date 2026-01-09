import { supabase } from "@/lib/supabaseClient";

export type UploadKind = "image" | "video" | "audio";

export async function uploadChatMedia(params: {
  file: File;
  myId: string;
  peerId: string;
  kind: UploadKind;
}) {
  const { file, myId, peerId, kind } = params;

  const ext = (() => {
    const p = file.name.split(".").pop()?.toLowerCase();
    return p && p.length <= 10 ? p : "bin";
  })();

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const path = `${myId}/${peerId}/${Date.now()}_${kind}_${safeName}.${ext}`;

  const { error: upErr } = await supabase.storage.from("chat_media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;

  return {
    path,
    mime: file.type || null,
    size: file.size,
    name: file.name,
  };
}