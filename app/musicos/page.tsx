import { supabase } from "@/lib/supabase";
import type { Musico } from "@/types";
import { esMusico } from "@/lib/usuario";
import Link from "next/link";

export default async function BuscarMusicos() {
  const { data: musicos, error } = await supabase
    .from("usuarios")
    .select("id, tipo, nombre, ciudad, codigo_postal, provincia, bio, instrumento, disponible");

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-red-400">Error al cargar músicos. Inténtalo de nuevo.</p>
      </div>
    );
  }

  const musicosFiltrados =
    musicos?.filter((m) => esMusico(m as Musico & { tipo?: string })) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">Explorar músicos</h1>
        <p className="text-gray-400 text-sm mt-1">
          {musicosFiltrados.length} músicos en la red
        </p>
      </div>

      {musicosFiltrados.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Aún no hay músicos registrados.</p>
          <Link href="/registro" className="inline-block mt-4 text-sm text-emerald-600 hover:underline">
            Sé el primero →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {musicosFiltrados.map((m: Musico) => (
            <Link
              key={m.id}
              href={`/musicos/${m.id}`}
              className="group block border border-gray-100 rounded-2xl p-4 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                  {m.nombre?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                    {m.nombre}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {m.provincia || m.ciudad}
                    {m.codigo_postal ? ` · ${m.codigo_postal}` : ""}
                  </p>
                </div>
                {m.disponible && (
                  <span className="flex-shrink-0 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    Disponible
                  </span>
                )}
              </div>

              {m.instrumento && (
                <span className="inline-block text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-2">
                  {m.instrumento}
                </span>
              )}

              {m.bio && (
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{m.bio}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
