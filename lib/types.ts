export type SellerProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  kyc_status: string | null;
  is_online: boolean;
  last_seen_at: string | null;
};

export type Listing = {
  id: string;
  title: string | null;
  description: string | null;
  product_type: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  market_name: string | null;
  price_per_unit: number | null;
  unit: string | null;
  min_quantity: number | null;
  is_active: boolean | null;
  is_boosted: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  seller_id: string | null;
  post_type: string | null;
  product_name: string | null;
  quantity: number | null;
  price: number | null;
  min_price: number | null;
  max_price: number | null;
  deleted_at: string | null;

  // ✅ JOIN ile gelen alan:
  seller?: SellerProfile | null;
};