import { NextResponse } from "next/server";
import { supabaseRouteClient } from "@/lib/supabaseRoute";

export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET() {
  const sb = await supabaseRouteClient();
  const { data: auth, error } = await sb.auth.getUser();
  if (error) return json({ error: error.message }, 400);

  const user = auth?.user;
  return json({ user: user ? { id: user.id, email: user.email } : null });
}