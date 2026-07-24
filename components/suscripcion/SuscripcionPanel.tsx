"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { diasGraciaRestantes, esSuscriptorActivo, obtenerSuscripcion } from "@/lib/suscripcion";

type Props = {
  userId: string;
  /** Solo para cuentas de tipo sala: fecha de alta, para mostrar el
   *  contador/aviso del periodo de gracia de 60 días. Omitir para músicos. */
  createdAt?: string | null;
};

export default function SuscripcionPanel({ userId, createdAt }: Props) {
  const [estado, setEstado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const { estado: estadoActual } = await obtenerSuscripcion(supabase, userId);
      if (activo) {
        setEstado(estadoActual);
        setCargando(false);
      }
    }

    cargar();

    // Si venimos de un checkout exitoso, el webhook puede tardar un instante
    // en procesar — reintentamos una vez tras una breve espera.
    if (new URLSearchParams(window.location.search).get("suscripcion") === "exito") {
      const timeout = setTimeout(cargar, 2500);
      return () => {
        activo = false;
        clearTimeout(timeout);
      };
    }

    return () => {
      activo = false;
    };
  }, [userId]);

  const iniciarFlujo = async (ruta: "checkout" | "portal") => {
    setError(null);
    setProcesando(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Tu sesión expiró. Recarga la página e inicia sesión de nuevo.");
        setProcesando(false);
        return;
      }

      const res = await fetch(`/api/stripe/${ruta}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? "No pudimos completar la operación. Inténtalo de nuevo.");
        setProcesando(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
        <div className="h-5 w-40 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  const activo = esSuscriptorActivo(estado);
  const diasRestantes = createdAt !== undefined ? diasGraciaRestantes(createdAt) : null;
  const mostrarAvisoGracia = createdAt !== undefined && !activo;

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-50">Suscripción</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activo
              ? "Eres suscriptor — perfil destacado, insignia y anuncios ilimitados."
              : "Hazte suscriptor por 2,99€/mes: destacado en búsquedas, insignia y sin límite de anuncios."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => iniciarFlujo(activo ? "portal" : "checkout")}
          disabled={procesando}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {procesando ? "Cargando..." : activo ? "Gestionar suscripción" : "Suscribirme"}
        </button>
      </div>

      {mostrarAvisoGracia && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            diasRestantes && diasRestantes > 0
              ? "border-amber-100 bg-amber-50 text-amber-700"
              : "border-red-100 bg-red-50 text-red-600"
          }`}
        >
          {diasRestantes && diasRestantes > 0
            ? `Tu sala es visible gratis durante el periodo de prueba: quedan ${diasRestantes} ${
                diasRestantes === 1 ? "día" : "días"
              }. Después, tu perfil se ocultará de las búsquedas hasta que te suscribas.`
            : "El periodo de prueba de 60 días ha terminado y tu perfil está oculto en /salas y tu página pública. Suscríbete para reactivarlo."}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
