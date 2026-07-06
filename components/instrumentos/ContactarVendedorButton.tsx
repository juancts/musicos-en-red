"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { enviarMensaje, obtenerOCrearConversacion } from "@/lib/mensajes";
import { TIPO_MUSICO } from "@/lib/usuario";

type Props = {
  anuncioId: string;
  vendedorId: string;
  tituloAnuncio: string;
  vendedorNombre?: string | null;
};

export default function ContactarVendedorButton({
  anuncioId,
  vendedorId,
  tituloAnuncio,
  vendedorNombre,
}: Props) {
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
      const destino = `/instrumentos/${anuncioId}`;
      router.push(`/login?redirect=${encodeURIComponent(destino)}`);
      return;
    }

    if (user.id === vendedorId) {
      setError("No puedes contactarte contigo mismo.");
      setCargando(false);
      return;
    }

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

    const { data: conversacionId, error: convError } = await obtenerOCrearConversacion(
      user.id,
      vendedorId
    );

    if (convError || !conversacionId) {
      setCargando(false);
      setError(
        "No pudimos abrir el chat. ¿Ejecutaste la migración de mensajes (002) en Supabase?"
      );
      return;
    }

    const cuerpo = `Hola, me interesa tu anuncio «${tituloAnuncio}». ¿Sigue disponible?`;

    const { data: mensajesExistentes } = await supabase
      .from("mensajes")
      .select("id")
      .eq("conversacion_id", conversacionId)
      .limit(1);

    if (!mensajesExistentes?.length) {
      await enviarMensaje(conversacionId, user.id, cuerpo);
    }

    setCargando(false);
    router.push(`/mensajes?c=${conversacionId}`);
  };

  const label = vendedorNombre
    ? `Contactar a ${vendedorNombre}`
    : "Contactar al vendedor";

  return (
    <div>
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
        El pago y la entrega se acuerdan entre vosotros por mensaje.
      </p>
    </div>
  );
}
