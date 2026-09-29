"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock3,
  PawPrint,
  ShieldCheck,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const reservedSlugs = new Set([
  "api",
  "auth",
  "book",
  "dashboard",
  "home",
  "login",
]);

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function HomePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function updateShopName(value: string) {
    setShopName(value);
    if (!slugEdited) setShopSlug(createSlug(value));
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reservedSlugs.has(shopSlug)) {
      setMessage("That pet shop URL is reserved. Please choose another.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "America/Los_Angeles";
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        const { data: existingShop } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_id", currentUser.id)
          .maybeSingle();

        if (existingShop) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
            shop_name: shopName,
            shop_slug: shopSlug,
            timezone,
          },
        });
        if (metadataError) throw metadataError;

        const { error: setupError } = await supabase.rpc(
          "create_shop_with_defaults",
          {
            p_name: shopName,
            p_slug: shopSlug,
            p_timezone: timezone,
          },
        );
        if (setupError) throw setupError;
        router.push("/dashboard?welcome=1");
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            shop_name: shopName,
            shop_slug: shopSlug,
            timezone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) throw error;

      if (data.session) {
        const { error: setupError } = await supabase.rpc(
          "create_shop_with_defaults",
          {
            p_name: shopName,
            p_slug: shopSlug,
            p_timezone: timezone,
          },
        );
        if (setupError) throw setupError;
        router.push("/dashboard?welcome=1");
        router.refresh();
        return;
      }

      setMessage(
        `Check ${email} to confirm your account. Your shop URL will be /${shopSlug}/.`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to create the account.";
      setMessage(
        errorMessage.includes("Missing NEXT_PUBLIC")
          ? "Supabase must be connected before tenant registration can be used."
          : errorMessage,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <PawPrint size={20} fill="currentColor" />
          </span>
          <span>Pawsbook</span>
        </Link>
        <nav>
          <a href="#features">Features</a>
          <a href="#signup">Start free</a>
          <Link className="marketing-login" href="/login">
            Tenant login
          </Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <div className="marketing-copy">
          <p className="eyebrow">Booking software for pet businesses</p>
          <h1>More happy pets. Less time managing appointments.</h1>
          <p className="marketing-lead">
            Give your pet shop a beautiful booking page in minutes. Customers
            request a time online, and you manage everything from one simple
            dashboard.
          </p>
          <div className="marketing-points">
            <span>
              <Check /> Your own branded booking URL
            </span>
            <span>
              <Check /> No double bookings
            </span>
            <span>
              <Check /> Works beautifully on every device
            </span>
          </div>
          <a className="marketing-cta" href="#signup">
            Create your booking page <ArrowRight size={17} />
          </a>
        </div>

        <div className="tenant-signup-card" id="signup">
          <div className="signup-heading">
            <span>
              <Store size={22} />
            </span>
            <div>
              <p className="eyebrow">Start your shop</p>
              <h2>Create your free booking page</h2>
            </div>
          </div>
          <form onSubmit={register}>
            <label>
              Your name
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jamie Rivera"
                autoComplete="name"
              />
            </label>
            <label>
              Pet shop name
              <input
                required
                value={shopName}
                onChange={(event) => updateShopName(event.target.value)}
                placeholder="Happy Paws Grooming"
                autoComplete="organization"
              />
            </label>
            <label className="signup-wide">
              Pet shop URL
              <span className="public-slug-input">
                <span>petshop-booking.vercel.app/</span>
                <input
                  required
                  value={shopSlug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    setShopSlug(createSlug(event.target.value));
                  }}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="happy-paws"
                  aria-describedby="slug-help"
                />
              </span>
              <small id="slug-help">
                This becomes your permanent customer booking address.
              </small>
            </label>
            <label>
              Business email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hello@happypaws.com"
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </label>
            {message && <p className="signup-message">{message}</p>}
            <button className="primary-button signup-wide" disabled={loading}>
              {loading ? "Creating your shop…" : "Create my pet shop"}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="signup-terms">
            By signing up, you agree to our terms and privacy policy.
          </p>
        </div>
      </section>

      <section className="marketing-features" id="features">
        <article>
          <span><CalendarCheck /></span>
          <h3>Booking without the back-and-forth</h3>
          <p>Customers choose a service, groomer, date, and available time.</p>
        </article>
        <article>
          <span><Clock3 /></span>
          <h3>Your schedule, always in sync</h3>
          <p>Set business hours and prevent overlapping appointments.</p>
        </article>
        <article>
          <span><ShieldCheck /></span>
          <h3>Every pet shop stays private</h3>
          <p>Secure tenant isolation keeps each shop’s records separate.</p>
        </article>
      </section>
    </main>
  );
}
