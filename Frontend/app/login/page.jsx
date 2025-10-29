"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // simplified: no backend required — pressing Sign in immediately proceeds
  const handleSubmit = (e) => {
    e.preventDefault();

    // create a temporary non-httpOnly cookie named "token" so middleware accepts the request
    // cookie lasts 1 hour; change or remove in production when backend sets httpOnly cookie
    document.cookie = "token=dev; path=/; max-age=3600";

    // try client-side navigation first; fallback to full page navigation
    setLoading(true);
    (async () => {
      try {
        await router.push(from);
        if (typeof window !== "undefined") {
          const targetPath = new URL(from, window.location.origin).pathname;
          if (window.location.pathname !== targetPath) {
            window.location.href = from;
          }
        }
      } catch {
        if (typeof window !== "undefined") {
          window.location.href = from;
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24, border: "1px solid #e6e6e6", borderRadius: 8, backgroundColor: "#111827" }}>
      <h1 style={{ marginBottom: 16, fontSize: 24, fontWeight: 500, color: "#fff" }}>Login</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} />
        </label>
        <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} />
        </label>
        {error && <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, background: "#0070f3", color: "#fff", border: "none", borderRadius: 6 }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p style={{ marginTop: 12, color: "#fff" }}>
        Don't have an account?{" "}
        <button onClick={() => router.push("/register")} style={{ color: "#60A5FA", background: "none", border: "none", cursor: "pointer" }}>
          Register
        </button>
      </p>
    </div>
  );
}
