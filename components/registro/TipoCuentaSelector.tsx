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
            ? "Google todavia no esta habilitado en Supabase Auth."
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
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        ¿Cómo quieres unirte?
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Elige el tipo de cuenta que mejor te describe
      </p>

      <button
        type="button"
        onClick={registrarseConGoogle}
        disabled={googleLoading}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-semibold text-blue-600">
          G
        </span>
        {googleLoading ? "Conectando..." : "Registrarse con Google"}
      </button>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-xs text-gray-400">o completa el perfil</span>
        <div className="h-px flex-1 bg-gray-100" />
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
          className="w-full text-left border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
        >
          <span className="text-2xl" aria-hidden>
            🎸
          </span>
          <p className="mt-3 font-medium text-gray-900 text-sm">Soy músico</p>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Busco banda, colaboraciones o compartir partituras con otros músicos.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelect("sala")}
          className="w-full text-left border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:bg-emerald-50/40 transition-all"
        >
          <span className="text-2xl" aria-hidden>
            🏠
          </span>
          <p className="mt-3 font-medium text-gray-900 text-sm">
            Tengo una sala de ensayos
          </p>
          <p className="mt-1 text-xs text-gray-400 leading-relaxed">
            Ofrezco mi espacio en alquiler para bandas y músicos.
          </p>
        </button>
      </div>

      <p className="text-center text-sm text-gray-400 mt-8">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-emerald-600 hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </RegistroShell>
  );
}
