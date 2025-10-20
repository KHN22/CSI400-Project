import Link from "next/link"
import Image from "next/image"
import { Star, Clock } from "lucide-react"
import "../styles/movie-card.css"

export function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <div className="movie-card-image">
        <Image src={movie.poster || "/placeholder.svg"} alt={movie.title} width={300} height={450} />
      </div>

      <div className="movie-card-content">
        <h3 className="movie-card-title">{movie.title}</h3>

        <div className="movie-card-meta">
          <div className="movie-card-rating">
            <Star />
            <span>{movie.rating}</span>
          </div>
          <div className="movie-card-duration">
            <Clock />
            <span>{movie.duration}</span>
          </div>
        </div>

        <p className="movie-card-genre">{movie.genre}</p>

        <Link href={`/movie/${movie.id}`}>
          <button className="movie-card-button">Book Now</button>
        </Link>
      </div>
    </div>
  )
}
