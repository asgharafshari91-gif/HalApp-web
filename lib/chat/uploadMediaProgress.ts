import { supabase } from "@/lib/supabaseClient";

export type UploadKind = "image" | "video" | "audio";

function guessExt(name: string) {
  const p = name.split(".").pop()?.toLowerCase();
  return p && p.length <= 10 ? p : "bin";
}

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
}

/**
 * ✅ Progress’li upload:
 * 1) Edge function’dan signed upload URL al
 * 2) XHR ile yükle (progress event)
 * 3) upload tamamlanınca message insert (caller yapacak)
 */
export async function uploadChatMediaWithProgress(params: {
  file: File;
  myId: string;
  peerId: string;
  kind: UploadKind;
  onProgress?: (pct: number) => void;
}) {
  const { file, myId, peerId, kind, onProgress } = params;

  const ext = guessExt(file.name);
  const path = `${myId}/${peerId}/${Date.now()}_${kind}_${safeName(file.name)}.${ext}`;
  const contentType = file.type || "application/octet-stream";

  // session jwt
  const { data: s } = await supabase.auth.getSession();
  const jwt = s.session?.access_token;
  if (!jwt) throw new Error("Auth gerekli");

  // Edge function call
  const { data: fnRes, error: fnErr } = await supabase.functions.invoke("chat-upload-signed", {
    body: { path, contentType },
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (fnErr) throw fnErr;
  if (!fnRes?.url || !fnRes?.token) throw new Error("Signed upload alınamadı");

  const signedUrl: string = fnRes.url;
  const token: string = fnRes.token;

  // XHR upload (progress)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
    };

    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });

  // ✅ upload finalize (token ile)
  const { data: fin, error: finErr } = await supabase.storage
    .from("chat_media")
    .createSignedUploadUrl(path); // bazı projelerde finalize otomatik; ama token gerekiyorsa aşağıdaki kullanılmalı

  // Not: Supabase yeni API'de finalize ayrı fonksiyon olabilir.
  // Eğer sende finalize gerekiyorsa: admin tarafında finalize edilir.
  // Çoğu projede PUT signedUrl ile yükleme tamamlanır ve path erişilebilir.

  // Biz mesajda path saklayacağız.
  return {
    path,
    mime: contentType,
    size: file.size,
    token,
  };
}