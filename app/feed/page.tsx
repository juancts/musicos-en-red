"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ComponerPublicacion from "@/components/feed/ComponerPublicacion";
import PublicacionCard from "@/components/feed/PublicacionCard";
import {
  listarPublicaciones,
  mensajeErrorEsquemaFeed,
  obtenerMetricasPublicaciones,
  type MetricasPublicacion,
  type PublicacionConAutor,
} from "@/lib/feed";
import { supabase } from "@/lib/supabase";

const metricasVacias: MetricasPublicacion = {
  likes: 0,
  comentarios: 0,
  likedByMe: false,
};

export default function FeedPage() {
  const [publicaciones, setPublicaciones] = useState<PublicacionConAutor[]>([]);
  const [metricas, setMetricas] = useState<Record<string, MetricasPublicacion>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<{
    titulo: string;
    detalle: string;
    tecnico: string;
  } | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorInfo(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const uid = user?.id ?? null;
    setUserId(uid);

    const { data, error } = await listarPublicaciones();

    if (error) {
      setErrorInfo(
        mensajeErrorEsquemaFeed(error) ?? {
          titulo: "Error",
          detalle: "No pudimos cargar el feed.",
          tecnico: error.message,
        }
      );
      setLoading(false);
      return;
    }

    const lista = (data as unknown as PublicacionConAutor[] | null) ?? [];
    setPublicaciones(lista);

    if (lista.length > 0) {
      const m = await obtenerMetricasPublicaciones(
        lista.map((p) => p.id),
        uid
      );
      setMetricas(m);
    } else {
      setMetricas({});
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const quitarPublicacion = (id: string) => {
    setPublicaciones((prev) => prev.filter((p) => p.id !== id));
    setMetricas((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const actualizarMetricas = (id: string, m: MetricasPublicacion) => {
    setMetricas((prev) => ({ ...prev, [id]: m }));
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <span className="inline-block text-xs font-medium text-sky-700 bg-sky-50 px-3 py-1 rounded-full mb-3">
          Comunidad
        </span>
        <h1 className="text-2xl font-semibold text-gray-900">Feed</h1>
        <p className="text-gray-400 text-sm mt-1">
          Shows, ensayos, búsquedas de banda y lo que quieras compartir
        </p>
      </div>

      {userId ? (
        <div className="mb-6">
          <ComponerPublicacion userId={userId} onPublicado={cargar} />
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-500">
            <Link href="/login?redirect=/feed" className="text-emerald-600 font-medium hover:underline">
              Inicia sesión
            </Link>{" "}
            para publicar, dar like y comentar.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-gray-50 border border-gray-100" />
          ))}
        </div>
      ) : errorInfo ? (
        <div className="text-center py-12 px-4">
          <p className="text-sm font-medium text-red-600">{errorInfo.titulo}</p>
          <p className="text-sm text-gray-500 mt-2">{errorInfo.detalle}</p>
          <p className="mt-4 text-xs text-gray-400">
            Archivos: <code>005</code> y <code>006_feed_likes_comentarios.sql</code>
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-2 text-[11px] text-gray-400 break-all">{errorInfo.tecnico}</p>
          )}
        </div>
      ) : publicaciones.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎵</p>
          <p className="text-sm text-gray-400">El feed está vacío. Sé el primero en publicar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {publicaciones.map((pub) => (
            <PublicacionCard
              key={pub.id}
              publicacion={pub}
              usuarioActualId={userId}
              metricas={metricas[pub.id] ?? metricasVacias}
              onMetricasChange={(m) => actualizarMetricas(pub.id, m)}
              onEliminada={quitarPublicacion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
