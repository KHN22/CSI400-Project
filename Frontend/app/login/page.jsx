"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/styles/buttons.css";

const fetchUser = async () => {
  const res = await fetch(`${BACKEND_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include", // สำคัญ: ส่ง Cookies ไปกับ Request
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user');
  }
  return await res.json();
};

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

  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

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
      console.log("Response headers:", res.headers); // Debug Response Headers

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

    fetchUser()
      .then((data) => {
        if (isMounted) {
          console.log("Fetched user data:", data); // Debug User Data
          setUser(data.user);
        }
      })
      .catch((err) => {
        console.error("Error fetching user:", err); // Debug Fetch Error
        if (isMounted) setError("Failed to load user data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false; // Cleanup function
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
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
