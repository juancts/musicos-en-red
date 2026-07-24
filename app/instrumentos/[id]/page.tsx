"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import AnuncioFoto from "@/components/instrumentos/AnuncioFoto";
import ContactarVendedorButton from "@/components/instrumentos/ContactarVendedorButton";
import ReportarButton from "@/components/moderacion/ReportarButton";
import {
  anuncioSelect,
  emojiCategoria,
  etiquetaCategoria,
  etiquetaCondicion,
  formatearPrecioAnuncio,
  mensajeErrorEsquemaInstrumentos,
  type AnuncioConVendedor,
} from "@/lib/instrumentos";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export default function AnuncioDetallePage({ params }: Props) {
  const { id } = use(params);
  const [anuncio, setAnuncio] = useState<AnuncioConVendedor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fotoActiva, setFotoActiva] = useState(0);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("anuncios_instrumentos")
        .select(anuncioSelect)
        .eq("id", id)
        .maybeSingle();

      if (queryError) {
        const info = mensajeErrorEsquemaInstrumentos(queryError);
        setError(info?.detalle ?? "No pudimos cargar el anuncio.");
        setLoading(false);
        return;
      }

      setAnuncio((data as AnuncioConVendedor | null) ?? null);
      setLoading(false);
    }

    cargar();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg mb-8" />
        <div className="aspect-video bg-gray-50 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (error || !anuncio) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <Link href="/instrumentos" className="text-sm text-emerald-600 hover:underline">
          ← Volver al mercado
        </Link>
        <p className="mt-8 text-gray-400 dark:text-gray-500 text-sm">
          {error ?? "Anuncio no encontrado o ya no está disponible."}
        </p>
      </div>
    );
  }

  const fotos = anuncio.foto_urls?.length ? anuncio.foto_urls : [];
  const vendedor = anuncio.vendedor;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/instrumentos"
        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 hover:dark:text-gray-200 inline-flex items-center gap-1 mb-8"
      >
        ← Instrumentos en venta
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="aspect-[4/3] rounded-2xl bg-gray-50 dark:bg-gray-800 overflow-hidden mb-3">
            <AnuncioFoto
              src={fotos[fotoActiva]}
              emoji={emojiCategoria(anuncio.categoria)}
              className="w-full h-full object-cover"
            />
          </div>
          {fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {fotos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setFotoActiva(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    i === fotoActiva ? "border-emerald-500" : "border-transparent"
                  }`}
                >
                  <AnuncioFoto
                    src={url}
                    emoji={emojiCategoria(anuncio.categoria)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-6">{anuncio.titulo}</h1>
          <p className="text-3xl font-semibold text-emerald-700 mt-2">
            {formatearPrecioAnuncio(Number(anuncio.precio))}
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
              {etiquetaCategoria(anuncio.categoria)}
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
              {etiquetaCondicion(anuncio.condicion)}
            </span>
            {(anuncio.provincia || anuncio.ciudad) && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                {anuncio.provincia || anuncio.ciudad}
                {anuncio.codigo_postal ? ` · ${anuncio.codigo_postal}` : ""}
              </span>
            )}
          </div>

          {anuncio.descripcion && (
            <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Descripción</h2>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {anuncio.descripcion}
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Vendedor</h2>
            {vendedor ? (
              <Link
                href={`/musicos/${vendedor.id}`}
                className="mt-2 block text-sm text-emerald-600 hover:underline"
              >
                {vendedor.nombre ?? "Ver perfil"}
              </Link>
            ) : (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Perfil no disponible</p>
            )}

            {anuncio.estado === "activo" ? (
              <div className="mt-6">
                <ContactarVendedorButton
                  anuncioId={anuncio.id}
                  vendedorId={anuncio.vendedor_id}
                  tituloAnuncio={anuncio.titulo}
                  vendedorNombre={vendedor?.nombre}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
                Este anuncio ya no está activo.
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Publicado el{" "}
            {new Date(anuncio.created_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <ReportarButton
            tipoObjetivo="anuncio"
            objetivoId={anuncio.id}
            redirectLogin={`/instrumentos/${anuncio.id}`}
          />
        </aside>
      </div>
    </div>
  );
}
