import { notFound } from "next/navigation"
import { moviesApi } from "@/lib/api"
import { SeatBooking } from "@/components/seat-booking"

export default async function BookingPage({ params, searchParams }) {
  const { id } = await params
  const { showtime } = await searchParams

  const movie = await moviesApi.getById(id)

  if (!movie || !showtime) {
    notFound()
  }

  return (
    <div className="container">
      <SeatBooking movie={movie} showtime={showtime} />
    </div>
  )
}
