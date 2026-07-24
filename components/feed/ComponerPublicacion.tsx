"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { crearPublicacion, type TipoPublicacion } from "@/lib/feed";
import { TIPO_MUSICO } from "@/lib/usuario";

type Props = {
  userId: string;
  onPublicado?: () => void;
};

export default function ComponerPublicacion({ userId, onPublicado }: Props) {
  const [contenido, setContenido] = useState("");
  const [esShow, setEsShow] = useState(false);
  const [fechaEvento, setFechaEvento] = useState("");
  const [lugar, setLugar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicar = async () => {
    setError(null);

    if (esShow && (!fechaEvento || !lugar.trim())) {
      setError("Para un show indica fecha y lugar.");
      return;
    }

    setEnviando(true);

    const { data: perfil } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!perfil) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("usuarios").insert({
        id: userId,
        tipo: TIPO_MUSICO,
        nombre: user?.email?.split("@")[0] ?? "Músico",
        email: user?.email,
        disponible: true,
      });
    }

    const tipo: TipoPublicacion = esShow ? "show" : "post";
    const fechaIso =
      esShow && fechaEvento ? new Date(fechaEvento).toISOString() : null;

    const { error: insertError } = await crearPublicacion({
      autorId: userId,
      contenido,
      tipo,
      fechaEvento: fechaIso,
      lugar: esShow ? lugar : null,
    });

    setEnviando(false);

    if (insertError) {
      setError(
        insertError.message.includes("publicaciones")
          ? "Ejecuta 005_feed_publicaciones.sql en Supabase."
          : insertError.message || "No se pudo publicar."
      );
      return;
    }

    setContenido("");
    setEsShow(false);
    setFechaEvento("");
    setLugar("");
    onPublicado?.();
  };

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-gray-900 shadow-sm">
      <textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="¿Qué estás tocando? Anuncia un show, busca banda o comparte una idea..."
        className="w-full resize-none border-0 text-sm text-gray-900 dark:text-gray-50 placeholder:text-gray-400 placeholder:dark:text-gray-500 focus:outline-none focus:ring-0"
      />

      <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={esShow}
          onChange={(e) => setEsShow(e.target.checked)}
          className="h-4 w-4 accent-emerald-600 rounded"
        />
        Es un show / concierto
      </label>

      {esShow && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Fecha y hora</label>
            <input
              type="datetime-local"
              value={fechaEvento}
              onChange={(e) => setFechaEvento(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Lugar</label>
            <input
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              maxLength={120}
              placeholder="Sala, bar, ciudad..."
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-3">
        <span className="text-xs text-gray-300 dark:text-gray-600">{contenido.length}/500</span>
        <button
          type="button"
          onClick={publicar}
          disabled={enviando || !contenido.trim()}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {enviando ? "Publicando..." : "Publicar"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
