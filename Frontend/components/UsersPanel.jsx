"use client";
import React, { useEffect, useState } from "react";
import { BACKEND_BASE, authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function UsersPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState(null);

  useEffect(() => { loadUsers(); }, []);

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

  async function loadUsers(q = "") {
    setLoading(true); setError("");
    try {
      const url = new URL(`${BACKEND_BASE}/api/admin/users`);
      if (q) url.searchParams.set("q", q);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.status === 401) { router.push('/login'); return; }
      if (res.status === 403) { setError('Access denied. Admins only.'); setUsers([]); return; }
      const d = await res.json();
      setUsers(d.users || []);
    } catch (err) {
      console.error('[UsersPanel] loadUsers', err);
      setError('Failed to load users');
    } finally { setLoading(false); }
  }

  async function setRole(userId, role) {
    if (!me || (me.role !== 'SuperAdmin' && me.role !== 'Manager')) {
      setError('You are not authorized to change roles');
      return;
    }
    // Managers can only assign roles lower than themselves
    if (me.role === 'Manager' && role === 'SuperAdmin') {
      setError('Managers cannot assign SuperAdmin');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/users/${userId}/role`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) await loadUsers(query);
      else if (res.status === 401) router.push('/login');
      else {
        const d = await res.json().catch(()=>({}));
        setError(d.message || 'Could not change role');
      }
    } catch (e) { setError('Network error'); }
  }

  async function setBranch(userId, branch) {
    // Only SuperAdmin can assign arbitrary branches.
    if (!me) { setError('Please login'); return; }
    if (me.role !== 'SuperAdmin') {
      // Managers can assign Staff to their own branch only
      if (me.role === 'Manager') {
        if (!me.branch) { setError('Manager has no branch'); return; }
        // enforce branch equals manager's branch
        if (branch && branch !== me.branch) { setError('Managers can only assign staff to their branch'); return; }
      } else {
        setError('You are not authorized to change branch');
        return;
      }
    }
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/users/${userId}/branch`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch })
      });
      if (res.ok) await loadUsers(query);
      else if (res.status === 401) router.push('/login');
      else {
        const d = await res.json().catch(()=>({}));
        setError(d.message || 'Could not change branch');
      }
    } catch (e) { setError('Network error'); }
  }
                <td>
                  {(me && (me.role === 'SuperAdmin' || me.role === 'Manager')) ? (
                    <select value={u.role} onChange={(e)=>setRole(u._id, e.target.value)}>
                      <option value="Guest">Guest</option>
                      <option value="Staff">Staff</option>
                      <option value="Manager">Manager</option>
                      <option value="SuperAdmin">SuperAdmin</option>
                    </select>
                  ) : (
                    <span>{u.role}</span>
                  )}

                  {me && me.role === 'SuperAdmin' ? (
                    <select value={u.branch || ''} onChange={(e)=>setBranch(u._id, e.target.value || null)} style={{ marginLeft: 8 }}>
                      <option value="">No branch</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  ) : me && me.role === 'Manager' ? (
                    // Managers can only assign staff to their branch (simple UI)
                    <select value={u.branch || ''} onChange={(e)=>setBranch(u._id, e.target.value || null)} style={{ marginLeft: 8 }}>
                      <option value="">No branch</option>
                      <option value={me.branch}>{me.branch}</option>
                    </select>
                  ) : (
                    <span style={{ marginLeft: 8 }}>{u.branch || '-'}</span>
                  )}
                </td>
            {users.map(u => (
              <section style={{ marginTop: 16 }}>
                <h2>Users</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input placeholder="Search by email or username" value={query} onChange={(e)=>setQuery(e.target.value)} />
                  <button onClick={()=>loadUsers(query)}>Search</button>
                  <button onClick={()=>{ setQuery(''); loadUsers(); }}>Clear</button>
                </div>

                {error && <div style={{ color: 'red' }}>{error}</div>}

                {loading ? (
                  <div>Loading users…</div>
                ) : (
                  <table className="table" style={{ marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Branch</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id}>
                          <td>{u.email}</td>
                          <td>{u.username || '-'}</td>
                          <td>
                            {me && (me.role === 'SuperAdmin' || me.role === 'Manager') ? (
                              <select value={u.role} onChange={(e)=>setRole(u._id, e.target.value)}>
                                <option value="Guest">Guest</option>
                                <option value="Staff">Staff</option>
                                <option value="Manager">Manager</option>
                                <option value="SuperAdmin">SuperAdmin</option>
                              </select>
                            ) : (
                              <span>{u.role}</span>
                            )}
                          </td>
                          <td>
                            {me && me.role === 'SuperAdmin' ? (
                              <select value={u.branch || ''} onChange={(e)=>setBranch(u._id, e.target.value || null)} style={{ marginLeft: 8 }}>
                                <option value="">No branch</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>
                            ) : me && me.role === 'Manager' ? (
                              <select value={u.branch || ''} onChange={(e)=>setBranch(u._id, e.target.value || null)} style={{ marginLeft: 8 }}>
                                <option value="">No branch</option>
                                <option value={me.branch}>{me.branch}</option>
                              </select>
                            ) : (
                              <span>{u.branch || '-'}</span>
                            )}
                          </td>
                          <td>
                            {/* placeholder for additional actions in future (delete, view) */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
