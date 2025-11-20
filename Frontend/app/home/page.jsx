import { MovieGrid } from "@/components/movie-grid"
import BranchSelector from '@/components/branch-selector'
import "@/styles/home.css"

export default function HomePage() {
  return (
    <div className="home-container">
      <div className="home-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="home-title">🍿 Now Showing</h1>

        </div>
        <p className="home-subtitle">Book your tickets for the latest blockbusters</p>
      </div>
      <MovieGrid />
    </div>
  )
}
