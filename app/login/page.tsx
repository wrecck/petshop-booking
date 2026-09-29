"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to continue.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-brand" href="/">
        <span>
          <PawPrint size={20} fill="currentColor" />
        </span>
        Paws & Co.
      </Link>
      <div className="auth-card">
        <p className="eyebrow">For pet businesses</p>
        <h1>Welcome back.</h1>
        <p className="auth-intro">
          Sign in to manage your appointments and shop.
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@yourshop.com"
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
              autoComplete="current-password"
            />
          </label>
          {message && <p className="auth-message">{message}</p>}
          <button className="primary-button" disabled={loading}>
            {loading ? "Please wait…" : "Sign in"}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>
        <Link className="auth-switch" href="/#signup">
          New tenant? Create your pet shop
        </Link>
      </div>
    </main>
  );
}
