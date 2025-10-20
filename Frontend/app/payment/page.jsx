import { PaymentFlow } from "@/components/payment-flow"

export default async function PaymentPage({ searchParams }) {
  const { data } = await searchParams

  if (!data) {
    return (
      <div className="container" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700" }}>No booking data found</h1>
        <p style={{ marginTop: "0.5rem", color: "#9090a8" }}>Please start from the movie selection page.</p>
      </div>
    )
  }

  const bookingData = JSON.parse(decodeURIComponent(data))

  return (
    <div className="container">
      <PaymentFlow bookingData={bookingData} />
    </div>
  )
}
