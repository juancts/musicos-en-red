"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { esMusico } from "@/lib/usuario";

type MusicoExplorar = {
  id: string;
  tipo?: string | null;
  nombre: string | null;
  ciudad: string | null;
  codigo_postal: string | null;
  provincia: string | null;
  bio: string | null;
  instrumento: string | null;
  disponible: boolean | null;
};

export default function ExplorarPage() {
  const [musicos, setMusicos] = useState<MusicoExplorar[]>([]);
  const [miProvincia, setMiProvincia] = useState<string | null>(null);
  const [miId, setMiId] = useState<string | null>(null);
  const [soloCerca, setSoloCerca] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function cargarMusicos() {
      setLoading(true);
      setError(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setMiId(user?.id ?? null);

      if (user) {
        const { data: miPerfil } = await supabase
          .from("usuarios")
          .select("provincia")
          .eq("id", user.id)
          .maybeSingle();

        setMiProvincia(miPerfil?.provincia ?? null);
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, tipo, nombre, ciudad, codigo_postal, provincia, bio, instrumento, disponible")
        .order("created_at", { ascending: false });

      if (error) {
        setError(true);
        setLoading(false);
        return;
      }

      const lista = ((data as MusicoExplorar[] | null) ?? []).filter((m) =>
        esMusico(m)
      );
      setMusicos(lista);
      setLoading(false);
    }

    cargarMusicos();
  }, []);

  const musicosOrdenados = useMemo(() => {
    const visibles = musicos.filter((musico) => musico.id !== miId);
    const filtrados =
      soloCerca && miProvincia
        ? visibles.filter((musico) => musico.provincia === miProvincia)
        : visibles;

    return [...filtrados].sort((a, b) => {
      const aCerca = miProvincia && a.provincia === miProvincia ? 1 : 0;
      const bCerca = miProvincia && b.provincia === miProvincia ? 1 : 0;
      return bCerca - aCerca;
    });
  }, [miId, miProvincia, musicos, soloCerca]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-block text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-4">
            Comunidad musical
          </span>
          <h1 className="text-2xl font-semibold text-gray-900">
            Explorar músicos
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {miProvincia
              ? `Priorizando músicos cerca de ${miProvincia}`
              : "Agrega tu código postal para encontrar gente cercana"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!miProvincia}
            onClick={() => setSoloCerca((current) => !current)}
            className={`inline-flex w-fit items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              soloCerca
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Solo cerca de mí
          </button>
          <Link
            href="/perfil"
            className="inline-flex w-fit items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Completar ubicación
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl border border-gray-100 bg-gray-50/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-sm text-red-400">
            Error al cargar músicos. Inténtalo de nuevo.
          </p>
        </div>
      ) : musicosOrdenados.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">
            No hay músicos para mostrar con ese filtro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {musicosOrdenados.map((musico) => (
            <Link
              key={musico.id}
              href={`/musicos/${musico.id}`}
              className="group block border border-gray-100 rounded-2xl p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                  {musico.nombre?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate transition-colors group-hover:text-emerald-700">
                    {musico.nombre || "Músico sin nombre"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {musico.provincia || musico.ciudad || "Sin ubicación"}
                    {musico.codigo_postal ? ` · ${musico.codigo_postal}` : ""}
                  </p>
                </div>
                {miProvincia && musico.provincia === miProvincia && (
                  <span className="flex-shrink-0 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    Cerca
                  </span>
                )}
              </div>

              {musico.instrumento && (
                <span className="inline-block text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-2">
                  {musico.instrumento}
                </span>
              )}

              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {musico.bio || "Perfil musical sin bio todavía."}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
