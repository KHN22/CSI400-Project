"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore
    } finally {
      router.push("/login");
    }
  };

  return (
    <button onClick={handleLogout} style={{ padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
      Sign out
    </button>
  );
}