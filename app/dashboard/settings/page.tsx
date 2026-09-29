import { redirect } from "next/navigation";
import { CircleCheck, Store, UserRound } from "lucide-react";
import {
  updateOwnerAccount,
  updateShopSettings,
} from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

const errors: Record<string, string> = {
  "invalid-shop": "Check the shop name, URL, and other business details.",
  "slug-taken": "That booking URL is already used by another shop.",
  "save-failed": "The shop settings could not be saved.",
  "invalid-owner": "Check the owner name and email address.",
  "owner-save-failed": "The owner account could not be updated.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "name,slug,currency,timezone,phone,address,city,state",
    )
    .eq("owner_id", user.id)
    .single();
  if (!shop) redirect("/auth/provision");

  const params = await searchParams;
  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "";

  return (
    <div className="dashboard-shell">
      <section className="dashboard-welcome compact">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
          <p>Manage your shop identity, public URL, and owner account.</p>
        </div>
      </section>

      {params.error && (
        <p className="settings-alert error">
          {errors[params.error] ?? errors["save-failed"]}
        </p>
      )}
      {params.saved && (
        <p className="settings-alert success">
          <CircleCheck size={16} />
          {params.saved === "owner"
            ? "Owner account updated. Email changes may require confirmation."
            : "Shop settings saved."}
        </p>
      )}

      <div className="tenant-settings-grid">
        <section className="tenant-settings-card">
          <div className="settings-card-heading">
            <span><Store /></span>
            <div>
              <h2>Shop details</h2>
              <p>Used on your booking page and customer requests.</p>
            </div>
          </div>
          <form action={updateShopSettings}>
            <label className="wide">
              Pet shop name
              <input name="name" required defaultValue={shop.name} />
            </label>
            <label className="wide">
              Public booking URL
              <span className="settings-slug-input">
                <span>petshop-booking.vercel.app/</span>
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  defaultValue={shop.slug}
                />
              </span>
              <small>Changing this will make the previous URL stop working.</small>
            </label>
            <label>
              Currency
              <select name="currency" defaultValue={shop.currency ?? "USD"}>
                <option value="USD">USD — US Dollar</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="NZD">NZD — New Zealand Dollar</option>
              </select>
            </label>
            <label>
              Timezone
              <select name="timezone" defaultValue={shop.timezone}>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Central European Time</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </label>
            <label>
              Phone
              <input
                name="phone"
                type="tel"
                defaultValue={shop.phone ?? ""}
                placeholder="(503) 555-0142"
              />
            </label>
            <label>
              Street address
              <input
                name="address"
                defaultValue={shop.address ?? ""}
                placeholder="123 Maple Street"
              />
            </label>
            <label>
              City
              <input
                name="city"
                defaultValue={shop.city ?? ""}
                placeholder="Portland"
              />
            </label>
            <label>
              State / region
              <input
                name="state"
                defaultValue={shop.state ?? ""}
                placeholder="Oregon"
              />
            </label>
            <button className="primary-button wide">Save shop settings</button>
          </form>
        </section>

        <section className="tenant-settings-card owner">
          <div className="settings-card-heading">
            <span><UserRound /></span>
            <div>
              <h2>Owner account</h2>
              <p>Credentials used to access this dashboard.</p>
            </div>
          </div>
          <form action={updateOwnerAccount}>
            <label>
              Owner name
              <input name="fullName" required defaultValue={fullName} />
            </label>
            <label>
              Login email
              <input
                name="email"
                required
                type="email"
                defaultValue={user.email ?? ""}
              />
            </label>
            <p className="owner-note">
              Supabase may send confirmation links to both addresses when you
              change your login email.
            </p>
            <button className="primary-button">Save owner account</button>
          </form>
        </section>
      </div>
    </div>
  );
}
