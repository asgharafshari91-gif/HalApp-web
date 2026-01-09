"use client";

import PazarActiveToggle from "@/components/pazar/PazarActiveToggle";

type Props = {
  listing: {
    id: string;
    is_active: boolean;
    seller_id: string;
  };
  myUserId: string | null;
};

export default function PazarOwnerActions({ listing, myUserId }: Props) {
  // 👮 sadece ilan sahibi görsün
  if (!myUserId || listing.seller_id !== myUserId) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center gap-3">
      <PazarActiveToggle
        id={listing.id}
        initialActive={listing.is_active}
      />
    </div>
  );
}