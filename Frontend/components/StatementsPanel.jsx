"use client";
import React, { useState, useEffect } from "react";
import { adminApi, authApi } from "@/lib/api";

export default function StatementsPanel() {
  const [statements, setStatements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      try {
        const u = await authApi.getMe();
        if (mounted) setMe(u);
      } catch (e) { if (mounted) setMe(null); }
    }
    loadMe();
    return () => { mounted = false };
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const opts = {};
      // SuperAdmin may request all branches; Manager/Staff limited to their branch
      if (me && me.role !== 'SuperAdmin' && me.branch) {
        opts.branch = me.branch;
      } else if (me && me.role === 'SuperAdmin' && me.branch) {
        opts.branch = me.branch; // allow SuperAdmin to filter by branch
      }
      const d = await adminApi.getStatements(opts);
      setStatements(d || null);
      setError('');
    } catch (err) {
      console.warn('[StatementsPanel] refresh', err);
      setStatements(null);
      setError(err.message || 'Failed to load statements');
    } finally { setLoading(false); }
  }

  return (
    <section style={{ marginTop: 28 }}>
      <h2>Statements</h2>
      <div style={{ marginBottom: 8 }}>
        {(me && (me.role === 'SuperAdmin' || me.role === 'Manager' || me.role === 'Staff')) ? (
          <button onClick={refresh} className="btn-outline-blue">Refresh Statement</button>
        ) : (
          <div style={{ color: '#888' }}>Statements: admins only</div>
        )}
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {statements ? (
        <div>
          <div>Total bookings: {statements.count}</div>
          <div>Total revenue: ฿{statements.total || 0}</div>
        </div>
      ) : (<div style={{ color: '#888' }}>No statement loaded</div>)}
    </section>
  );
}
