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
  const from = searchParams?.get("from") || "/";

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

      const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ส่ง Cookies ไปกับ Request
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", res.status); // Debug Response Status
      // ลองอ่าน Set-Cookie header (บางเบราว์เซอร์/Fetch ไม่ expose it)
      try {
        for (const pair of res.headers.entries()) {
          console.log("header:", pair);
        }
      } catch (e) {}

      if (res.ok) {
        // Notify in-tab components
        try { window.dispatchEvent(new Event("auth-changed")); } catch (e) {}
        // Notify other tabs (cross-tab)
        try { localStorage.setItem("auth", String(Date.now())); } catch (e) {}
        try { new BroadcastChannel("auth").postMessage("changed"); } catch (e) {}
        // redirect after notifying
        router.push(from); // ใช้ router ที่ดึงมาจาก useRouter()
      } else {
        const data = await res.json().catch(() => ({}));
        console.log("Response data:", data); // Debug Response Data
        setError(data?.message || "Login failed");
      }
    } catch (err) {
      console.error("Fetch error:", err); // Debug Fetch Error
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
