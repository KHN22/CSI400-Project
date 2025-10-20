"use client"

import { useEffect, useState } from "react"
import { userApi } from "@/lib/api"
import { CheckCircle2, Loader2 } from "lucide-react"
import "../styles/profile.css"

export function UserProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userApi.get()
        setUser(data)
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
        })
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setSaved(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedUser = await userApi.update(formData)
      setUser(updatedUser)
      setSaved(true)

      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Failed to update user:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <Loader2 />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-error">
        <p>Failed to load user profile</p>
      </div>
    )
  }

  return (
    <div className="profile-card">
      <form onSubmit={handleSubmit} className="profile-form">
        {/* Profile Picture */}
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user.profilePicture ? (
              <img src={user.profilePicture || "/placeholder.svg"} alt={user.name} />
            ) : (
              <div className="profile-avatar-fallback">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            )}
          </div>
          <div className="profile-avatar-info">
            <h2>{user.name}</h2>
            <p>Member since {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="profile-fields">
          <div className="profile-field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="profile-actions">
          <button type="submit" disabled={saving} className="profile-save-button">
            {saving ? (
              <>
                <Loader2 className="spinner" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>

          {saved && (
            <div className="profile-success-message">
              <CheckCircle2 />
              <span>Changes saved successfully!</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
