import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { demoShopfront, DEMO_SHOP_SLUG } from "@/lib/demo-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilitySlot } from "@/lib/types";

const querySchema = z.object({
  shop: z.string().min(2).max(80),
  service: z.uuid(),
  staff: z.uuid().optional(),
  date: z.iso.date(),
});

const demoTimes = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getDemoSlots(
  date: string,
  staffId?: string,
): AvailabilitySlot[] {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (day === 0) return [];

  const availableStaff = staffId
    ? demoShopfront.staff.filter((person) => person.id === staffId)
    : demoShopfront.staff;

  return demoTimes
    .filter((_, index) => (Number(date.slice(-2)) + index) % 7 !== 0)
    .map((time, index) => {
      const person = availableStaff[index % availableStaff.length];
      return {
        starts_at: `${date}T${time}:00-07:00`,
        display_time: formatTime(time),
        staff_id: person.id,
        staff_name: person.name,
      };
    });
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    shop: request.nextUrl.searchParams.get("shop"),
    service: request.nextUrl.searchParams.get("service"),
    staff: request.nextUrl.searchParams.get("staff") || undefined,
    date: request.nextUrl.searchParams.get("date"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid availability request." },
      { status: 400 },
    );
  }

  if (
    request.nextUrl.searchParams.get("demo") === "true" ||
    !hasSupabaseConfig()
  ) {
    if (parsed.data.shop !== DEMO_SHOP_SLUG) {
      return NextResponse.json({ slots: [] });
    }
    return NextResponse.json({
      slots: getDemoSlots(parsed.data.date, parsed.data.staff),
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_shop_slug: parsed.data.shop,
    p_service_id: parsed.data.service,
    p_staff_id: parsed.data.staff ?? null,
    p_date: parsed.data.date,
  });

  if (error) {
    return NextResponse.json(
      { error: "Unable to load availability." },
      { status: 500 },
    );
  }

  return NextResponse.json({ slots: data ?? [] });
}
