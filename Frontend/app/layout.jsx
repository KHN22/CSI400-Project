import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "../styles/globals.css";
import "../styles/profile.css"; // added to ensure profile page styles are applied

export const metadata = {
  title: "CineBook - Movie Ticket Booking",
  description: "Book your favorite movies online",
  generator: "v0.app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* use the original Navbar which now includes AuthStatus/Logout */}
        <Navbar />

        {/* Make main the centered container so every page content is balanced */}
        <main className="container">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
