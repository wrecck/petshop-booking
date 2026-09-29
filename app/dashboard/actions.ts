"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
    price: z.coerce.number().min(0).max(100000),
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
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/groomers");
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
  revalidatePath("/dashboard/services");
}

export async function updateService(formData: FormData) {
  const parsed = z
    .object({
      serviceId: z.uuid(),
      name: z.string().trim().min(2).max(100),
      description: z.string().trim().max(240),
      duration: z.coerce.number().int().min(15).max(480),
      price: z.coerce.number().min(0).max(100000),
      active: z.enum(["true", "false"]),
    })
    .safeParse({
      serviceId: formData.get("serviceId"),
      name: formData.get("name"),
      description: formData.get("description"),
      duration: formData.get("duration"),
      price: formData.get("price"),
      active: formData.get("active"),
    });
  if (!parsed.success) return;

  const { supabase, shopId } = await getOwnerShopId();
  await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      duration_minutes: parsed.data.duration,
      price_cents: Math.round(parsed.data.price * 100),
      active: parsed.data.active === "true",
    })
    .eq("id", parsed.data.serviceId)
    .eq("shop_id", shopId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/services");
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

const reservedSlugs = new Set([
  "api",
  "auth",
  "book",
  "dashboard",
  "home",
  "login",
]);

export async function updateShopSettings(formData: FormData) {
  const schema = z.object({
    name: z.string().trim().min(2).max(100),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(60)
      .refine((slug) => !reservedSlugs.has(slug)),
    currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD", "NZD", "PHP"]),
    timezone: z.string().min(3).max(80),
    phone: z.string().trim().max(30),
    address: z.string().trim().max(200),
    city: z.string().trim().max(100),
    state: z.string().trim().max(100),
  });
  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
  });

  if (!parsed.success) redirect("/dashboard/settings?error=invalid-shop");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("shops")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_id", user.id);

  if (error) {
    redirect(
      `/dashboard/settings?error=${
        error.message.toLowerCase().includes("duplicate")
          ? "slug-taken"
          : "save-failed"
      }`,
    );
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/settings?saved=shop");
}

export async function updateOwnerAccount(formData: FormData) {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2).max(100),
      email: z.email().max(200),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
    });
  if (!parsed.success) redirect("/dashboard/settings?error=invalid-owner");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
    data: { full_name: parsed.data.fullName },
  });

  if (error) redirect("/dashboard/settings?error=owner-save-failed");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=owner");
}

async function getOwnerShopId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!shop) redirect("/auth/provision");
  return { supabase, shopId: shop.id };
}

export async function addGroomer(formData: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      role: z.string().trim().min(2).max(100),
    })
    .safeParse({
      name: formData.get("name"),
      role: formData.get("role"),
    });
  if (!parsed.success) return;

  const { supabase, shopId } = await getOwnerShopId();
  const { data: groomer } = await supabase
    .from("staff")
    .insert({
      shop_id: shopId,
      name: parsed.data.name,
      role: parsed.data.role,
      initials: parsed.data.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      color: "peach",
    })
    .select("id")
    .single();

  if (groomer) {
    const { data: services } = await supabase
      .from("services")
      .select("id")
      .eq("shop_id", shopId)
      .eq("active", true);
    if (services?.length) {
      await supabase.from("staff_services").insert(
        services.map((service) => ({
          staff_id: groomer.id,
          service_id: service.id,
        })),
      );
    }
  }

  revalidatePath("/dashboard/groomers");
}

export async function updateGroomer(formData: FormData) {
  const parsed = z
    .object({
      staffId: z.uuid(),
      name: z.string().trim().min(2).max(100),
      role: z.string().trim().min(2).max(100),
      active: z.enum(["true", "false"]),
    })
    .safeParse({
      staffId: formData.get("staffId"),
      name: formData.get("name"),
      role: formData.get("role"),
      active: formData.get("active"),
    });
  if (!parsed.success) return;

  const { supabase, shopId } = await getOwnerShopId();
  const { data: ownedServices } = await supabase
    .from("services")
    .select("id")
    .eq("shop_id", shopId);
  const ownedServiceIds = new Set(
    (ownedServices ?? []).map((service) => service.id),
  );
  const selectedServices = formData
    .getAll("services")
    .map(String)
    .filter((id) => ownedServiceIds.has(id));

  await supabase
    .from("staff")
    .update({
      name: parsed.data.name,
      role: parsed.data.role,
      active: parsed.data.active === "true",
      initials: parsed.data.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    })
    .eq("id", parsed.data.staffId)
    .eq("shop_id", shopId);

  await supabase
    .from("staff_services")
    .delete()
    .eq("staff_id", parsed.data.staffId);
  if (selectedServices.length) {
    await supabase.from("staff_services").insert(
      selectedServices.map((serviceId) => ({
        staff_id: parsed.data.staffId,
        service_id: serviceId,
      })),
    );
  }

  revalidatePath("/dashboard/groomers");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
