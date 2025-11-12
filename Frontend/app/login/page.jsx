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

  // use NEXT_PUBLIC_BACKEND_URL from Frontend/.env.local (fallback to localhost)
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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
        credentials: "include", // accept/set httpOnly cookie from backend
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Notify in-tab components
        try { window.dispatchEvent(new Event("auth-changed")); } catch(e){}
        // Notify other tabs (cross-tab)
        try { localStorage.setItem("auth", String(Date.now())); } catch(e){}
        try { new BroadcastChannel("auth").postMessage("changed"); } catch(e){}
        // redirect after notifying
        router.push(from);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Ensure backend is running on port 4000.");
    } finally {
      setLoading(false);
    }
  };

  // register: call backend, then auto-login on success
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError("Passwords do not match");
      return;
    }
    if (!registerData.email || !registerData.password) {
      setRegisterError("Email and password are required");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: registerData.username,
          email: registerData.email,
          password: registerData.password,
        }),
      });

      if (res.ok) {
        setRegisterSuccess("Registered. Logging in...");
        // attempt login to set cookie and enter app
        const loginRes = await fetch(`${BACKEND_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: registerData.email, password: registerData.password }),
        });
        if (loginRes.ok) {
          // notify after login so navbar/auth-status refresh immediately
          try { window.dispatchEvent(new Event("auth-changed")); } catch(e){}
          try { localStorage.setItem("auth", String(Date.now())); } catch(e){}
          try { new BroadcastChannel("auth").postMessage("changed"); } catch(e){}
          router.push(from);
        } else {
          setRegisterSuccess("Registered. Please sign in.");
          setShowRegister(false);
          setEmail(registerData.email);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setRegisterError(data?.message || "Registration failed");
      }
    } catch {
      setRegisterError("Network error. Ensure backend is running.");
    }
  };

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(()=>null);
        throw new Error(txt || "Login failed");
      }

      // Notify in-tab components
      try { window.dispatchEvent(new Event("auth-changed")); } catch(e){}

      // Notify other tabs (cross-tab)
      try { localStorage.setItem("auth", String(Date.now())); } catch(e){}
      try { new BroadcastChannel("auth").postMessage("changed"); } catch(e){}

      // Redirect after notifying so listeners can react
      router.push("/");

    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

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

      <p style={{ marginTop: 12, color: "#fff" }}>
        Don't have an account?{" "}
        <button onClick={() => setShowRegister(true)} style={{ color: "#60A5FA", background: "none", border: "none", cursor: "pointer" }}>
          Register
        </button>
      </p>

      {registerSuccess && <div style={{ color: "#34d399", marginTop: 8 }}>{registerSuccess}</div>}
      {showRegister && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#0f172a", padding: 24, borderRadius: 8, width: "90%", maxWidth: 420 }}>
            <h2 style={{ marginBottom: 16, color: "#fff" }}>Register</h2>
            <form onSubmit={handleRegister}>
              <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
                Username
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }}
                />
              </label>
              <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
                Email
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }}
                  required
                />
              </label>
              <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
                Password
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }}
                  required
                />
              </label>
              <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
                Confirm Password
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }}
                  required
                />
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
