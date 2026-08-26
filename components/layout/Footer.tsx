import Link from "next/link";

const REDES = [
  {
    nombre: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61593847520296",
    icono: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
      </svg>
    ),
  },
  {
    nombre: "Instagram",
    href: "https://www.instagram.com/musicosenredok/",
    icono: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    nombre: "X",
    href: "https://x.com/musicosenredok",
    icono: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.24 3H21l-6.55 7.49L22.2 21h-6.02l-4.71-6.17L5.9 21H3.13l7.01-8.02L2.5 3h6.17l4.26 5.64L18.24 3Zm-1.06 16.17h1.67L7.9 4.73H6.1l11.08 14.44Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 mt-20">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Músicos en Red</span>
          </div>
          <div className="flex items-center gap-3">
            {REDES.map((red) => (
              <a
                key={red.nombre}
                href={red.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={red.nombre}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                {red.icono}
              </a>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} Músicos en Red · Todos los derechos reservados
        </p>
        <div className="flex gap-5 text-xs text-gray-400 dark:text-gray-500">
          <Link href="/terminos" className="hover:text-gray-600 hover:dark:text-gray-300 transition-colors">Términos</Link>
          <Link href="/privacidad" className="hover:text-gray-600 hover:dark:text-gray-300 transition-colors">Privacidad</Link>
          <Link href="/contacto" className="hover:text-gray-600 hover:dark:text-gray-300 transition-colors">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}