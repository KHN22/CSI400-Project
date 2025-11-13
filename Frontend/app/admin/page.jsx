"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@/styles/movie-details.css";
import { BACKEND_BASE } from "@/lib/api";

const FIXED_SHOWTIMES = ["10:00", "13:00", "16:00", "19:00", "22:00"];

export default function AdminPage() {
  const router = useRouter();
  const fileRef = useRef();
  const createFormRef = useRef(null);

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState("");
  const [movies, setMovies] = useState([]);
  const [mLoading, setMLoading] = useState(true);
  const [mError, setMError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", year: "", description: "", poster: "", ticketPrice: "", showtimes: [] });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");

  useEffect(() => {
    loadUsers();
    loadMovies();
  }, []);

  useEffect(() => {
    loadUsers();
    loadMovies();
  }, [editing]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const fileRef = useRef();
  const createFormRef = useRef(null);
  const searchParams = useSearchParams(); // moved to top-level (hooks must be top-level)

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [uLoading, setULoading] = useState(false);
  const [uError, setUError] = useState("");
  const [movies, setMovies] = useState([]);
  const [mLoading, setMLoading] = useState(true);
  const [mError, setMError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", year: "", description: "", poster: "", ticketPrice: "", showtimes: [] });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");

  useEffect(() => { loadUsers(); loadMovies(); }, []);

  useEffect(() => {loadUsers(); loadMovies(); }, [editing])

  useEffect(() => {
    const editId = searchParams?.get?.("edit");
    if (!editId) return;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/movies/${editId}`, { credentials: "include" });
        if (!res.ok) return;
        const d = await res.json();
        const movie = d.movie || d;
        if (movie) startEdit(movie);
      } catch {
        // ignore
      }
    })();
  }, [searchParams]);

  async function loadUsers(q = "") {
    setULoading(true);
    setUError("");
    try {
      const url = new URL(`${BACKEND_BASE}/api/admin/users`);
      if (q) url.searchParams.set("q", q);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 403) { setUError("Access denied. Admins only."); setUsers([]); return; }
      const d = await res.json();
      setUsers(d.users || []);
    } catch {
      setUError("Failed to load users.");
    } finally { setULoading(false); }
  }

  async function setRole(userId, role) {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/users/${userId}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      if (res.ok) { await loadUsers(query); }
      else if (res.status === 401) { router.push("/login"); }
      else {
        const d = await res.json().catch(()=>({}));
        setUError(d.message || "Could not change role");
      }
    } catch { setUError("Network error"); }
  }

  async function loadMovies() {
    setMLoading(true); setMError("");
    try {
      const res = await fetch(`${BACKEND_BASE}/api/movies`); // no credentials for public list
      if (!res.ok) {
        const text = await res.text().catch(()=>null);
        console.warn("[AdminPage] /api/movies failed", res.status, text);
        throw new Error(`Failed to load movies (status ${res.status})`);
      }
      const d = await res.json().catch(()=>null);
      const list = Array.isArray(d) ? d : (d && Array.isArray(d.movies) ? d.movies : []);
      console.log("[AdminPage] loaded movies count:", list.length);
      setMovies(list || []);
    } catch (err) {
      console.error("[AdminPage] loadMovies error:", err);
      setMError(err.message || "Failed to load movies.");
    } finally { setMLoading(false); }
  }

  function cancelCreate() {
    setEditing(null);
    setForm({ title: "", year: "", description: "", poster: "", ticketPrice: "", showtimes: [] });
    setPosterFile(null);
    setPosterPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(m) {
    setEditing(m._id);
    setForm({
      title: m.title || "",
      year: m.year || "",
      description: m.description || "",
      poster: m.poster || "",
      ticketPrice: m.ticketPrice || "",
      rating: m.rating || "",
      length: m.length || "",
      showtimes: Array.isArray(m.showtimes) ? m.showtimes : []
    });
    setPosterFile(null);
    setPosterPreview(m.poster || "");
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleShowtime(t) {
    setForm(prev => {
      const s = prev.showtimes || [];
      if (s.includes(t)) return { ...prev, showtimes: s.filter(x => x !== t) };
      return { ...prev, showtimes: [...s, t] };
    });
  }

  function onFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setPosterFile(f);
    setPosterPreview(URL.createObjectURL(f));
  }

  async function uploadPoster(file) {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${BACKEND_BASE}/api/uploads`, { method: "POST", body: fd, credentials: "include" });
    if (!res.ok) {
      const d = await res.json().catch(()=>({}));
      throw new Error(d.message || "Upload failed");
    }
    const d = await res.json();
    return `${BACKEND_BASE}${d.url}`;
  }

  async function saveMovie(e) {
    e?.preventDefault();
    setMError("");
    try {
      // Validate required fields
      if (!form.title) throw new Error("Title is required");
      if (!form.ticketPrice) throw new Error("Ticket price is required");

      let posterUrl = form.poster || "";
      if (posterFile) {
        posterUrl = await uploadPoster(posterFile);
      }

      const payload = {
        title: form.title,
        year: form.year ? Number(form.year) : undefined,
        description: form.description,
        poster: posterUrl,
        ticketPrice: Number(form.ticketPrice),
        showtimes: form.showtimes,
        rating: form.rating ? Number(form.rating) : undefined,
        length: form.length ? Number(form.length) : undefined
      };

      let res;
      if (editing) {
        res = await fetch(`${BACKEND_BASE}/api/movies/${editing}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${BACKEND_BASE}/api/movies`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Save failed");
      }

      // Reset form and refresh list
      startCreate();
      await loadMovies();
    } catch (err) {
      console.error("[AdminPage] Save movie error:", err);
      setMError(err.message || "Error saving movie");
    }
  }

  async function deleteMovie(id) {
    if (!confirm("Delete movie?")) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/movies/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
      await loadMovies();
    } catch (err) {
      setMError(err.message || "Delete error");
    }
  }

  function startCreate() {
    // clear editing state and scroll the create/edit form into view
    setEditing(null);
    setForm({ title: "", year: "", description: "", poster: "", ticketPrice: "", showtimes: [] });
    setPosterFile(null);
    setPosterPreview("");
    if (fileRef.current) fileRef.current.value = "";
    // smooth scroll to the form
    if (createFormRef.current) {
      createFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      // focus first input for quicker entry
      const firstInput = createFormRef.current.querySelector('input');
      if (firstInput) firstInput.focus();
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Dashboard</h1>

      <section style={{ marginTop: 16 }}>
        <h2>Users</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input placeholder="Search by email or username" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <button onClick={()=>loadUsers(query)}>Search</button>
          <button onClick={()=>{ setQuery(''); loadUsers(); }}>Clear</button>
        </div>
        {uError && <div style={{ color: "red" }}>{uError}</div>}
        {uLoading ? <div>Loading users…</div> : (
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr><th>Email</th><th>Username</th><th>Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.email}</td>
                  <td>{u.username || "-"}</td>
                  <td>{u.role}</td>
                  <td>
                    <select value={u.role} onChange={(e)=>setRole(u._id, e.target.value)}>
                      <option value="Guest">Guest</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Movies</h2>
        {mError && <div style={{ color: "red" }}>{mError}</div>}
        {mLoading ? <div>Loading movies…</div> : (
          <div>
            <div style={{ marginBottom: 12 }}>
              {/* Add new movie: border color #6366f1 */}
              <button
                onClick={startCreate}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #6366f1",
                  background: "transparent",
                  color: "#cfe0ff",
                  cursor: "pointer"
                }}
              >
                Add new movie
              </button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {movies.map(m => (
                <div key={m._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    {/* Title and showtimes as clickable buttons to edit */}
                    <button
                      onClick={() => startEdit(m)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        textAlign: "left",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "white"
                      }}
                    >
                      {m.title} {m.year ? `(${m.year})` : ''}
                    </button>
                    <div>
                      <button
                        onClick={() => startEdit(m)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 13,
                          color: "#666"
                        }}
                      >
                        {(m.showtimes || []).join(" • ")}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {/* Edit: border color #6366f1 */}
                    <button
                      onClick={() => startEdit(m)}
                      className="btn-outline-blue"
                      style={{ padding: "6px 10px", fontSize: 14 }}
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteMovie(m._id)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
               <form ref={createFormRef} onSubmit={saveMovie} className="card">
                 <h3>{editing ? "Edit movie" : "Add movie"}</h3>
                 <div style={{ display: "grid", gap: 8 }}>
                   <input placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
                   <input placeholder="Rating" value={form.rating} onChange={(e)=>setForm({...form, rating:e.target.value})} type="float" step="0.5" required />
                   <input placeholder="Gernes" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} required />
                   <input placeholder="Length" value={form.length} onChange={(e)=>setForm({...form, length:e.target.value})} type="number" required />
                   <input placeholder="Year" value={form.year} onChange={(e)=>setForm({...form, year:e.target.value})} type="number" required />
                   <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {/* replaced visible file input with hidden input + visible button (background #6366f1) */}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => { fileRef.current?.click(); }}
                        className="btn-outline-blue"
                        aria-label="Choose poster"
                      >
                        Choose Poster
                      </button>

                      {/* Clear: border color #6366f1 */}
                      <button
                        type="button"
                        onClick={() => { /* clear handler */ }}
                        className="btn-outline-blue"
                      >
                        Clear
                      </button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {posterPreview ? <img src={posterPreview} alt="preview" style={{ maxWidth: 240, borderRadius: 6 }} /> : form.poster ? <img src={form.poster} alt="poster" style={{ maxWidth: 240, borderRadius: 6 }} /> : null}
                    </div>
                   </div>

                   <div>
                    <div style={{ marginBottom: 6 }}>Showtimes (choose)</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {FIXED_SHOWTIMES.map(t => {
                        const checked = (form.showtimes || []).includes(t);
                        return (
                          <label key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <input type="checkbox" checked={checked} onChange={()=>toggleShowtime(t)} />
                            <span>{t}</span>
                          </label>
                        );
                      })}
                    </div>
                   </div>

                   {/* New ticket price field */}
                   <div>
                    <input
                      placeholder="Ticket Price (฿)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.ticketPrice}
                      onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
                      required
                    />
                   </div>

                   <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="submit"
                      className="btn-outline-blue"
                      style={{ padding: "8px 12px", borderRadius: 6 }}
                    >
                      {editing ? "Save" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelCreate}
                      className="btn-outline-blue"
                      style={{ background: "transparent" }}
                    >
                      Cancel
                    </button>
                   </div>
                 </div>
               </form>
             </div>
           </div>
         )}
       </section>
     </div>
   );
 }