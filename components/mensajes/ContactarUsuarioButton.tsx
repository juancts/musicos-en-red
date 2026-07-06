"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerOCrearConversacion } from "@/lib/mensajes";
import { supabase } from "@/lib/supabase";
import { TIPO_MUSICO } from "@/lib/usuario";

type Props = {
  usuarioId: string;
  nombre: string | null;
};

export default function ContactarUsuarioButton({ usuarioId, nombre }: Props) {
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
      router.push(`/login?redirect=${encodeURIComponent(`/musicos/${usuarioId}`)}`);
      return;
    }

    if (user.id === usuarioId) {
      setError("No puedes enviarte mensajes a tu propio perfil.");
      setCargando(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil) {
      await supabase.from("usuarios").insert({
        id: user.id,
        tipo: TIPO_MUSICO,
        nombre: user.email?.split("@")[0] ?? "Musico",
        email: user.email,
        disponible: true,
      });
    }

    const { data: conversacionId, error: convError } =
      await obtenerOCrearConversacion(user.id, usuarioId);

    setCargando(false);

    if (convError || !conversacionId) {
      setError("No pudimos abrir la conversacion.");
      return;
    }

    router.push(`/mensajes?c=${conversacionId}`);
  };

  return (
    <div>
      <button
        type="button"
        onClick={contactar}
        disabled={cargando}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
      >
        {cargando ? "Abriendo chat..." : `Mensaje${nombre ? ` a ${nombre}` : ""}`}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
