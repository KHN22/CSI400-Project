import React, { Suspense } from "react";
import MovieInnerClient from "./movieInnerClient";

export default function MoviePage() {
  return (
    <Suspense
      fallback={
        <div className="movie-loading">
          <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
            Loading movie details...
          </div>
        </div>
      }
    >
      <MovieInnerClient />
    </Suspense>
  );
}
