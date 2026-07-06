"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { mensajeErrorEsquemaSalas } from "@/lib/erroresSupabase";
import { TIPO_SALA } from "@/lib/usuario";
import SalaCard, { type SalaListItem } from "@/components/salas/SalaCard";

export default function SalasPage() {
  const [salas, setSalas] = useState<SalaListItem[]>([]);
  const [miProvincia, setMiProvincia] = useState<string | null>(null);
  const [miId, setMiId] = useState<string | null>(null);
  const [soloCerca, setSoloCerca] = useState(false);
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

      const selectConEspacios = `
          id, nombre, ciudad, codigo_postal, provincia, bio,
          precio_hora, capacidad_max, equipamiento, disponible, servicios,
          espacios_ensayo ( id, nombre, precio_hora, disponible )
        `;
      const selectBasico =
        "id, nombre, ciudad, codigo_postal, provincia, bio, precio_hora, capacidad_max, equipamiento, disponible, servicios";

      let data: any = null;
      let queryError: any = null;

      const res = await supabase
        .from("usuarios")
        .select(selectConEspacios)
        .eq("tipo", TIPO_SALA)
        .order("created_at", { ascending: false });

      data = res.data;
      queryError = res.error;

      if (
        queryError &&
        (queryError.message.includes("espacios_ensayo") ||
          queryError.message.includes("servicios"))
      ) {
        const fallback = await supabase
          .from("usuarios")
          .select(selectBasico)
          .eq("tipo", TIPO_SALA)
          .order("created_at", { ascending: false });
        data = fallback.data;
        queryError = fallback.error;
      }

      if (queryError) {
        setErrorInfo(
          mensajeErrorEsquemaSalas(queryError) ?? {
            titulo: "Error al cargar salas",
            detalle: "Inténtalo de nuevo en unos segundos.",
            tecnico: queryError.message,
          }
        );
        setLoading(false);
        return;
      }

      setSalas((data as SalaListItem[] | null) ?? []);
      setLoading(false);
    }

    cargar();
  }, []);

  const salasOrdenadas = useMemo(() => {
    const visibles = salas.filter((s) => s.id !== miId);
    const filtradas =
      soloCerca && miProvincia
        ? visibles.filter((s) => s.provincia === miProvincia)
        : visibles;

    return [...filtradas].sort((a, b) => {
      const aCerca = miProvincia && a.provincia === miProvincia ? 1 : 0;
      const bCerca = miProvincia && b.provincia === miProvincia ? 1 : 0;
      return bCerca - aCerca;
    });
  }, [miId, miProvincia, salas, soloCerca]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-block text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4">
            Alquiler de espacios
          </span>
          <h1 className="text-2xl font-semibold text-gray-900">Centros de ensayo</h1>
          <p className="text-gray-400 text-sm mt-1">
            {miProvincia
              ? `Multiespacios en ${miProvincia}`
              : "Locales con varias salas, servicios y zonas comunes"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!miProvincia}
            onClick={() => setSoloCerca((c) => !c)}
            className={`inline-flex w-fit items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              soloCerca
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            Solo cerca de mí
          </button>
          <Link
            href="/registro"
            className="inline-flex w-fit items-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300"
          >
            Publicar mi sala
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 rounded-2xl border border-gray-100 bg-gray-50/50"
            />
          ))}
        </div>
      ) : errorInfo ? (
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <p className="text-sm font-medium text-red-600 mb-2">{errorInfo.titulo}</p>
          <p className="text-sm text-gray-500 mb-4">{errorInfo.detalle}</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-left text-xs text-gray-500">
            <p className="font-medium text-gray-600 mb-1">Pasos en Supabase</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Proyecto → SQL Editor → New query</li>
              <li>
                Pega el contenido de{" "}
                <code className="text-gray-700">001_salas_ensayo.sql</code> y{" "}
                <code className="text-gray-700">003_centro_multiespacio.sql</code>
              </li>
              <li>Pulsa Run y recarga esta página</li>
            </ol>
          </div>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-4 text-[11px] text-gray-400 break-all">{errorInfo.tecnico}</p>
          )}
        </div>
      ) : salasOrdenadas.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🏠</p>
          <p className="text-gray-400 text-sm">Aún no hay salas publicadas.</p>
          <Link
            href="/registro"
            className="inline-block mt-4 text-sm text-emerald-600 hover:underline"
          >
            Sé el primero en publicar →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {salasOrdenadas.map((sala) => (
            <SalaCard
              key={sala.id}
              sala={sala}
              cerca={Boolean(miProvincia && sala.provincia === miProvincia)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
