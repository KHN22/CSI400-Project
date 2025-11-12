"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/styles/buttons.css";

export default function LoginPage() {
  const router = useRouter();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
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
  const [registerSuccess, setRegisterSuccess] = useState("");

  // ใช้ NEXT_PUBLIC_BACKEND_URL จาก .env.local
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  // login: call backend and rely on httpOnly cookie set by backend (fetch includes credentials)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ส่ง Cookies ไปกับ Request
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Notify in-tab components
        try { window.dispatchEvent(new Event("auth-changed")); } catch (e) {}
        // Notify other tabs (cross-tab)
        try { localStorage.setItem("auth", String(Date.now())); } catch (e) {}
        try { new BroadcastChannel("auth").postMessage("changed"); } catch (e) {}
        // redirect after notifying
        router.push(from);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24, border: "1px solid #e6e6e6", borderRadius: 8, backgroundColor: "#111827" }}>
      <h1 style={{ marginBottom: 16, fontSize: 24, fontWeight: 500, color: "#fff" }}>Login</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }}
            required
          />
        </label>
        <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }}
            required
          />
        </label>
        {error && <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="btn-outline-blue"
          style={{ width: "100%" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
