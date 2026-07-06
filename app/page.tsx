import Link from "next/link";
import HomeHeroActions from "@/components/home/HomeHeroActions";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-24 text-center">
        <span className="inline-block text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-6">
          La red social para músicos
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight mb-5">
          Conecta con músicos<br className="hidden sm:block" /> como tú
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto mb-10 leading-relaxed">
          Encuentra músicos, forma bandas, comparte partituras y colabora en proyectos musicales.
        </p>
        <HomeHeroActions />
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <span className="text-lg leading-none">📣</span>,
              title: "Feed en vivo",
              desc: "Publica shows, busca banda o comparte novedades como en una red social.",
              href: "/feed",
            },
            {
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              ),
              title: "Encuentra músicos",
              desc: "Busca por instrumento, género o ciudad y conecta con músicos cerca de ti.",
              href: "/explorar",
            },
            {
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              title: "Forma tu banda",
              desc: "Publica que buscas músicos o únete a proyectos que ya están en marcha.",
              href: "/feed",
            },
            {
              icon: (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              ),
              title: "Comparte partituras",
              desc: "Sube y comparte tus partituras con la comunidad de músicos.",
              href: "/perfil",
            },
            {
              icon: <span className="text-lg leading-none">🏠</span>,
              title: "Salas de ensayo",
              desc: "Locales que ofrecen su espacio en alquiler por horas para ensayar.",
              href: "/salas",
            },
            {
              icon: <span className="text-lg leading-none">🎸</span>,
              title: "Compra y venta",
              desc: "Publica instrumentos de segunda mano y contacta con vendedores de la comunidad.",
              href: "/instrumentos",
            },
          ].map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group block border border-gray-100 rounded-2xl p-6 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-medium text-gray-900 text-sm mb-2 group-hover:text-emerald-700 transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
