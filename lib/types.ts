import type { BrandingTheme, ShopPage } from "@/lib/branding";

export type Shop = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
} & BrandingTheme;

export type Service = {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
};

export type Staff = {
  id: string;
  shop_id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
};

export type Shopfront = {
  shop: Shop;
  services: Service[];
  staff: Staff[];
  pages: ShopPage[];
};

export type AvailabilitySlot = {
  starts_at: string;
  display_time: string;
  staff_id: string;
  staff_name: string;
};
