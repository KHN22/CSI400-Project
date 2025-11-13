"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/styles/buttons.css";
import { BACKEND_BASE } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter(); // เพิ่มการดึง router
  const searchParams = useSearchParams();
  // support redirect param (used elsewhere) and legacy from
  // const redirectTo = searchParams?.get("redirect") || searchParams?.get("from") || "/";
  // const redirectTo = "/";

  // helper: normalize redirect to a path (strip origin) and default to "/"
  function normalizeRedirect(target) {
    if (!target) return "/";
    try {
      // if full URL, use pathname + search + hash
      const u = new URL(target, typeof window !== "undefined" ? window.location.origin : undefined);
      return (u.pathname || "/") + (u.search || "") + (u.hash || "");
    } catch {
      // not a full URL, ensure it starts with "/"
      return target.startsWith("/") ? target : `/${target}`;
    }
  }

  const redirectToRaw = searchParams?.get("redirect") || searchParams?.get("from") || "/";
  const redirectTo = normalizeRedirect(redirectToRaw);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      console.log("Sending login request to:", `${BACKEND_BASE}/api/auth/login`); // Debug URL
      console.log("Request body:", { email, password }); // Debug Request Body

      // login request (allow cookie set by backend)
      const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      // store token if provided (optional)
      if (data.token) localStorage.setItem("token", data.token);

      // verify server session by fetching profile (ensure cookie recognized)
      try {
        const meRes = await fetch(`${BACKEND_BASE}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });
        if (!meRes.ok) {
          // If profile check fails, surface an error instead of silently staying on login
          const errData = await meRes.json().catch(() => ({}));
          setError(errData.message || "Login succeeded but session not established. Try again.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Profile check failed after login:", err);
        setError("Login succeeded but verification failed. Try refreshing the page.");
        setLoading(false);
        return;
      }

      // navigation: replace route and attempt to refresh; fallback to hard replace
      router.replace(redirectTo);
      try { router.refresh && router.refresh(); } catch (err) { /* ignore */ }
      setTimeout(() => {
        if (typeof window !== "undefined") {
          // use replace to avoid leaving login in history
          window.location.replace(redirectTo || "/");
        }
      }, 250);

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // พยายามดึง user แต่ถ้าไม่สำเร็จ จะไม่บล็อกหน้าจอ Login
    (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          console.log("fetch user not ok:", res.status);
          return; // ไม่เซ็ต error เพื่อไม่ให้บล็อก UI
        }

        const data = await res.json();
        if (isMounted && data?.user) {
          console.log("Fetched user data:", data); // Debug User Data
          setUser(data.user);
        }
      } catch (err) {
        console.error("Error fetching user (non-fatal):", err); // Debug Fetch Error
        // ไม่เซ็ต error เพื่อให้หน้า Login สามารถใช้งานได้เสมอ
      }
    })();

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []);

  // แสดงฟอร์มเสมอ — อย่าให้การ fetch user บล็อกการเข้าถึงหน้า Login
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
      {user && <div style={{ color: "#fff", marginTop: 16 }}>Welcome, {user.name}!</div>}
    </div>
  );
}
