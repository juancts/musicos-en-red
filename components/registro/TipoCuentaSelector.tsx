import { useState } from "react";
import Link from "next/link";
import type { TipoCuenta } from "@/lib/usuario";
import { signInWithGoogle } from "@/lib/auth";
import { RegistroShell } from "./RegistroShell";

type Props = {
  onSelect: (tipo: TipoCuenta) => void;
};

export default function TipoCuentaSelector({ onSelect }: Props) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registrarseConGoogle = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle(`${window.location.origin}/perfil`);

      if (error) {
        setError(
          error.message.includes("Unsupported provider")
            ? "El inicio de sesión con Google no está disponible en este momento."
            : error.message
        );
        setGoogleLoading(false);
      }
    } catch {
      setError("Error inesperado al conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <RegistroShell>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">
        ¿Cómo quieres unirte?
      </h1>
      <p className="text-gray-400 dark:text-gray-500 text-sm mb-8">
        Elige el tipo de cuenta que mejor te describe
      </p>

      <button
        type="button"
        onClick={registrarseConGoogle}
        disabled={googleLoading}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors hover:border-gray-300 hover:dark:border-gray-600 hover:bg-gray-50 hover:dark:bg-gray-800 disabled:opacity-60"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-gray-900 text-sm font-semibold text-blue-600">
          G
        </span>
        {googleLoading ? "Conectando..." : "Registrarse con Google"}
      </button>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        <span className="text-xs text-gray-400 dark:text-gray-500">o completa el perfil</span>
        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSelect("musico")}
          className="w-full text-left border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:dark:bg-emerald-950/40 transition-all"
        >
          <span className="text-2xl" aria-hidden>
            🎸
          </span>
          <p className="mt-3 font-medium text-gray-900 dark:text-gray-50 text-sm">Soy músico</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Busco banda, colaboraciones o compartir partituras con otros músicos.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("sala")}
          className="w-full text-left border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:dark:bg-emerald-950/40 transition-all"
        >
          <span className="text-2xl" aria-hidden>
            🏠
          </span>
          <p className="mt-3 font-medium text-gray-900 dark:text-gray-50 text-sm">
            Tengo una sala de ensayos
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            Ofrezco mi espacio en alquiler para bandas y músicos.
          </p>
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-emerald-600 hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </RegistroShell>
  );
}
