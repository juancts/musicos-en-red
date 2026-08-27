"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { bloquearUsuario, desbloquearUsuario, estaBloqueado } from "@/lib/moderacion";
import { supabase } from "@/lib/supabase";

type Props = {
  usuarioId: string;
  redirectLogin: string;
  className?: string;
};

export default function BloquearUsuarioButton({ usuarioId, redirectLogin, className }: Props) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!activo || !user || user.id === usuarioId) return;
      setUserId(user.id);

      const { bloqueado: yaBloqueado } = await estaBloqueado(user.id, usuarioId);
      if (activo) setBloqueado(yaBloqueado);
    });

    return () => {
      activo = false;
    };
  }, [usuarioId]);

  const alternar = async () => {
    setError(null);

    if (!userId) {
      router.push(`/login?redirect=${encodeURIComponent(redirectLogin)}`);
      return;
    }

    if (!bloqueado && !confirm("¿Bloquear a este usuario? No podrán enviarte mensajes.")) {
      return;
    }

    setCargando(true);
    const { error: opError } = bloqueado
      ? await desbloquearUsuario(userId, usuarioId)
      : await bloquearUsuario(userId, usuarioId);
    setCargando(false);

    if (opError) {
      setError("No se pudo completar la acción.");
      return;
    }

    setBloqueado(!bloqueado);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={alternar}
        disabled={cargando}
        className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        {cargando ? "..." : bloqueado ? "Desbloquear usuario" : "Bloquear usuario"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
