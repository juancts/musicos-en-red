"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AnuncioCard from "@/components/instrumentos/AnuncioCard";
import {
  CATEGORIAS_INSTRUMENTO,
  mensajeErrorEsquemaInstrumentos,
  type AnuncioInstrumento,
  type CategoriaInstrumento,
} from "@/lib/instrumentos";

export default function InstrumentosPage() {
  const [anuncios, setAnuncios] = useState<AnuncioInstrumento[]>([]);
  const [categoria, setCategoria] = useState<CategoriaInstrumento | "">("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloCerca, setSoloCerca] = useState(false);
  const [miProvincia, setMiProvincia] = useState<string | null>(null);
  const [miId, setMiId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<{
    titulo: string;
    detalle: string;
    tecnico: string;
  } | null>(null);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      setErrorInfo(null);

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
        .from("anuncios_instrumentos")
        .select(
          "id, vendedor_id, titulo, descripcion, categoria, precio, condicion, ciudad, codigo_postal, provincia, foto_urls, estado, created_at, updated_at"
        )
        .eq("estado", "activo")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorInfo(
          mensajeErrorEsquemaInstrumentos(error) ?? {
            titulo: "Error al cargar anuncios",
            detalle: "Inténtalo de nuevo.",
            tecnico: error.message,
          }
        );
        setLoading(false);
        return;
      }

      setAnuncios((data as AnuncioInstrumento[] | null) ?? []);
      setLoading(false);
    }

    cargar();
  }, []);

  const anunciosFiltrados = useMemo(() => {
    const max = precioMax ? Number(precioMax) : null;
    let lista = anuncios.filter((a) => a.vendedor_id !== miId);

    if (categoria) {
      lista = lista.filter((a) => a.categoria === categoria);
    }
    if (max !== null && Number.isFinite(max)) {
      lista = lista.filter((a) => Number(a.precio) <= max);
    }
    if (soloCerca && miProvincia) {
      lista = lista.filter((a) => a.provincia === miProvincia);
    }

    return [...lista].sort((a, b) => {
      const aCerca = miProvincia && a.provincia === miProvincia ? 1 : 0;
      const bCerca = miProvincia && b.provincia === miProvincia ? 1 : 0;
      return bCerca - aCerca;
    });
  }, [anuncios, categoria, miId, miProvincia, precioMax, soloCerca]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-block text-xs font-medium text-violet-700 bg-violet-50 px-3 py-1 rounded-full mb-4">
            Compraventa
          </span>
          <h1 className="text-2xl font-semibold text-gray-900">Instrumentos en venta</h1>
          <p className="text-gray-400 text-sm mt-1">
            Compra y vende gear de segunda mano entre músicos
          </p>
        </div>

        <Link
          href="/instrumentos/nuevo"
          className="inline-flex w-fit items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Publicar anuncio
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaInstrumento | "")}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="">Todas</option>
            {CATEGORIAS_INSTRUMENTO.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Precio máx. (€)</label>
          <input
            type="number"
            min={0}
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            placeholder="Sin límite"
            className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={!miProvincia}
          onClick={() => setSoloCerca((c) => !c)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
            soloCerca
              ? "bg-emerald-600 text-white"
              : "border border-gray-200 text-gray-600"
          }`}
        >
          Solo cerca de mí
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-gray-50 border border-gray-100" />
          ))}
        </div>
      ) : errorInfo ? (
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <p className="text-sm font-medium text-red-600 mb-2">{errorInfo.titulo}</p>
          <p className="text-sm text-gray-500 mb-4">{errorInfo.detalle}</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-xs text-gray-500">
            <p className="font-medium text-gray-600 mb-1">Supabase → SQL Editor</p>
            <p>
              Ejecuta <code className="text-gray-700">004_instrumentos_marketplace.sql</code> y
              recarga.
            </p>
          </div>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-4 text-[11px] text-gray-400 break-all">{errorInfo.tecnico}</p>
          )}
        </div>
      ) : anunciosFiltrados.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🎸</p>
          <p className="text-gray-400 text-sm">No hay anuncios con estos filtros.</p>
          <Link
            href="/instrumentos/nuevo"
            className="inline-block mt-4 text-sm text-emerald-600 hover:underline"
          >
            Publica el primero →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {anunciosFiltrados.map((anuncio) => (
            <AnuncioCard
              key={anuncio.id}
              anuncio={anuncio}
              cerca={Boolean(miProvincia && anuncio.provincia === miProvincia)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
