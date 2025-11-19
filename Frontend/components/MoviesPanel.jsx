"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_BASE, authApi } from "@/lib/api";

const FIXED_SHOWTIMES = ["10:00", "13:00", "16:00", "19:00", "22:00"];

export default function MoviesPanel() {
  const router = useRouter();
  const fileRef = useRef();
  const createFormRef = useRef(null);

  const [movies, setMovies] = useState([]);
  const [mLoading, setMLoading] = useState(true);
  const [mError, setMError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", year: "", description: "", poster: "", ticketPrice: "", showtimes: [], length: "", branch: null });
  const [tmdbInput, setTmdbInput] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [me, setMe] = useState(null);
  const [firstShowTime, setFirstShowTime] = useState('10:00');
  const [numShows, setNumShows] = useState(3);

  useEffect(() => { loadMovies(); }, []);

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

  async function loadMovies() {
    setMLoading(true); setMError("");
    try {
      const res = await fetch(`${BACKEND_BASE}/api/movies`);
      if (!res.ok) throw new Error('Failed to load movies');
      const d = await res.json().catch(()=>null);
      const list = Array.isArray(d) ? d : (d?.movies || []);
      setMovies(list || []);
    } catch (err) { console.error('[MoviesPanel] loadMovies', err); setMError(err.message || 'Failed to load movies'); }
    finally { setMLoading(false); }
  }

  function startEdit(m) {
    setEditing(m._id);
    setForm({ title: m.title || "", year: m.year || "", description: m.description || "", poster: m.poster || "", ticketPrice: m.ticketPrice || "", length: m.length || "", showtimes: Array.isArray(m.showtimes) ? m.showtimes : [], branch: m.branch || null, tmdbId: m.tmdbId || null });
    setPosterFile(null); setPosterPreview(m.poster || ""); if (fileRef.current) fileRef.current.value = "";
    if (m.showtimes && m.showtimes.length > 0) {
      setFirstShowTime(m.showtimes[0]);
      setNumShows(m.showtimes.length);
    }
  }

  function cancelCreate() {
    setEditing(null);
    setForm({ title: "", year: "", description: "", poster: "", ticketPrice: "", showtimes: [], length: "", branch: null, tmdbId: null });
    setPosterFile(null); setPosterPreview(""); if (fileRef.current) fileRef.current.value = "";
    setFirstShowTime('10:00'); setNumShows(3);
  }

  function toggleShowtime(t) {
    setForm(prev => {
      const s = prev.showtimes || [];
      if (s.includes(t)) return { ...prev, showtimes: s.filter(x => x !== t) };
      return { ...prev, showtimes: [...s, t] };
    });
  }

  function onFileChange(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return; setPosterFile(f); setPosterPreview(URL.createObjectURL(f));
  }

  async function uploadPoster(file) {
    if (!file) return null;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`${BACKEND_BASE}/api/uploads`, { method: 'POST', body: fd, credentials: 'include' });
    if (!res.ok) {
      const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Upload failed');
    }
    const d = await res.json(); return `${BACKEND_BASE}${d.url}`;
  }

  async function saveMovie(e) {
    e?.preventDefault(); setMError("");
    try {
      if (!form.title) throw new Error('Title is required');
      if (!form.ticketPrice) throw new Error('Ticket price is required');
      let posterUrl = form.poster || "";
      if (posterFile) posterUrl = await uploadPoster(posterFile);
      const payload = { title: form.title, year: form.year ? Number(form.year) : undefined, description: form.description, poster: posterUrl, ticketPrice: Number(form.ticketPrice), showtimes: form.showtimes, length: form.length ? Number(form.length) : undefined, tmdbId: form.tmdbId || undefined };
      // SuperAdmin can set branch explicitly
      if (me && me.role === 'SuperAdmin' && form.branch) payload.branch = form.branch;

      let res;
      if (editing) {
        res = await fetch(`${BACKEND_BASE}/api/movies/${editing}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${BACKEND_BASE}/api/movies`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }

      if (!res.ok) {
        const data = await res.json().catch(()=>({})); throw new Error(data.message || 'Save failed');
      }

      cancelCreate(); await loadMovies();
    } catch (err) { console.error('[MoviesPanel] saveMovie', err); setMError(err.message || 'Error saving movie'); }
  }

  async function deleteMovie(id) {
    if (!confirm('Delete movie?')) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/movies/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Delete failed');
      await loadMovies();
    } catch (err) { setMError(err.message || 'Delete error'); }
  }

  return (
    <section style={{ marginTop: 28 }}>
      <h2>Movies</h2>
      {mError && <div style={{ color: 'red' }}>{mError}</div>}
      {mLoading ? <div>Loading movies…</div> : (
        <div>
          <div style={{ marginBottom: 12 }}>
            {(me && (me.role === 'SuperAdmin' || me.role === 'Manager' || me.role === 'Staff')) ? (
              <button onClick={cancelCreate} style={{ padding: '8px 12px', borderRadius: 6 }} className="btn-outline-blue">Add new movie</button>
            ) : (
              <div style={{ color: '#888', fontSize: 13 }}>Add movie: login as Staff/Manager/SuperAdmin</div>
            )}
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {movies.map(m => (
              <div key={m._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <button onClick={() => startEdit(m)} style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, textAlign: 'left', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', color: 'white' }}>{m.title} {m.year ? `(${m.year})` : ''}</button>
                  <div><button onClick={() => startEdit(m)} style={{ background: 'transparent', border: 'none', padding: 0, margin: 0, textAlign: 'left', cursor: 'pointer', fontSize: 13, color: '#666' }}>{(m.showtimes || []).join(' • ')}</button></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(m)} className="btn-outline-blue" style={{ padding: '6px 10px', fontSize: 14 }}>Edit</button>
                  <button onClick={() => deleteMovie(m._id)} className="btn btn-danger">Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <form ref={createFormRef} onSubmit={saveMovie} className="card">
              <h3>{editing ? 'Edit movie' : 'Add movie'}</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                <input placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
                <input placeholder="Genres" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} required />
                <input placeholder="Length (mins)" value={form.length} onChange={(e)=>setForm({...form, length:e.target.value})} type="number" required />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="TMDB URL or ID" value={tmdbInput} onChange={(e)=>setTmdbInput(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="btn-outline-blue" onClick={async () => {
                    if (!tmdbInput) return alert('Enter TMDB URL or ID');
                    try {
                      const q = encodeURIComponent(tmdbInput);
                      const res = await fetch(`${BACKEND_BASE}/api/movies/tmdb?url=${q}`, { credentials: 'include' });
                      if (res.status === 400) {
                        // try as id
                        const idRes = await fetch(`${BACKEND_BASE}/api/movies/tmdb?tmdbId=${encodeURIComponent(tmdbInput)}`, { credentials: 'include' });
                        if (!idRes.ok) throw new Error('TMDB lookup failed');
                        const d = await idRes.json();
                        const m = d.movie || d;
                        setForm(prev => ({ ...prev, title: m.title || prev.title, poster: m.poster || prev.poster, year: m.year || prev.year, length: m.length || prev.length, description: m.description || prev.description, tmdbId: m.tmdbId || prev.tmdbId }));
                        if (m.poster) setPosterPreview(m.poster);
                        return;
                      }
                      if (!res.ok) throw new Error('TMDB lookup failed');
                      const d = await res.json();
                      const m = d.movie || d;
                      setForm(prev => ({ ...prev, title: m.title || prev.title, poster: m.poster || prev.poster, year: m.year || prev.year, length: m.length || prev.length, description: m.description || prev.description, tmdbId: m.tmdbId || prev.tmdbId }));
                      if (m.poster) setPosterPreview(m.poster);
                    } catch (e) {
                      alert('Failed to fetch from TMDB: ' + (e.message || e));
                    }
                  }}>Fetch</button>
                </div>
                <input placeholder="Year" value={form.year} onChange={(e)=>setForm({...form, year:e.target.value})} type="number" required />

                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button type="button" onClick={() => { fileRef.current?.click(); }} className="btn-outline-blue">Choose Poster</button>
                    <button type="button" onClick={() => { if (fileRef.current) fileRef.current.value = ''; setPosterFile(null); setPosterPreview(''); }} className="btn-outline-blue">Clear</button>
                  </div>
                  <div style={{ marginTop: 8 }}>{posterPreview ? <img src={posterPreview} alt="preview" style={{ maxWidth: 240, borderRadius: 6 }} /> : form.poster ? <img src={form.poster} alt="poster" style={{ maxWidth: 240, borderRadius: 6 }} /> : null}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ fontSize: 13 }}>First show:</label>
                  <input type="time" value={firstShowTime} onChange={(e)=>setFirstShowTime(e.target.value)} />
                  <label style={{ fontSize: 13 }}>Shows:</label>
                  <input type="number" min={1} value={numShows} onChange={(e)=>setNumShows(Number(e.target.value||1))} style={{ width: 80 }} />
                  <button type="button" className="btn-outline-blue" onClick={() => {
                    const runtime = Number(form.length || 0);
                    if (!runtime || runtime <= 0) { alert('Please enter valid length/runtime in minutes'); return; }
                    const parse = (hhmm) => { const [hh, mm] = hhmm.split(':').map(Number); return hh*60 + mm; };
                    const fmt = (mins) => { mins = ((mins % (24*60)) + (24*60)) % (24*60); const hh = Math.floor(mins/60).toString().padStart(2,'0'); const mm = (mins%60).toString().padStart(2,'0'); return `${hh}:${mm}`; };
                    const start = parse(firstShowTime || '10:00');
                    const gap = 30;
                    const arr = [];
                    let cur = start;
                    for (let i=0;i<numShows;i++) { arr.push(fmt(cur)); cur = cur + runtime + gap; }
                    setForm(prev => ({ ...prev, showtimes: arr }));
                  }}>Generate showtimes</button>
                </div>

                <div>
                  <div style={{ marginBottom: 6 }}>Showtimes (auto-generated or customize)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(form.showtimes || []).map(t => (
                      <label key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked onChange={() => toggleShowtime(t)} />
                        <span>{t}</span>
                      </label>
                    ))}
                    {((form.showtimes || []).length === 0) && FIXED_SHOWTIMES.map(t => {
                      const checked = (form.showtimes || []).includes(t);
                      return (<label key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={checked} onChange={()=>toggleShowtime(t)} /><span>{t}</span></label>);
                    })}
                  </div>
                </div>

                <div>
                  <input placeholder="Ticket Price (฿)" type="number" min="0" step="0.01" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} required />
                </div>

                {me && me.role === 'SuperAdmin' && (
                  <div>
                    <label>Branch (SuperAdmin only)</label>
                    <select value={form.branch || 'A'} onChange={(e)=>setForm({ ...form, branch: e.target.value })}>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn-outline-blue" style={{ padding: '8px 12px', borderRadius: 6 }}>{editing ? 'Save' : 'Create'}</button>
                  <button type="button" onClick={cancelCreate} className="btn-outline-blue" style={{ background: 'transparent' }}>Cancel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
