"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          redirect: searchParams.get("redirect") || "/"
        })
      });

      if (response.redirected) {
        window.location.assign(response.url);
        return;
      }

      const data = await response.json().catch(() => ({}));
      setError(data.error || "Authentication failed.");
    } catch {
      setError("Authentication request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">NEXUM</p>
        <h1>Private workspace.</h1>
        <p className="auth-copy">Enter your private access token to continue.</p>

        <form onSubmit={submit} className="auth-form">
          <label htmlFor="token">Access token</label>
          <input
            id="token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          <button type="submit" disabled={loading || !token.trim()}>
            {loading ? "Authenticating..." : "Enter NEXUM"}
          </button>
          {error ? <p className="auth-error">{error}</p> : null}
        </form>
      </section>
    </main>
  );
}
