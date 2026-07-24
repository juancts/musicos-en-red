"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { mensajeErrorEsquemaSalas } from "@/lib/erroresSupabase";
import SalaCard, { type SalaListItem } from "@/components/salas/SalaCard";
import { enPeriodoGraciaSala, obtenerSuscriptoresActivos } from "@/lib/suscripcion";

export default function SalasPage() {
  const [salas, setSalas] = useState<SalaListItem[]>([]);
  const [suscriptores, setSuscriptores] = useState<Set<string>>(new Set());
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
          id, owner_id, nombre, ciudad, codigo_postal, provincia, bio,
          precio_hora, capacidad_max, equipamiento, disponible, servicios, created_at,
          espacios_ensayo ( id, nombre, precio_hora, disponible )
        `;
      const selectBasico =
        "id, owner_id, nombre, ciudad, codigo_postal, provincia, bio, precio_hora, capacidad_max, equipamiento, disponible, servicios, created_at";

      let data: SalaListItem[] | null = null;
      let queryError: PostgrestError | null = null;

      const res = await supabase
        .from("centros")
        .select(selectConEspacios)
        .order("created_at", { ascending: false });

      data = (res.data as SalaListItem[] | null) ?? null;
      queryError = res.error;

      if (
        queryError &&
        (queryError.message.includes("espacios_ensayo") ||
          queryError.message.includes("servicios"))
      ) {
        const fallback = await supabase
          .from("centros")
          .select(selectBasico)
          .order("created_at", { ascending: false });
        data = (fallback.data as SalaListItem[] | null) ?? null;
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

      const centros = data ?? [];
      const ownersActivos = await obtenerSuscriptoresActivos(
        supabase,
        centros.map((c) => c.owner_id)
      );
      const activos = new Set(
        centros.filter((c) => ownersActivos.has(c.owner_id)).map((c) => c.id)
      );

      setSalas(centros);
      setSuscriptores(activos);
      setLoading(false);
    }

    cargar();
  }, []);

  const salasOrdenadas = useMemo(() => {
    const visibles = salas
      .filter((s) => s.id !== miId)
      .filter((s) => suscriptores.has(s.id) || enPeriodoGraciaSala(s.created_at));
    const filtradas =
      soloCerca && miProvincia
        ? visibles.filter((s) => s.provincia === miProvincia)
        : visibles;

    return [...filtradas].sort((a, b) => {
      const aCerca = miProvincia && a.provincia === miProvincia ? 1 : 0;
      const bCerca = miProvincia && b.provincia === miProvincia ? 1 : 0;
      if (bCerca !== aCerca) return bCerca - aCerca;

      return Number(suscriptores.has(b.id)) - Number(suscriptores.has(a.id));
    });
  }, [miId, miProvincia, salas, soloCerca, suscriptores]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-block text-xs font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-4">
            Alquiler de espacios
          </span>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Centros de ensayo</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
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
                : "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 hover:dark:border-gray-600"
            }`}
          >
            Solo cerca de mí
          </button>
          <Link
            href="/registro"
            className="inline-flex w-fit items-center rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-gray-300 hover:dark:border-gray-600"
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
              className="h-44 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
            />
          ))}
        </div>
      ) : errorInfo ? (
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <p className="text-sm font-medium text-red-600 mb-2">{errorInfo.titulo}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{errorInfo.detalle}</p>
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">Pasos en Supabase</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Proyecto → SQL Editor → New query</li>
              <li>
                Pega el contenido de{" "}
                <code className="text-gray-700 dark:text-gray-200">014_centros.sql</code>
              </li>
              <li>Pulsa Run y recarga esta página</li>
            </ol>
          </div>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500 break-all">{errorInfo.tecnico}</p>
          )}
        </div>
      ) : salasOrdenadas.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-4xl mb-4">🏠</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {salas.length > 0
              ? "No hay salas activas publicadas ahora mismo."
              : "Aún no hay salas publicadas."}
          </p>
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
              esSuscriptor={suscriptores.has(sala.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
