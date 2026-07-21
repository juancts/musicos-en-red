import type { Metadata } from "next";
import "@/app/globals.css"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import PlausibleAnalytics from "@/components/analytics/PlausibleAnalytics"

export const metadata: Metadata = {
  metadataBase: new URL("https://musicosenred.com"),
  title: {
    default: "Músicos en Red",
    template: "%s | Músicos en Red",
  },
  description:
    "Descubre músicos, salas de ensayo, anuncios de instrumentos y comparte tu comunidad musical en una sola plataforma.",
  keywords: [
    "músicos",
    "bandas",
    "salas de ensayo",
    "instrumentos",
    "comunidad musical",
    "Músicos en Red",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Músicos en Red",
    description:
      "Conecta con músicos, descubre salas de ensayo y compra o vende instrumentos en la comunidad musical española.",
    url: "https://musicosenred.com",
    siteName: "Músicos en Red",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Músicos en Red",
    description:
      "Conecta con músicos, descubre salas de ensayo y compra o vende instrumentos en la comunidad musical española.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <PlausibleAnalytics />
        <Header />
        <main className="flex-1 container mx-auto px-4">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

