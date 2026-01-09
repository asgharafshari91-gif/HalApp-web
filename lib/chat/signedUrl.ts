import { supabase } from "@/lib/supabaseClient";

export async function getSignedChatMediaUrl(path: string, expiresInSec = 60 * 10) {
  const { data, error } = await supabase.storage
    .from("chat_media")
    .createSignedUrl(path, expiresInSec);

  if (error) throw error;
  return data.signedUrl;
}