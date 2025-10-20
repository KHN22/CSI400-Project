import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import "../styles/globals.css"

export const metadata = {
  title: "CineBook - Movie Ticket Booking",
  description: "Book your favorite movies online",
    generator: 'v0.app'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
