"use client";
import React from "react";
import UsersPanel from "../../components/UsersPanel";
import MoviesPanel from "../../components/MoviesPanel";
import AuditLogsPanel from "../../components/AuditLogsPanel";
import RequestsPanel from "../../components/RequestsPanel";
import StatementsPanel from "../../components/StatementsPanel";
import "@/styles/movie-details.css";

export default function AdminInner() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>
      <UsersPanel />
      <MoviesPanel />
      <AuditLogsPanel />
      <RequestsPanel />
      <StatementsPanel />
    </div>
  );
}
