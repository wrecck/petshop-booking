import type { Shopfront } from "@/lib/types";

export const DEMO_SHOP_SLUG = "paws-and-co";

export const demoShopfront: Shopfront = {
  shop: {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Paws & Co.",
    slug: DEMO_SHOP_SLUG,
    timezone: "America/Los_Angeles",
    currency: "USD",
    address: "123 Maple Street",
    city: "Portland",
    state: "OR",
    phone: "(503) 555-0142",
  },
  services: [
    {
      id: "20000000-0000-4000-8000-000000000001",
      shop_id: "10000000-0000-4000-8000-000000000001",
      name: "The Full Groom",
      description: "Bath, haircut, nail trim & finishing spritz",
      duration_minutes: 90,
      price_cents: 8500,
    },
    {
      id: "20000000-0000-4000-8000-000000000002",
      shop_id: "10000000-0000-4000-8000-000000000001",
      name: "Bath & Brush",
      description: "Deep-cleansing bath, blow-dry & brush out",
      duration_minutes: 60,
      price_cents: 5500,
    },
    {
      id: "20000000-0000-4000-8000-000000000003",
      shop_id: "10000000-0000-4000-8000-000000000001",
      name: "Puppy’s First Visit",
      description: "A gentle introduction for pups under 6 months",
      duration_minutes: 45,
      price_cents: 4500,
    },
  ],
  staff: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      shop_id: "10000000-0000-4000-8000-000000000001",
      name: "Mia",
      role: "Senior groomer",
      initials: "MR",
      color: "peach",
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      shop_id: "10000000-0000-4000-8000-000000000001",
      name: "Sam",
      role: "Groomer & puppy specialist",
      initials: "SL",
      color: "blue",
    },
  ],
};
