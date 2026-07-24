"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearComentario,
  eliminarComentario,
  formatearFechaRelativa,
  listarComentarios,
  ordenarComentariosHilo,
  profundidadComentario,
  type ComentarioConAutor,
} from "@/lib/feed";
import { TIPO_MUSICO } from "@/lib/usuario";
import { supabase } from "@/lib/supabase";

type Props = {
  publicacionId: string;
  usuarioActualId: string | null;
  onComentariosChange?: () => void;
};

function AvatarMini({
  nombre,
  avatarUrl,
}: {
  nombre: string | null;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      <div
        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 bg-cover bg-center flex-shrink-0"
        style={{ backgroundImage: `url(${avatarUrl})` }}
        aria-hidden
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-semibold text-emerald-700 flex-shrink-0">
      {(nombre ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function HiloComentarios({
  publicacionId,
  usuarioActualId,
  onComentariosChange,
}: Props) {
  const router = useRouter();
  const [comentarios, setComentarios] = useState<ComentarioConAutor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState("");
  const [respondiendoA, setRespondiendoA] = useState<ComentarioConAutor | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error: listError } = await listarComentarios(publicacionId);
    if (listError) {
      setError("No se pudieron cargar los comentarios.");
      setCargando(false);
      return;
    }
    setComentarios(ordenarComentariosHilo((data as unknown as ComentarioConAutor[]) ?? []));
    setCargando(false);
  }, [publicacionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const porId = useMemo(
    () => new Map(comentarios.map((c) => [c.id, c])),
    [comentarios]
  );

  const asegurarPerfil = async (userId: string) => {
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!perfil) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("usuarios").insert({
        id: userId,
        tipo: TIPO_MUSICO,
        nombre: user?.email?.split("@")[0] ?? "Músico",
        email: user?.email,
        disponible: true,
      });
    }
  };

  const enviar = async () => {
    if (!usuarioActualId) {
      router.push(`/login?redirect=${encodeURIComponent("/feed")}`);
      return;
    }

    setEnviando(true);
    setError(null);
    await asegurarPerfil(usuarioActualId);

    const { data, error: insertError } = await crearComentario({
      publicacionId,
      autorId: usuarioActualId,
      contenido: texto,
      parentId: respondiendoA?.id ?? null,
    });

    setEnviando(false);

    if (insertError || !data) {
      setError(
        insertError?.message.includes("publicacion_comentarios")
          ? "Ejecuta 006_feed_likes_comentarios.sql en Supabase."
          : insertError?.message || "No se pudo publicar el comentario."
      );
      return;
    }

    setTexto("");
    setRespondiendoA(null);
    await cargar();
    onComentariosChange?.();
  };

  const borrar = async (comentario: ComentarioConAutor) => {
    if (!usuarioActualId || !confirm("¿Eliminar este comentario?")) return;
    await eliminarComentario(comentario.id, usuarioActualId);
    await cargar();
    onComentariosChange?.();
  };

  return (
    <div className="mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
      {cargando ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Cargando respuestas...</p>
      ) : comentarios.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2">Sé el primero en responder.</p>
      ) : (
        <ul className="space-y-3 mb-3">
          {comentarios.map((c) => {
            const depth = profundidadComentario(c, porId);
            const padre = c.parent_id ? porId.get(c.parent_id) : null;

            return (
              <li
                key={c.id}
                className="flex gap-2"
                style={{ marginLeft: depth > 0 ? `${Math.min(depth, 3) * 1.25}rem` : 0 }}
              >
                <AvatarMini
                  nombre={c.autor?.nombre ?? null}
                  avatarUrl={c.autor?.avatar_url ?? null}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <Link
                      href={`/musicos/${c.autor_id}`}
                      className="text-xs font-medium text-gray-900 dark:text-gray-50 hover:text-emerald-700"
                    >
                      {c.autor?.nombre ?? "Usuario"}
                    </Link>
                    <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                    <time className="text-xs text-gray-400 dark:text-gray-500">
                      {formatearFechaRelativa(c.created_at)}
                    </time>
                  </div>
                  {padre && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                      Respondiendo a{" "}
                      <span className="text-emerald-600">@{padre.autor?.nombre ?? "usuario"}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5 whitespace-pre-wrap break-words">
                    {c.contenido}
                  </p>
                  <div className="mt-1 flex gap-3">
                    {usuarioActualId && (
                      <button
                        type="button"
                        onClick={() => {
                          setRespondiendoA(c);
                          setTexto(`@${c.autor?.nombre ?? "usuario"} `);
                        }}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-emerald-600"
                      >
                        Responder
                      </button>
                    )}
                    {usuarioActualId === c.autor_id && (
                      <button
                        type="button"
                        onClick={() => borrar(c)}
                        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-600"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {respondiendoA && (
        <p className="text-xs text-emerald-600 mb-2 flex items-center gap-2">
          Respondiendo a @{respondiendoA.autor?.nombre ?? "usuario"}
          <button
            type="button"
            onClick={() => {
              setRespondiendoA(null);
              setTexto("");
            }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:dark:text-gray-300"
          >
            Cancelar
          </button>
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={280}
          disabled={!usuarioActualId}
          placeholder={
            usuarioActualId ? "Escribe una respuesta..." : "Inicia sesión para comentar"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (texto.trim()) enviar();
            }
          }}
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50 disabled:dark:bg-gray-800"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {enviando ? "..." : "Enviar"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
