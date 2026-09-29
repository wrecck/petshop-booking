import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const bookingSchema = z.object({
  shopSlug: z.string().min(2).max(80),
  serviceId: z.uuid(),
  staffId: z.uuid(),
  startsAt: z.iso.datetime({ offset: true }),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.email().max(200),
  customerPhone: z.string().trim().min(7).max(30),
  petName: z.string().trim().min(1).max(80),
  petType: z.string().trim().max(40).default("Dog"),
  petBreed: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(1000).optional(),
  demo: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = bookingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the booking details and try again." },
      { status: 400 },
    );
  }

  if (parsed.data.demo || !hasSupabaseConfig()) {
    return NextResponse.json({
      appointmentId: crypto.randomUUID(),
      demo: true,
    });
  }

  const supabase = await createClient();
  const booking = parsed.data;
  const { data, error } = await supabase.rpc("book_appointment", {
    p_shop_slug: booking.shopSlug,
    p_service_id: booking.serviceId,
    p_staff_id: booking.staffId,
    p_starts_at: booking.startsAt,
    p_customer_name: booking.customerName,
    p_customer_email: booking.customerEmail,
    p_customer_phone: booking.customerPhone,
    p_pet_name: booking.petName,
    p_pet_type: booking.petType,
    p_pet_breed: booking.petBreed ?? null,
    p_notes: booking.notes ?? null,
  });

  if (error) {
    const conflict = error.message.toLowerCase().includes("available");
    return NextResponse.json(
      {
        error: conflict
          ? "That time was just booked. Please choose another."
          : "We could not complete the booking. Please try again.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ appointmentId: data });
}
