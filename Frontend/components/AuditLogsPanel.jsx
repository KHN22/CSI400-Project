"use client";
import React, { useState, useEffect } from "react";
import { adminApi, authApi } from "@/lib/api";

export default function AuditLogsPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const d = await adminApi.getAuditLogs({ limit: 200 });
      setLogs(d.logs || []);
      setError('');
    } catch (err) {
      console.warn('[AuditLogsPanel] refresh', err);
      setLogs([]);
      setError(err.message || 'Failed to load audit logs');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      try {
        const u = await authApi.getMe();
        if (mounted) setMe(u);
      } catch (e) {
        if (mounted) setMe(null);
      }
    }
    loadMe();
    return () => { mounted = false };
  }, []);

  return (
    <section style={{ marginTop: 28 }}>
      <h2>Audit Logs</h2>
      <div style={{ marginBottom: 8 }}>
        {me && me.role === 'SuperAdmin' ? (
          <button onClick={refresh} className="btn-outline-blue">Refresh</button>
        ) : (
          <div style={{ color: '#888' }}>Audit logs: SuperAdmin only</div>
        )}
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {loading ? <div>Loading audit logs…</div> : (
        <div style={{ maxHeight: 240, overflow: 'auto', background: '#111', padding: 8, borderRadius: 6 }}>
          {logs.length === 0 ? <div style={{ color: '#888' }}>No logs</div> : (
            <ul>
              {logs.map(l => (
                <li key={l._id} style={{ marginBottom: 6 }}>
                  <strong>{l.action}</strong> by {l.actorId?.email || 'unknown'} @ {new Date(l.timestamp).toLocaleString()} {l.branch ? `(${l.branch})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
