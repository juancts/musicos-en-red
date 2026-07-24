"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import HiloComentarios from "@/components/feed/HiloComentarios";
import ReportarButton from "@/components/moderacion/ReportarButton";
import {
  eliminarPublicacion,
  formatearFechaRelativa,
  formatearFechaShow,
  obtenerMetricasPublicaciones,
  toggleLike,
  type MetricasPublicacion,
  type PublicacionConAutor,
} from "@/lib/feed";
import { esSala } from "@/lib/usuario";

type Props = {
  publicacion: PublicacionConAutor;
  usuarioActualId: string | null;
  metricas: MetricasPublicacion;
  onMetricasChange: (metricas: MetricasPublicacion) => void;
  onEliminada?: (id: string) => void;
};

export default function PublicacionCard({
  publicacion,
  usuarioActualId,
  metricas,
  onMetricasChange,
  onEliminada,
}: Props) {
  const router = useRouter();
  const [borrando, setBorrando] = useState(false);
  const [likeando, setLikeando] = useState(false);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);

  const autor = publicacion.autor;
  const esPropio = usuarioActualId === publicacion.autor_id;
  const perfilHref = autor ? `/musicos/${autor.id}` : "#";

  const borrar = async () => {
    if (!usuarioActualId || !confirm("¿Eliminar esta publicación?")) return;
    setBorrando(true);
    const { error } = await eliminarPublicacion(publicacion.id, usuarioActualId);
    setBorrando(false);
    if (!error) onEliminada?.(publicacion.id);
  };

  const darLike = async () => {
    if (!usuarioActualId) {
      router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
      return;
    }

    setLikeando(true);
    const liked = metricas.likedByMe;
    const { error } = await toggleLike(publicacion.id, usuarioActualId, liked);
    setLikeando(false);

    if (!error) {
      onMetricasChange({
        ...metricas,
        likedByMe: !liked,
        likes: Math.max(0, metricas.likes + (liked ? -1 : 1)),
      });
    }
  };

  const inicial = (autor?.nombre ?? "?").charAt(0).toUpperCase();

  const refrescarMetricas = async () => {
    const m = await obtenerMetricasPublicaciones([publicacion.id], usuarioActualId);
    const actualizada = m[publicacion.id];
    if (actualizada) onMetricasChange(actualizada);
  };

  return (
    <article className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 hover:border-gray-200 hover:dark:border-gray-700 transition-colors">
      <div className="flex gap-3">
        <Link href={perfilHref} className="flex-shrink-0">
          {autor?.avatar_url ? (
            <div
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 bg-cover bg-center"
              style={{ backgroundImage: `url(${autor.avatar_url})` }}
              aria-hidden
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-sm font-semibold text-emerald-700">
              {inicial}
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              href={perfilHref}
              className="font-medium text-gray-900 dark:text-gray-50 text-sm hover:text-emerald-700 truncate"
            >
              {autor?.nombre ?? "Usuario"}
            </Link>
            {autor?.instrumento && !esSala(autor) && (
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{autor.instrumento}</span>
            )}
            {autor?.tipo === "sala" && (
              <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                Sala
              </span>
            )}
            <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
            <time
              className="text-xs text-gray-400 dark:text-gray-500"
              dateTime={publicacion.created_at}
              title={new Date(publicacion.created_at).toLocaleString("es-ES")}
            >
              {formatearFechaRelativa(publicacion.created_at)}
            </time>
          </div>

          {publicacion.tipo === "show" && (
            <div className="mt-2 inline-flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                🎤 Show
              </span>
              {publicacion.fecha_evento && (
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {formatearFechaShow(publicacion.fecha_evento)}
                </span>
              )}
              {publicacion.lugar && (
                <span className="text-xs text-gray-500 dark:text-gray-400">📍 {publicacion.lugar}</span>
              )}
            </div>
          )}

          <p className="mt-2 text-sm text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words">
            {publicacion.contenido}
          </p>

          <div className="mt-3 flex items-center gap-1 -ml-2">
            <button
              type="button"
              onClick={darLike}
              disabled={likeando}
              aria-pressed={metricas.likedByMe}
              aria-label={metricas.likedByMe ? "Quitar me gusta" : "Me gusta"}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                metricas.likedByMe
                  ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 hover:dark:bg-gray-800 hover:text-rose-600"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={metricas.likedByMe ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {metricas.likes > 0 && <span>{metricas.likes}</span>}
            </button>

            <button
              type="button"
              onClick={() => setMostrarComentarios((v) => !v)}
              aria-expanded={mostrarComentarios}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                mostrarComentarios
                  ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 hover:dark:bg-gray-800 hover:text-emerald-600"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {metricas.comentarios > 0 && <span>{metricas.comentarios}</span>}
              <span className="sr-only">Comentarios</span>
            </button>
          </div>

          {mostrarComentarios && (
            <HiloComentarios
              publicacionId={publicacion.id}
              usuarioActualId={usuarioActualId}
              onComentariosChange={refrescarMetricas}
            />
          )}

          <div className="mt-2 flex justify-end">
            {esPropio ? (
              <button
                type="button"
                onClick={borrar}
                disabled={borrando}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-600 disabled:opacity-50"
              >
                {borrando ? "Eliminando..." : "Eliminar publicación"}
              </button>
            ) : (
              <ReportarButton
                tipoObjetivo="publicacion"
                objetivoId={publicacion.id}
                redirectLogin="/feed"
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
