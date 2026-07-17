"use client";

import { useState } from "react";
import Link from "next/link";
import { resetPasswordForEmail } from "@/lib/auth";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/actualizar-password`;
      const { error } = await resetPasswordForEmail(email, redirectTo);

      if (error) {
        setError(error.message);
        return;
      }

      setEnviado(true);
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
          <h1 className="text-2xl font-semibold mt-3 text-gray-900">Recuperar contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">
            Te enviaremos un enlace para crear una nueva contraseña
          </p>
        </div>

        {enviado ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-3 py-3 rounded-lg text-center">
            Si existe una cuenta con ese email, te llegará un enlace para restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-emerald-600 hover:underline font-medium">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
