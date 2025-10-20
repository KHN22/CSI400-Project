import { UserProfile } from "@/components/user-profile"

export default function ProfilePage() {
  return (
    <div className="container">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Manage your account information</p>
        </div>
        <UserProfile />
      </div>
    </div>
  )
}
