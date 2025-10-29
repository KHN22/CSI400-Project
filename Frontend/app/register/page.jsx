"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// add mock flag and in-memory store
const USE_MOCK = true;
const mockUsers = []; // simple in-memory users for mock mode

// helper to simulate register API in mock mode
function mockRegister({ username, email, password }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const exists = mockUsers.some((u) => u.email === email);
      if (exists) {
        resolve({ ok: false, status: 409, json: async () => ({ error: "Email already registered" }) });
      } else {
        mockUsers.push({ username, email, password });
        resolve({ ok: true, status: 200, json: async () => ({ success: true }) });
      }
    }, 700); // simulate network delay
  });
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = USE_MOCK
        ? await mockRegister({ username: form.username, email: form.email, password: form.password })
        : await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
          });
      if (res.ok) {
        // on success return to login page
        router.push("/login");
      } else {
        // try to extract server message when available
        try {
          const body = await res.json();
          setError(body?.error || "Registration failed");
        } catch {
          setError("Registration failed");
        }
      }
    } catch {
      setError("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24, border: "1px solid #e6e6e6", borderRadius: 8, backgroundColor: "#0f172a" }}>
      <h1 style={{ marginBottom: 16, fontSize: 24, fontWeight: 500, color: "#fff" }}>Register</h1>
      {USE_MOCK && (
        <div style={{ marginBottom: 12, color: "#FBBF24", fontSize: 13 }}>
          Mock mode enabled — registration stored in-memory only.
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
          Username
          <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
        </label>
        <label style={{ display: "block", marginBottom: 8, color: "#fff" }}>
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
        </label>
        <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
          Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
        </label>
        <label style={{ display: "block", marginBottom: 12, color: "#fff" }}>
          Confirm Password
          <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} style={{ display: "block", width: "100%", padding: 8, marginTop: 6, boxSizing: "border-box", borderRadius: 4 }} required />
        </label>
        {error && <div style={{ color: "#f87171", marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading} style={{ flex: 1, padding: 10, background: "#10B981", color: "#fff", border: "none", borderRadius: 6 }}>{loading ? "Registering…" : "Register"}</button>
          <button type="button" onClick={() => router.push("/login")} style={{ flex: 1, padding: 10, background: "#6B7280", color: "#fff", border: "none", borderRadius: 6 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
