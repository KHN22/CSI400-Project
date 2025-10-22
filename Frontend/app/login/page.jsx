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
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    email: "",
    confirmPassword: "",
  });
  const [registerError, setRegisterError] = useState("");

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          email: registerData.email,
        }),
      });
      if (response.ok) {
        setShowRegister(false);
        setEmail(registerData.email);
      } else {
        setRegisterError("Registration failed");
      }
    } catch {
      setRegisterError("Registration failed");
    }
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
        <button onClick={() => setShowRegister(true)} style={{ color: "#60A5FA", background: "none", border: "none", cursor: "pointer" }}>
          Register
        </button>
      </p>

      {showRegister && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#0f172a", padding: 24, borderRadius: 8, width: "90%", maxWidth: 420 }}>
            <h2 style={{ marginBottom: 16, color: "#fff" }}>Register</h2>
            <form onSubmit={handleRegister}>
              <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
                Username
                <input type="text" value={registerData.username} onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
              </label>
              <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
                Email
                <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
              </label>
              <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
                Password
                <input type="password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
              </label>
              <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
                Confirm Password
                <input type="password" value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
              </label>
              {registerError && <div style={{ color: "#f87171", marginBottom: 12 }}>{registerError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" style={{ flex: 1, padding: 10, background: "#10B981", color: "#fff", border: "none", borderRadius: 6 }}>Register</button>
                <button type="button" onClick={() => setShowRegister(false)} style={{ flex: 1, padding: 10, background: "#6B7280", color: "#fff", border: "none", borderRadius: 6 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
