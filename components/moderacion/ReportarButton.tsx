"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOTIVOS_REPORTE, reportarContenido, type TipoObjetivoReporte } from "@/lib/moderacion";
import { supabase } from "@/lib/supabase";

type Props = {
  tipoObjetivo: TipoObjetivoReporte;
  objetivoId: string;
  redirectLogin: string;
  className?: string;
};

export default function ReportarButton({
  tipoObjetivo,
  objetivoId,
  redirectLogin,
  className,
}: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState<string>(MOTIVOS_REPORTE[0]);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abrir = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(redirectLogin)}`);
      return;
    }

    setAbierto(true);
  };

  const enviar = async () => {
    setEnviando(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(redirectLogin)}`);
      return;
    }

    const { error: insertError } = await reportarContenido({
      reportanteId: user.id,
      tipoObjetivo,
      objetivoId,
      motivo,
      detalle,
    });

    setEnviando(false);

    if (insertError) {
      setError(
        insertError.message.includes("reportes")
          ? "Ejecuta supabase/migrations/011_moderacion.sql en Supabase."
          : "No se pudo enviar el reporte."
      );
      return;
    }

    setEnviado(true);
  };

  if (enviado) {
    return (
      <p className={`text-xs text-emerald-600 ${className ?? ""}`}>
        Gracias, hemos recibido tu reporte.
      </p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={abrir}
        className={`text-xs text-gray-400 dark:text-gray-500 hover:text-red-600 transition-colors ${className ?? ""}`}
      >
        Reportar
      </button>
    );
  }

  return (
    <div className={`text-left border border-gray-100 dark:border-gray-800 rounded-xl p-3 ${className ?? ""}`}>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-2">¿Por qué reportas esto?</p>
      <select
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
      >
        {MOTIVOS_REPORTE.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <textarea
        value={detalle}
        onChange={(e) => setDetalle(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Detalles adicionales (opcional)"
        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2 resize-none"
      />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={enviar}
          disabled={enviando}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar reporte"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:dark:text-gray-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
