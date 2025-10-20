import { BookingHistory } from "@/components/booking-history"

export default function BookingsPage() {
  return (
    <div className="container">
      <div className="booking-history-container">
        <div className="booking-history-header">
          <h1>Booking History</h1>
          <p>View all your past and upcoming movie bookings</p>
        </div>
        <BookingHistory />
      </div>
    </div>
  )
}
