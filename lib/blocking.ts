"use client";

import { supabase } from "@/lib/supabaseClient";

export async function getMyId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** Ben bu kullanıcıyı blocklamış mıyım? */
export async function iBlocked(userId: string): Promise<boolean> {
  const myId = await getMyId();
  if (!myId) return false;

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id", { head: true })
    .eq("blocker_id", myId)
    .eq("blocked_id", userId)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) ? data.length > 0 : false;
}

/** Karşı taraf beni blocklamış mı? */
export async function blockedMe(userId: string): Promise<boolean> {
  const myId = await getMyId();
  if (!myId) return false;

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id", { head: true })
    .eq("blocker_id", userId)
    .eq("blocked_id", myId)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) ? data.length > 0 : false;
}

export async function blockUser(userId: string) {
  const myId = await getMyId();
  if (!myId) throw new Error("Oturum yok.");

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: myId,
    blocked_id: userId,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function unblockUser(userId: string) {
  const myId = await getMyId();
  if (!myId) throw new Error("Oturum yok.");

  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", myId)
    .eq("blocked_id", userId);

  if (error) throw error;
}