"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(60),
  timezone: z.string().min(3).max(80),
});

export async function createShop(formData: FormData) {
  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid-shop");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_shop_with_defaults", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_timezone: parsed.data.timezone,
  });

  if (error) {
    const reason = error.message.toLowerCase().includes("duplicate")
      ? "slug-taken"
      : "setup-failed";
    redirect(`/dashboard?error=${reason}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateAppointmentStatus(formData: FormData) {
  const appointmentId = z.uuid().safeParse(formData.get("appointmentId"));
  const status = z
    .enum(["pending", "confirmed", "completed", "cancelled", "no_show"])
    .safeParse(formData.get("status"));

  if (!appointmentId.success || !status.success) return;

  const supabase = await createClient();
  await supabase
    .from("appointments")
    .update({ status: status.data, updated_at: new Date().toISOString() })
    .eq("id", appointmentId.data);

  revalidatePath("/dashboard");
}

export async function addService(formData: FormData) {
  const schema = z.object({
    shopId: z.uuid(),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(240),
    duration: z.coerce.number().int().min(15).max(480),
    price: z.coerce.number().min(0).max(10000),
  });
  const parsed = schema.safeParse({
    shopId: formData.get("shopId"),
    name: formData.get("name"),
    description: formData.get("description"),
    duration: formData.get("duration"),
    price: formData.get("price"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("shop_id", parsed.data.shopId)
    .eq("active", true);

  const { data: service } = await supabase
    .from("services")
    .insert({
      shop_id: parsed.data.shopId,
      name: parsed.data.name,
      description: parsed.data.description,
      duration_minutes: parsed.data.duration,
      price_cents: Math.round(parsed.data.price * 100),
    })
    .select("id")
    .single();

  if (service && staff?.length) {
    await supabase.from("staff_services").insert(
      staff.map((person) => ({
        staff_id: person.id,
        service_id: service.id,
      })),
    );
  }

  revalidatePath("/dashboard");
}

export async function toggleService(formData: FormData) {
  const serviceId = z.uuid().safeParse(formData.get("serviceId"));
  const active = z.enum(["true", "false"]).safeParse(formData.get("active"));
  if (!serviceId.success || !active.success) return;

  const supabase = await createClient();
  await supabase
    .from("services")
    .update({ active: active.data === "true" })
    .eq("id", serviceId.data);
  revalidatePath("/dashboard");
}

export async function saveBusinessHours(formData: FormData) {
  const shopId = z.uuid().safeParse(formData.get("shopId"));
  if (!shopId.success) return;

  const rows = Array.from({ length: 7 }, (_, day) => ({
    shop_id: shopId.data,
    day_of_week: day,
    opens_at: String(formData.get(`opens-${day}`) || "09:00"),
    closes_at: String(formData.get(`closes-${day}`) || "17:00"),
    closed: formData.get(`closed-${day}`) === "on",
  }));

  const supabase = await createClient();
  await supabase
    .from("business_hours")
    .upsert(rows, { onConflict: "shop_id,day_of_week" });
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
