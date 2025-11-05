/**
 * Seeder: read mockMovies from Frontend/lib/mock-data.js and POST them to backend.
 *
 * Usage (PowerShell, project root not required but run from Backend or adjust paths):
 *   cd d:\NewBooking\CSI400-Project\Backend
 *   # if POST requires admin cookie, set AUTH_COOKIE first:
 *   $env:AUTH_COOKIE = "connect.sid=...; other=..."
 *   node .\scripts\seed-from-frontend.js
 *
 * On Unix:
 *   AUTH_COOKIE="connect.sid=..." node ./scripts/seed-from-frontend.js
 */
const path = require("path");

const BACKEND_BASE = process.env.BACKEND_BASE || "http://localhost:4000";
const AUTH_COOKIE = process.env.AUTH_COOKIE || "";

async function main() {
  try {
    const frontendMockPath = path.resolve(__dirname, "../../Frontend/lib/mock-data.js");
    // dynamic import of frontend mock-data (works if mock-data.js uses exports)
    const mockModule = await import("file://" + frontendMockPath.replace(/\\/g, "/"));
    const mockMovies = mockModule.mockMovies || mockModule.default?.mockMovies || [];
    if (!Array.isArray(mockMovies) || mockMovies.length === 0) {
      console.error("No mockMovies found at", frontendMockPath);
      process.exit(1);
    }

    console.log(`Seeding ${mockMovies.length} movies to ${BACKEND_BASE}`);
    for (const m of mockMovies) {
      const payload = {
        title: m.title,
        year: m.year,
        description: m.description,
        poster: m.poster || "",
        showtimes: Array.isArray(m.showtimes) ? m.showtimes : [],
      };

      const res = await fetch(`${BACKEND_BASE}/api/movies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(AUTH_COOKIE ? { Cookie: AUTH_COOKIE } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Failed to create", payload.title, res.status, text);
      } else {
        const body = await res.json().catch(()=>null);
        console.log("Created:", body?.movie?._id || body?._id || payload.title);
      }
    }
    console.log("Seeding finished");
  } catch (err) {
    console.error("Seeder error:", err);
    process.exit(1);
  }
}

main();