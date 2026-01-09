// components/pazar/PazarCard.tsx
import Link from "next/link";

export default function PazarCard({ item }: { item: any }) {
  const photo =
    item.photos?.[0]?.thumb_url ||
    item.photos?.[0]?.url ||
    "/no-image.png";

  const seller = item.profiles;

  return (
    <Link href={`/pazar/${item.id}`}>
      <div className="rounded-2xl bg-[#0f1a14] border border-white/10 p-3 hover:border-emerald-500 transition">
        <div className="relative">
          <img
            src={photo}
            className="h-40 w-full rounded-xl object-cover"
          />

          <button className="absolute top-2 right-2 bg-black/60 rounded-full p-2">
            ❤️
          </button>
        </div>

        <div className="mt-3 space-y-1">
          <div className="text-sm font-bold text-white">
            {item.title || item.product_name}
          </div>

          <div className="text-emerald-400 font-extrabold">
            {item.price?.toLocaleString("tr-TR")} ₺ / {item.unit}
          </div>

          <div className="text-xs text-white/60">
            📍 {item.city} / {item.district}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <img
              src={seller?.avatar_url || "/avatar.png"}
              className="h-7 w-7 rounded-full"
            />
            <span className="text-xs text-white/80">
              {seller?.company_name || seller?.full_name}
            </span>

            {seller?.is_premium && (
              <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                GOLD
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}