"use client";
import React from "react";

export default function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal-content" style={{ background: "#fff", borderRadius: 12, padding: 32, minWidth: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        {title && <h2 style={{ marginBottom: 12 }}>{title}</h2>}
        <div>{children}</div>
        {onClose && (
          <button className="btn-link" style={{ marginTop: 24 }} onClick={onClose}>Cancel</button>
        )}
      </div>
    </div>
  );
}
