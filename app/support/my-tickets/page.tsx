"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Ticket = {
  id: number;
  ticket_no: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
};

function statusColor(status: string) {
  switch (status) {
    case "resolved":
      return "bg-emerald-500/10 text-emerald-700";
    case "review":
      return "bg-blue-500/10 text-blue-700";
    case "answered":
      return "bg-violet-500/10 text-violet-700";
    default:
      return "bg-orange-500/10 text-orange-700";
  }
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setTickets(data || []);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-700">
          DESTEK TALEPLERİM
        </div>

        <h1 className="mt-4 text-4xl font-black">
          Ticket Takibi
        </h1>

        <p className="mt-2 text-zinc-500">
          Açtığın destek taleplerini buradan takip edebilirsin.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border p-10 text-center font-black">
          Yükleniyor...
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-3xl border p-10 text-center">
          <div className="text-5xl">🎫</div>

          <div className="mt-4 text-xl font-black">
            Henüz destek talebin yok
          </div>

          <p className="mt-2 text-zinc-500">
            Destek merkezinden yeni ticket oluşturabilirsin.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-[28px] border border-black/10 bg-white/80 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-emerald-700">
                    {ticket.ticket_no}
                  </div>

                  <div className="mt-1 text-lg font-black">
                    {ticket.subject}
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
                    {ticket.category}
                  </div>
                </div>

                <div
                  className={`rounded-full px-4 py-2 text-xs font-black ${statusColor(
                    ticket.status
                  )}`}
                >
                  {ticket.status}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
                <span>
                  Öncelik: {ticket.priority}
                </span>

                <span>
                  {new Date(ticket.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}