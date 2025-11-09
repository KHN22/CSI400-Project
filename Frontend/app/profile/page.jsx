"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/auth/me`, { credentials: "include" });
        if (res.status === 401) { router.push("/login"); return; }
        const d = await res.json();
        if (mounted) setUser(d.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // cleanup preview object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (loading) return <div className="profile-loading">Loading profile…</div>;
  if (!user) return <div className="profile-error">Not signed in.</div>;

  // compute avatar (preview -> user.profileImage -> fallback)
  const computedAvatar = (() => {
    if (previewUrl) return previewUrl;
    if (user && user.profileImage) return user.profileImage.startsWith("http") ? user.profileImage : `${BACKEND_BASE}${user.profileImage}`;
    return null;
  })();

  const onFileChange = (e) => {
    setUploadError("");
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setDirty(true); // mark profile as changed so Save button becomes active
  };

  const triggerFileSelect = () => fileInputRef.current && fileInputRef.current.click();

  // Upload selected file and update DB (POST /api/auth/avatar). Called by Save changes.
  const saveProfile = async () => {
    if (!dirty) return;
    if (!selectedFile) {
      // nothing to upload; clear dirty
      setDirty(false);
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const fd = new FormData();
      fd.append("avatar", selectedFile);
      const res = await fetch(`${BACKEND_BASE}/api/auth/avatar`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Save failed (${res.status}) ${txt}`);
      }
      const json = await res.json();
      // backend expected to return updated user e.g. { user: { ..., avatar: "/uploads/avatars/..." } }
      const newPath = (json.user && (json.user.profileImage || json.user.avatar)) || json.profileImage || json.avatarPath || null;
      if (newPath && user) {
        // normalize to frontend field used previously (avatar)
        setUser(prev => ({ ...prev, avatar: newPath, profileImage: newPath }));
      }
      setSelectedFile(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      setDirty(false);
    } catch (err) {
      console.error(err);
      setSaveError("Failed to save changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account and view profile details.</p>
      </header>

      <section className="profile-card">
        <div className="profile-form">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {computedAvatar ? (
                <img src={computedAvatar} alt="Avatar" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div className="profile-avatar-fallback">{(user.email || "U")[0].toUpperCase()}</div>
              )}
              <div style={{ marginTop: 8 }}>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
                <button type="button" onClick={triggerFileSelect} disabled={uploading} className="profile-change-avatar-button">
                  Choose
                </button>
                {/* Upload is performed by Save changes button to persist path to DB */}
                <span style={{ marginLeft: 8, color: "#666" }}>{selectedFile ? selectedFile.name : null}</span>
                {uploadError && <div style={{ color: "red", marginTop: 6 }}>{uploadError}</div>}
              </div>
            </div>
            <div className="profile-avatar-info">
               <h2>{user.email}</h2>
               <p className="text-muted">Role: {user.role}</p>
               <p className="text-muted">UserId: {user.id}</p>
             </div>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <label>Email</label>
              <input type="email" value={user.email} readOnly />
            </div>
            
            <div className="profile-field">
              <label>Role</label>
              <input type="text" value={user.role} readOnly />
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="profile-save-button"
              onClick={saveProfile}
              disabled={!dirty || saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saveError && <div style={{ color: "red", marginTop: 8 }}>{saveError}</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
