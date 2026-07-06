export default function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-20">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <span className="text-sm font-medium text-gray-700">Músicos en Red</span>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Músicos en Red · Todos los derechos reservados
        </p>
        <div className="flex gap-5 text-xs text-gray-400">
          <a href="#" className="hover:text-gray-600 transition-colors">Términos</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Privacidad</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Contacto</a>
        </div>
      </div>
    </footer>
  );
}