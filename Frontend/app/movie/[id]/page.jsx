import { notFound } from "next/navigation"
import { moviesApi } from "@/lib/api"
import { MovieDetails } from "@/components/movie-details"

export default async function MoviePage({ params }) {
  const { id } = await params
  const movie = await moviesApi.getById(id)

  if (!movie) {
    notFound()
  }

  return (
    <div className="container">
      <MovieDetails movie={movie} />
    </div>
  )
}
