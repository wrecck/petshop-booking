"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
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
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (error) throw error;
        if (data.session) {
          window.location.href = "/dashboard";
          return;
        }
        setMessage("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
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
        <h1>{mode === "login" ? "Welcome back." : "Open your booking page."}</h1>
        <p className="auth-intro">
          {mode === "login"
            ? "Sign in to manage your appointments and shop."
            : "Create your owner account. Your first booking page is ready in a few clicks."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
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
          )}
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
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>
          {message && <p className="auth-message">{message}</p>}
          <button className="primary-button" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
          }}
        >
          {mode === "login"
            ? "New here? Create an owner account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
