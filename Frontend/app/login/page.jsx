import React, { Suspense } from "react";
import "@/styles/buttons.css";
import LoginInner from "./loginInnerClient";

// Render the client login UI inside a Suspense boundary so client hooks like
// useSearchParams are allowed without causing the CSR bailout warning.
export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
