import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Admin dashboard endpoint placeholder.
 * Şimdilik build kırılmasın diye minimal GET döndürüyoruz.
 * İstersen sonra gerçek admin istatistiklerini buraya koyarız.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "admin dashboard api is ready",
  });
}