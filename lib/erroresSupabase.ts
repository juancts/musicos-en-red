import type { PostgrestError } from "@supabase/supabase-js";

export function mensajeErrorEsquemaSalas(error: PostgrestError | null) {
  if (!error) return null;

  const msg = error.message.toLowerCase();
  const faltaColumna =
    error.code === "42703" ||
    msg.includes("tipo") ||
    msg.includes("precio_hora") ||
    msg.includes("equipamiento") ||
    msg.includes("capacidad_max") ||
    msg.includes("espacios_ensayo") ||
    msg.includes("servicios");

  if (faltaColumna) {
    return {
      titulo: "Falta la migración de salas en Supabase",
      detalle:
        "Ejecuta 001_salas_ensayo.sql y 003_centro_multiespacio.sql en el SQL Editor (Run).",
      tecnico: error.message,
    };
  }

  if (error.code === "42501" || msg.includes("permission denied") || msg.includes("rls")) {
    return {
      titulo: "Sin permiso para leer salas",
      detalle:
        "Vuelve a ejecutar 001_salas_ensayo.sql: incluye las políticas RLS de lectura pública.",
      tecnico: error.message,
    };
  }

  return {
    titulo: "Error al cargar salas",
    detalle: "Revisa la consola de Supabase o ejecuta las migraciones del proyecto.",
    tecnico: error.message,
  };
}
