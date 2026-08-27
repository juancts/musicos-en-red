"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

export default function EliminarCuentaSeccion() {
  const [abierto, setAbierto] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmarEliminacion = async () => {
    setEliminando(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("Tu sesión expiró. Recarga la página e inicia sesión de nuevo.");
      setEliminando(false);
      return;
    }

    try {
      const res = await fetch("/api/cuenta/eliminar", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();

      if (!res.ok || !data.eliminado) {
        setError(data.error ?? "No pudimos eliminar tu cuenta. Inténtalo de nuevo.");
        setEliminando(false);
        return;
      }

      await signOut();
      window.location.href = "/";
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
      setEliminando(false);
    }
  };

  if (!abierto) {
    return (
      <div className="mt-12 text-center">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="text-xs text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors"
        >
          Eliminar mi cuenta
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12 rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-5 text-center">
      <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
        ¿Eliminar tu cuenta?
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
        Se borrarán tu perfil, tus salas, anuncios, conversaciones y toda tu actividad. Esta
        acción no se puede deshacer.
      </p>
      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
          disabled={eliminando}
          className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirmarEliminacion}
          disabled={eliminando}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {eliminando ? "Eliminando..." : "Sí, eliminar mi cuenta"}
        </button>
      </div>
    </div>
  );
}
