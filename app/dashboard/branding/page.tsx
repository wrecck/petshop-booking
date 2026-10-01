import Link from "next/link";
import { CircleCheck, ExternalLink, FileText } from "lucide-react";
import {
  createShopPage,
  deleteShopPage,
  updateShopPage,
} from "@/app/dashboard/actions";
import { BrandingForm } from "@/app/dashboard/branding/branding-form";
import { DEFAULT_BRANDING, type BrandingTheme, type ShopPage } from "@/lib/branding";
import { getDashboardContext } from "@/lib/dashboard-context";

const errors: Record<string, string> = {
  "invalid-branding": "Check the theme colors and hero copy.",
  "save-failed": "We could not save your branding.",
  "invalid-page": "Check the page title, URL, and content.",
  "page-slug-taken": "That page URL is already used in your shop.",
  "page-save-failed": "We could not save the info page.",
};

export default async function BrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { supabase, shop } = await getDashboardContext();
  const params = await searchParams;
  const { data: pages } = await supabase
    .from("shop_pages")
    .select("id,shop_id,title,slug,content,published,sort_order")
    .eq("shop_id", shop.id)
    .order("sort_order");

  const branding: BrandingTheme = {
    ...DEFAULT_BRANDING,
    theme_preset: shop.theme_preset ?? DEFAULT_BRANDING.theme_preset,
    primary_color: shop.primary_color ?? DEFAULT_BRANDING.primary_color,
    accent_color: shop.accent_color ?? DEFAULT_BRANDING.accent_color,
    background_color:
      shop.background_color ?? DEFAULT_BRANDING.background_color,
    surface_color: shop.surface_color ?? DEFAULT_BRANDING.surface_color,
    text_color: shop.text_color ?? DEFAULT_BRANDING.text_color,
    hero_title: shop.hero_title || DEFAULT_BRANDING.hero_title,
    hero_subtitle: shop.hero_subtitle || DEFAULT_BRANDING.hero_subtitle,
    show_ratings: shop.show_ratings ?? true,
  };
  const pageRows = (pages ?? []) as ShopPage[];

  return (
    <div className="dashboard-shell">
      <section className="dashboard-welcome compact">
        <div>
          <p className="eyebrow">Appearance</p>
          <h1>Branding</h1>
          <p>
            Customize your booking page look and publish simple info pages for
            customers.
          </p>
        </div>
        <Link className="primary-button" href={`/${shop.slug}`} target="_blank">
          Preview booking page <ExternalLink size={16} />
        </Link>
      </section>

      {params.error && (
        <p className="settings-alert error">
          {errors[params.error] ?? errors["save-failed"]}
        </p>
      )}
      {params.saved && (
        <p className="settings-alert success">
          <CircleCheck size={16} />
          {params.saved === "branding"
            ? "Branding saved."
            : params.saved === "page-deleted"
              ? "Info page deleted."
              : "Info page saved."}
        </p>
      )}

      <BrandingForm initial={branding} shopName={shop.name} />

      <section className="tenant-settings-card pages-panel">
        <div className="settings-card-heading">
          <span>
            <FileText />
          </span>
          <div>
            <h2>Custom info pages</h2>
            <p>
              Add pages like About, Policies, or FAQ. They appear in your public
              booking header.
            </p>
          </div>
        </div>

        <div className="info-page-admin-list">
          {pageRows.map((page) => (
            <form
              className="info-page-admin-card"
              action={updateShopPage}
              key={page.id}
            >
              <input type="hidden" name="pageId" value={page.id} />
              <label>
                Title
                <input name="title" required defaultValue={page.title} />
              </label>
              <label>
                Page URL
                <span className="settings-slug-input">
                  <span>/{shop.slug}/pages/</span>
                  <input
                    name="slug"
                    required
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    defaultValue={page.slug}
                  />
                </span>
              </label>
              <label className="wide">
                Content
                <textarea
                  name="content"
                  required
                  rows={5}
                  defaultValue={page.content}
                />
              </label>
              <label>
                Visibility
                <select
                  name="published"
                  defaultValue={page.published ? "true" : "false"}
                >
                  <option value="true">Published</option>
                  <option value="false">Hidden</option>
                </select>
              </label>
              <div className="info-page-admin-actions">
                <button className="primary-button">Save page</button>
                <Link
                  className="owner-link"
                  href={`/${shop.slug}/pages/${page.slug}`}
                  target="_blank"
                >
                  View
                </Link>
                <button
                  formAction={deleteShopPage}
                  className="danger-text-button"
                >
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>

        <form className="info-page-admin-card add" action={createShopPage}>
          <strong>Add an info page</strong>
          <label>
            Title
            <input name="title" required placeholder="About us" />
          </label>
          <label>
            Page URL
            <span className="settings-slug-input">
              <span>/{shop.slug}/pages/</span>
              <input
                name="slug"
                required
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="about"
              />
            </span>
          </label>
          <label className="wide">
            Content
            <textarea
              name="content"
              required
              rows={5}
              placeholder="Tell customers about your shop, policies, or what to expect."
            />
          </label>
          <label>
            Visibility
            <select name="published" defaultValue="true">
              <option value="true">Published</option>
              <option value="false">Hidden</option>
            </select>
          </label>
          <button className="primary-button">Add page</button>
        </form>
      </section>
    </div>
  );
}
