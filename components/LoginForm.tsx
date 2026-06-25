"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("student@mentora.local");
  const [password, setPassword] = useState("mentora123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not sign in");
      setLoading(false);
      return;
    }

    window.location.href = "/workspace";
  }

  return (
    <div className="flex items-center bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-14">
      <form onSubmit={submit} className="w-full max-w-md">
        <p className="text-sm font-medium text-teal-200">Sign in</p>
        <h2 className="mt-3 text-3xl font-semibold">Continue to your study desk</h2>
        <div className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">Email</span>
            <input
              className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-500"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <input
              className="focus-ring mt-2 w-full rounded-md border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-500"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-100">{error}</p> : null}

        <button
          className="focus-ring mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal-300"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in" : "Open workspace"}
          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <button
          className="focus-ring mt-3 w-full rounded-md border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          type="button"
          onClick={() => {
            setEmail("admin@mentora.local");
            setPassword("admin123");
          }}
        >
          Use admin demo
        </button>
      </form>
    </div>
  );
}
