"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "./logout-button";

export default function AuthStatus() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_BASE}/api/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setUser(data.user || null);
        } else {
          if (mounted) setUser(null);
        }
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    // re-check on focus (optional)
    const handler = () => load();
    window.addEventListener("focus", handler);
    return () => { mounted = false; window.removeEventListener("focus", handler); };
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <div>
        <a href="/login" style={{ color: "#fff", textDecoration: "none", marginRight: 8 }}>Sign in</a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{user.email}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{user.role}</div>
      </div>
      <LogoutButton />
    </div>
  );
}