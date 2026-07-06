"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  etiquetaEstado,
  formatearPrecioAnuncio,
  type AnuncioInstrumento,
} from "@/lib/instrumentos";

type Props = {
  userId: string;
};

export default function MisAnunciosPanel({ userId }: Props) {
  const [anuncios, setAnuncios] = useState<AnuncioInstrumento[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("anuncios_instrumentos")
      .select(
        "id, vendedor_id, titulo, descripcion, categoria, precio, condicion, ciudad, codigo_postal, provincia, foto_urls, estado, created_at, updated_at"
      )
      .eq("vendedor_id", userId)
      .order("created_at", { ascending: false });

    setAnuncios((data as AnuncioInstrumento[] | null) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarEstado = async (id: string, estado: "activo" | "vendido" | "pausado") => {
    await supabase.from("anuncios_instrumentos").update({ estado }).eq("id", id);
    cargar();
  };

  if (loading) {
    return (
      <div className="h-24 rounded-2xl border border-gray-100 bg-gray-50/50 animate-pulse" />
    );
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-medium text-gray-900">Mis anuncios de instrumentos</h2>
        <Link
          href="/instrumentos/nuevo"
          className="text-xs font-medium text-emerald-600 hover:underline"
        >
          + Publicar
        </Link>
      </div>

      {anuncios.length === 0 ? (
        <p className="text-sm text-gray-400">
          Aún no tienes anuncios.{" "}
          <Link href="/instrumentos/nuevo" className="text-emerald-600 hover:underline">
            Publica el primero
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {anuncios.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-gray-100 px-4 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/instrumentos/${a.id}`}
                  className="text-sm font-medium text-gray-900 hover:text-emerald-700 truncate block"
                >
                  {a.titulo}
                </Link>
                <p className="text-xs text-gray-400">
                  {formatearPrecioAnuncio(Number(a.precio))} · {etiquetaEstado(a.estado)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {a.estado !== "activo" && (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(a.id, "activo")}
                    className="text-xs rounded-lg border border-gray-200 px-2.5 py-1 text-gray-600 hover:border-gray-300"
                  >
                    Republicar
                  </button>
                )}
                {a.estado === "activo" && (
                  <>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(a.id, "pausado")}
                      className="text-xs rounded-lg border border-gray-200 px-2.5 py-1 text-gray-600 hover:border-gray-300"
                    >
                      Pausar
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarEstado(a.id, "vendido")}
                      className="text-xs rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100"
                    >
                      Marcar vendido
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
