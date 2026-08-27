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
      titulo: "No pudimos cargar las salas",
      detalle: "Inténtalo de nuevo en unos segundos.",
      tecnico: error.message,
    };
  }

  if (error.code === "42501" || msg.includes("permission denied") || msg.includes("rls")) {
    return {
      titulo: "Sin permiso para leer salas",
      detalle: "Inténtalo de nuevo en unos segundos.",
      tecnico: error.message,
    };
  }

  return {
    titulo: "Error al cargar salas",
    detalle: "Inténtalo de nuevo en unos segundos.",
    tecnico: error.message,
  };
}
