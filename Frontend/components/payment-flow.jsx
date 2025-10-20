"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, QrCode } from "lucide-react"
import { bookingsApi } from "@/lib/api"
import "../styles/payment.css"

export function PaymentFlow({ bookingData }) {
  const router = useRouter()
  const [isPaying, setIsPaying] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handlePayment = async () => {
    setIsPaying(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    try {
      // Create booking record
      await bookingsApi.create({
        movieId: bookingData.movieId,
        movieTitle: bookingData.movieTitle,
        date: new Date().toISOString().split("T")[0],
        showtime: bookingData.showtime,
        seats: bookingData.seats,
        total: bookingData.total,
      })

      setIsComplete(true)
    } catch (error) {
      console.error("Payment failed:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsPaying(false)
    }
  }

  const handleFinish = () => {
    router.push("/bookings")
  }

  if (isComplete) {
    return (
      <div className="success-container">
        <div className="success-icon">
          <CheckCircle2 />
        </div>
        <h1>Payment Successful!</h1>
        <p>Your booking has been confirmed.</p>

        <div className="success-details-card">
          <h2>Booking Details</h2>
          <div className="success-details">
            <div className="success-details-row">
              <span className="payment-label">Movie</span>
              <span className="payment-value">{bookingData.movieTitle}</span>
            </div>
            <div className="success-details-row">
              <span className="payment-label">Date</span>
              <span className="payment-value">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="success-details-row">
              <span className="payment-label">Showtime</span>
              <span className="payment-value">{bookingData.showtime}</span>
            </div>
            <div className="success-details-row">
              <span className="payment-label">Seats</span>
              <span className="payment-value">{bookingData.seats.join(", ")}</span>
            </div>
            <div className="success-details-row success-details-total">
              <span className="payment-label">Total Paid</span>
              <span className="payment-total-amount">${bookingData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={handleFinish} className="payment-button">
          View Booking History
        </button>
      </div>
    )
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Complete Payment</h1>
        <p>Scan the QR code below to complete your payment via PromptPay</p>
      </div>

      <div className="payment-grid">
        {/* QR Code Section */}
        <div className="qr-card">
          <div className="qr-placeholder">
            <div className="qr-content">
              <QrCode />
              <p>PromptPay QR Code</p>
              <p>(Mock Payment)</p>
            </div>
          </div>

          <div className="qr-amount">
            <p className="qr-amount-label">Amount to Pay</p>
            <p className="qr-amount-value">${bookingData.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="payment-summary-card">
          <h2>Booking Summary</h2>

          <div className="payment-details">
            <div className="payment-row">
              <span className="payment-label">Movie</span>
              <span className="payment-value">{bookingData.movieTitle}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Date</span>
              <span className="payment-value">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Showtime</span>
              <span className="payment-value">{bookingData.showtime}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Seats</span>
              <span className="payment-value">{bookingData.seats.join(", ")}</span>
            </div>
            <div className="payment-row">
              <span className="payment-label">Number of Tickets</span>
              <span className="payment-value">{bookingData.seats.length}</span>
            </div>
          </div>

          <div className="payment-total">
            <div className="payment-total-row">
              <span>Total Amount</span>
              <span className="payment-total-amount">${bookingData.total.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handlePayment} disabled={isPaying} className="payment-button">
            {isPaying ? "Processing Payment..." : "Mark as Paid"}
          </button>

          <p className="payment-note">
            This is a mock payment system. Click the button above to simulate payment completion.
          </p>
        </div>
      </div>
    </div>
  )
}
