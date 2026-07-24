"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { obtenerOCrearConversacion } from "@/lib/mensajes";
import { esMusico, esSala, TIPO_MUSICO } from "@/lib/usuario";

type Props = {
  salaId: string;
  salaNombre: string | null;
  ownerId?: string;
};

export default function ContactarSalaButton({ salaId, salaNombre, ownerId }: Props) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactar = async () => {
    setCargando(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const destino = `/mensajes?sala=${salaId}`;
      router.push(`/login?redirect=${encodeURIComponent(destino)}`);
      return;
    }

    if (user.id === salaId || user.id === ownerId) {
      setError("No puedes enviarte mensajes a tu propia sala.");
      setCargando(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("tipo")
      .eq("id", user.id)
      .maybeSingle();

    if (perfil && esSala(perfil)) {
      setError("Las salas reciben mensajes en Mensajes; no pueden iniciar desde aquí.");
      setCargando(false);
      return;
    }

    if (perfil && !esMusico(perfil)) {
      setError("Solo los músicos pueden contactar salas por ahora.");
      setCargando(false);
      return;
    }

    if (!perfil) {
      await supabase.from("usuarios").insert({
        id: user.id,
        tipo: TIPO_MUSICO,
        nombre: user.email?.split("@")[0] ?? "Músico",
        email: user.email,
        disponible: true,
      });
    }

    const { data: conversacionId, error: convError } = await obtenerOCrearConversacion(
      user.id,
      salaId
    );

    setCargando(false);

    if (convError || !conversacionId) {
      setError(
        "No pudimos abrir la conversación. ¿Ejecutaste la migración de mensajes en Supabase?"
      );
      return;
    }

    router.push(`/mensajes?c=${conversacionId}`);
  };

  const label = salaNombre
    ? `Enviar mensaje a ${salaNombre}`
    : "Enviar mensaje";

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={contactar}
        disabled={cargando}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {cargando ? "Abriendo chat..." : label}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-400">
        Coordina horarios, grupo y equipamiento sin salir de la app.
      </p>
    </div>
  );
}
