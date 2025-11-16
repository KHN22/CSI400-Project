import React, { Suspense } from "react";
import BookingInnerClient from "./bookingInnerClient";

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="card">Loading movie details...</div>}>
      <BookingInnerClient />
    </Suspense>
  );
}
