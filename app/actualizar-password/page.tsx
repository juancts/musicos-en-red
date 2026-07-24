"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function ActualizarPasswordPage() {
  const [listo, setListo] = useState(false);
  const [enlaceInvalido, setEnlaceInvalido] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actualizado, setActualizado] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setListo(true);
      }
    });

    // Si al cargar ya hay sesión (el link se procesó antes de suscribirnos), no bloqueamos.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setListo(true);
    });

    const timeout = setTimeout(() => {
      setListo((yaListo) => {
        if (!yaListo) setEnlaceInvalido(true);
        return yaListo;
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setError(error.message);
        return;
      }

      setActualizado(true);
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🔑</span>
          <h1 className="text-2xl font-semibold mt-3 text-gray-900 dark:text-gray-50">Nueva contraseña</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Elige una nueva contraseña para tu cuenta</p>
        </div>

        {enlaceInvalido && !listo ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-3 rounded-lg text-center">
            Este enlace no es válido o ha caducado.{" "}
            <Link href="/recuperar-password" className="underline font-medium">
              Solicita uno nuevo
            </Link>
            .
          </div>
        ) : actualizado ? (
          <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-800 text-sm px-3 py-3 rounded-lg text-center">
            Tu contraseña se actualizó correctamente.{" "}
            <Link href="/login" className="underline font-medium">
              Inicia sesión
            </Link>
            .
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                disabled={!listo}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:bg-gray-50 disabled:dark:bg-gray-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                disabled={!listo}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:bg-gray-50 disabled:dark:bg-gray-800"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !listo}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {!listo ? "Verificando enlace..." : loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
