"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  enviarMensaje,
  listarConversaciones,
  listarMensajes,
  marcarMensajesLeidos,
  nombreContraparte,
  obtenerOCrearConversacion,
  type ConversacionConParticipantes,
  type MensajeRow,
} from "@/lib/mensajes";
import { listarIdsBloqueados } from "@/lib/moderacion";
import { TIPO_MUSICO } from "@/lib/usuario";

type Estado = "cargando" | "sin-sesion" | "listo";

function formatearFecha(iso: string) {
  const fecha = new Date(iso);
  const hoy = new Date();
  const mismoDia =
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear();

  if (mismoDia) {
    return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }

  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export default function MensajesInbox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversacionActiva = searchParams.get("c");
  const contactoNuevo = searchParams.get("usuario") ?? searchParams.get("sala");

  const [estado, setEstado] = useState<Estado>("cargando");
  const [userId, setUserId] = useState<string | null>(null);
  const [conversaciones, setConversaciones] = useState<ConversacionConParticipantes[]>([]);
  const [mensajes, setMensajes] = useState<MensajeRow[]>([]);
  const [ultimosMensajes, setUltimosMensajes] = useState<Record<string, MensajeRow>>({});
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargandoChat, setCargandoChat] = useState(false);
  const finMensajesRef = useRef<HTMLDivElement>(null);

  const conversacionSeleccionada = useMemo(
    () => conversaciones.find((c) => c.id === conversacionActiva) ?? null,
    [conversaciones, conversacionActiva]
  );

  const cargarConversaciones = useCallback(async (uid: string) => {
    const { data, error: listError } = await listarConversaciones(uid);

    if (listError) {
      setError("No pudimos cargar tus conversaciones.");
      return [];
    }

    const { ids: bloqueados } = await listarIdsBloqueados(uid);
    const bloqueadosSet = new Set(bloqueados);

    const todas = (data as unknown as ConversacionConParticipantes[] | null) ?? [];
    const lista = bloqueadosSet.size
      ? todas.filter((c) => {
          const contraparteId =
            c.musico_id === uid ? c.sala?.owner_id ?? c.sala_id : c.musico_id;
          return !bloqueadosSet.has(contraparteId);
        })
      : todas;
    setConversaciones(lista);

    if (lista.length > 0) {
      const { data: recientes } = await supabase
        .from("mensajes")
        .select("id, conversacion_id, remitente_id, cuerpo, leido, created_at")
        .in(
          "conversacion_id",
          lista.map((c) => c.id)
        )
        .order("created_at", { ascending: false });

      const mapa: Record<string, MensajeRow> = {};
      for (const msg of (recientes as MensajeRow[] | null) ?? []) {
        if (!mapa[msg.conversacion_id]) {
          mapa[msg.conversacion_id] = msg;
        }
      }
      setUltimosMensajes(mapa);
    } else {
      setUltimosMensajes({});
    }

    return lista;
  }, []);

  const cargarMensajes = useCallback(
    async (conversacionId: string, uid: string) => {
      setCargandoChat(true);
      const { data, error: msgError } = await listarMensajes(conversacionId);
      setCargandoChat(false);

      if (msgError) {
        setError("No pudimos cargar los mensajes.");
        return;
      }

      const lista = (data as MensajeRow[] | null) ?? [];
      setMensajes(lista);
      await marcarMensajesLeidos(conversacionId, uid);
      await cargarConversaciones(uid);
    },
    [cargarConversaciones]
  );

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      setEstado("cargando");
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!activo) return;

      if (!user) {
        setEstado("sin-sesion");
        return;
      }

      setUserId(user.id);

      if (contactoNuevo) {
        const { data: perfil } = await supabase
          .from("usuarios")
          .select("tipo")
          .eq("id", user.id)
          .maybeSingle();

        if (!perfil) {
          await supabase.from("usuarios").insert({
            id: user.id,
            tipo: TIPO_MUSICO,
            nombre: user.email?.split("@")[0] ?? "Músico",
            email: user.email,
            disponible: true,
          });
        }

        const { data: convId, error: convError } = await obtenerOCrearConversacion(
          user.id,
          contactoNuevo
        );

        if (!activo) return;

        if (convError || !convId) {
          setError(
            "No pudimos crear la conversación. Ejecuta supabase/migrations/002_mensajes.sql."
          );
        } else {
          router.replace(`/mensajes?c=${convId}`);
        }
      }

      await cargarConversaciones(user.id);
      setEstado("listo");
    }

    iniciar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      iniciar();
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [contactoNuevo, router, cargarConversaciones]);

  useEffect(() => {
    if (!userId || !conversacionActiva) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMensajes([]);
      return;
    }

    cargarMensajes(conversacionActiva, userId);

    const canal = supabase
      .channel(`mensajes:${conversacionActiva}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionActiva}`,
        },
        (payload) => {
          const nuevo = payload.new as MensajeRow;
          setMensajes((prev) => {
            if (prev.some((m) => m.id === nuevo.id)) return prev;
            return [...prev, nuevo];
          });
          if (nuevo.remitente_id !== userId) {
            marcarMensajesLeidos(conversacionActiva, userId);
          }
          cargarConversaciones(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [conversacionActiva, userId, cargarMensajes, cargarConversaciones]);

  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, conversacionActiva]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !conversacionActiva || !texto.trim()) return;

    setEnviando(true);
    const cuerpo = texto;
    setTexto("");

    const { data, error: sendError } = await enviarMensaje(
      conversacionActiva,
      userId,
      cuerpo
    );

    setEnviando(false);

    if (sendError || !data) {
      setTexto(cuerpo);
      setError("No se pudo enviar el mensaje.");
      return;
    }

    setMensajes((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev;
      return [...prev, data as MensajeRow];
    });
    await cargarConversaciones(userId);
  };

  if (estado === "cargando") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-8 w-40 rounded-lg bg-gray-100 mb-6" />
        <div className="h-96 rounded-2xl border border-gray-100 bg-gray-50/50" />
      </div>
    );
  }

  if (estado === "sin-sesion") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Mensajes</h1>
        <p className="mt-2 text-sm text-gray-400">
          Inicia sesion para hablar con otros contactos.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent("/mensajes")}`}
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Entrar
        </Link>
      </div>
    );
  }

  const mostrarChatEnMovil = Boolean(conversacionActiva);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-400 mt-1">
          Conversaciones con musicos y salas
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex h-[min(70vh,640px)] rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
        <aside
          className={`w-full sm:w-72 sm:flex-shrink-0 border-r border-gray-100 flex flex-col ${
            mostrarChatEnMovil ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Conversaciones
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversaciones.length === 0 ? (
              <p className="px-4 py-8 text-sm text-gray-400 text-center">
                Aún no tienes mensajes.
                <br />
                <Link href="/explorar" className="text-emerald-600 hover:underline mt-2 inline-block">
                  Explorar musicos
                </Link>
              </p>
            ) : (
              conversaciones.map((conv) => {
                const activa = conv.id === conversacionActiva;
                const ultimo = ultimosMensajes[conv.id];
                const noLeidos =
                  ultimo &&
                  !ultimo.leido &&
                  ultimo.remitente_id !== userId &&
                  userId;

                return (
                  <Link
                    key={conv.id}
                    href={`/mensajes?c=${conv.id}`}
                    className={`block px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50 ${
                      activa ? "bg-emerald-50/60" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userId ? nombreContraparte(conv, userId) : "—"}
                      </p>
                      {ultimo && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatearFecha(ultimo.created_at)}
                        </span>
                      )}
                    </div>
                    {ultimo && (
                      <p
                        className={`text-xs mt-0.5 truncate ${
                          noLeidos ? "text-gray-900 font-medium" : "text-gray-400"
                        }`}
                      >
                        {ultimo.remitente_id === userId ? "Tú: " : ""}
                        {ultimo.cuerpo}
                      </p>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={`flex-1 flex flex-col min-w-0 ${
            mostrarChatEnMovil ? "flex" : "hidden sm:flex"
          }`}
        >
          {!conversacionActiva ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <p className="text-sm text-gray-400">
                Elige una conversacion o contacta a alguien desde su perfil.
              </p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <Link
                  href="/mensajes"
                  className="sm:hidden text-sm text-gray-400 hover:text-gray-700"
                >
                  ←
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userId && conversacionSeleccionada
                      ? nombreContraparte(conversacionSeleccionada, userId)
                      : "Conversación"}
                  </p>
                  {conversacionSeleccionada && userId === conversacionSeleccionada.sala_id && (
                    <Link
                      href={`/musicos/${conversacionSeleccionada.musico_id}`}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Ver perfil
                    </Link>
                  )}
                  {conversacionSeleccionada && userId === conversacionSeleccionada.musico_id && (
                    <Link
                      href={`/musicos/${conversacionSeleccionada.sala_id}`}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Ver perfil
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/40">
                {cargandoChat ? (
                  <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
                ) : mensajes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Escribe el primer mensaje.
                  </p>
                ) : (
                  mensajes.map((msg) => {
                    const propio = msg.remitente_id === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${propio ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                            propio
                              ? "bg-emerald-600 text-white rounded-br-md"
                              : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.cuerpo}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              propio ? "text-emerald-100" : "text-gray-400"
                            }`}
                          >
                            {formatearFecha(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={finMensajesRef} />
              </div>

              <form
                onSubmit={enviar}
                className="p-3 border-t border-gray-100 flex gap-2 bg-white"
              >
                <input
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  maxLength={2000}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={enviando || !texto.trim()}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Enviar
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
