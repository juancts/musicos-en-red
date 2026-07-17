import { DATOS_LEGALES } from "@/lib/legal";

export const metadata = {
  title: "Contacto · Músicos en Red",
};

export default function ContactoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <span className="text-4xl">✉️</span>
      <h1 className="text-3xl font-semibold text-gray-900 mt-3 mb-2">Contacto</h1>
      <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
        ¿Dudas, problemas con tu cuenta o quieres reportar algo? Escríbenos y te responderemos lo
        antes posible.
      </p>
      <a
        href={`mailto:${DATOS_LEGALES.email}`}
        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
      >
        {DATOS_LEGALES.email}
      </a>
    </div>
  );
}
