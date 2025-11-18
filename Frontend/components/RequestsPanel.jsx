import React, { useEffect, useState } from "react";
import { adminApi, authApi } from "@/lib/api";

export default function RequestsPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => { loadRequests(); }, []);
  async function loadRequests() {
    setLoading(true);
    try {
      const d = await adminApi.getRequests();
      setRequests(d.requests || []);
    } catch (err) {
      setRequests([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { loadMe(); }, []);
  async function loadMe() {
    try {
      const u = await authApi.getMe();
      setMe(u);
    } catch (e) { setMe(null); }
  }

  async function updateRequestStatus(id, status) {
    try {
      await adminApi.patchRequest(id, { status });
      await loadRequests();
    } catch (err) {
      alert(err.message || 'Failed to update request');
    }
  }

  // Filter requests for branch-scoped managers/staff
  const filteredRequests = me && me.role !== 'SuperAdmin' && me.branch
    ? requests.filter(r => r.payload?.branch === me.branch)
    : requests;

  return (
    <section style={{ marginTop: 28 }}>
      <h2>Requests</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={loadRequests} className="btn-outline-blue">Load Requests</button>
      </div>
      {loading ? <div>Loading requests…</div> : (
        <div>
          {filteredRequests.length === 0 ? <div style={{ color: '#888' }}>No requests</div> : (
            <table className="table"><thead><tr><th>Type</th><th>By</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr key={req._id}>
                    <td>{req.type}</td>
                    <td>{req.requesterId?.email}</td>
                    <td>{req.status}</td>
                    <td>
                      {me && (me.role === 'SuperAdmin' || (me.role === 'Manager' && req.payload?.branch === me.branch)) ? (
                        <>
                          {req.status !== 'approved' && <button onClick={()=>updateRequestStatus(req._id, 'approved')} className="btn-outline-blue">Approve</button>}
                          {req.status !== 'rejected' && <button onClick={()=>updateRequestStatus(req._id, 'rejected')} style={{ marginLeft: 8 }} className="btn">Reject</button>}
                        </>
                      ) : (
                        <span style={{ color: '#888' }}>No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
