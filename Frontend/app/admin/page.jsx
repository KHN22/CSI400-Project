"use client";
import React, { Suspense } from "react";
import "@/styles/movie-details.css";
import AdminInner from "./adminInnerClient";

// Top-level admin page renders the client-side admin inner component
// inside a Suspense boundary as required for useSearchParams usages.
export default function AdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading admin…</div>}>
      <AdminInner />
    </Suspense>
  );
}