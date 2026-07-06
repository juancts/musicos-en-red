import "@/app/globals.css"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

