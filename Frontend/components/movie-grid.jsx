"use client"
import { MovieCard } from "./movie-card"
import { mockMovies } from "@/lib/mock-data"
import "../styles/home.css"

export function MovieGrid() {
  return (
    <div className="movie-grid">
      {mockMovies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}
