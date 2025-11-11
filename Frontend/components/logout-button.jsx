"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "@/styles/buttons.css";

export default function LogoutButton() {
  const router = useRouter();
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }

    try { window.dispatchEvent(new Event("auth-changed")); } catch(e){}
    try { localStorage.setItem("auth", String(Date.now())); } catch(e){}
    try { new BroadcastChannel("auth").postMessage("changed"); } catch(e){}

    try { router.push("/login"); } catch(e){}
  };

  return (
    <button onClick={handleLogout} className="btn-outline-blue" aria-label="Logout" type="button">
      Logout
    </button>
  );
}