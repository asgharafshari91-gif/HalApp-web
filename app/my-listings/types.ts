export type ListingMediaType = "image" | "video";

export type Listing = {
  id: string;

  title: string;
  description: string | null;

  product_type: string | null;
  product_name: string | null;

  city: string | null;
  district: string | null;
  neighborhood: string | null;

  market_name: string | null;

  price_per_unit: number | null;
  unit: string | null;

  min_quantity: number | null;
  quantity: number | null;

  price: number | null;
  min_price: number | null;
  max_price: number | null;

  is_active: boolean;
  is_boosted: boolean;

  expires_at: string | null; // date (YYYY-MM-DD)
  created_at: string;

  district_id?: string | null;

  seller_id: string;

  post_type: string | null;

  deleted_at: string | null;

  boost_until: string | null;
  boost_score: number | null;

  // ✅ NEW (çoklu medya)
  media_urls: string[] | null;     // text[]
  media_types: ListingMediaType[] | null; // text[] ("image"|"video")
};

export type ListingUpdatePatch = Pick<
  Listing,
  | "id"
  | "title"
  | "description"
  | "product_type"
  | "product_name"
  | "city"
  | "district"
  | "neighborhood"
  | "market_name"
  | "price_per_unit"
  | "unit"
  | "min_quantity"
  | "quantity"
  | "price"
  | "min_price"
  | "max_price"
  | "post_type"
  | "is_active"
  | "expires_at"
  | "media_urls"
  | "media_types"
>;