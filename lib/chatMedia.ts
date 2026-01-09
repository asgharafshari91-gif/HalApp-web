// lib/chatMedia.ts
import { supabase } from "@/lib/supabaseClient";

export type ChatMediaType = "image" | "video" | "audio" | "file";

export type UploadResult = {
  publicUrl: string;
  path: string;
  mediaType: ChatMediaType;
  mime: string;
  bytes: number;
};

function guessType(mime: string): ChatMediaType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

export async function uploadChatMedia(file: File, uid: string): Promise<UploadResult> {
  const maxMB = 30; // video için yükselttik
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`Dosya çok büyük. Maksimum ${maxMB}MB.`);
  }

  const mime = file.type || "application/octet-stream";
  const mediaType = guessType(mime);

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${uid}/${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

  const { error: upErr } = await supabase.storage.from("chat_media").upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: mime,
  });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from("chat_media").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  return {
    publicUrl,
    path,
    mediaType,
    mime,
    bytes: file.size,
  };
}