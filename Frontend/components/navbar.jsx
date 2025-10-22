import Link from "next/link"
import { Film } from "lucide-react"
import "../styles/navbar.css"

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link href="/" className="navbar-logo">
            <Film className="navbar-logo-icon" />
            <span className="navbar-logo-text">CineBook</span>
          </Link>

          <div className="navbar-links">
            <Link href="/" className="navbar-link active">
              Home
            </Link>
            <Link href="/bookings" className="navbar-link">
              Booking History
            </Link>
            <Link href="/profile" className="navbar-link">
              Profile
            </Link>
            <Link href="/login" className="navbar-link">
              Login/register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
