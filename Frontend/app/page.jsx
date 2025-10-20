import { MovieGrid } from "@/components/movie-grid"
import "../styles/home.css"

export default function HomePage() {
  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">Now Showing</h1>
        <p className="home-subtitle">Book your tickets for the latest blockbusters</p>
      </div>
      <MovieGrid />
    </div>
  )
}
