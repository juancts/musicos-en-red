import { supabase } from "@/lib/supabase";

export type EstadoSolicitudReserva =
  | "pendiente"
  | "aceptada"
  | "rechazada"
  | "cancelada";

export type NuevaSolicitudReserva = {
  sala_id: string;
  musico_id: string;
  espacio_id: string | null;
  fecha: string;
  hora_inicio: string;
  duracion_horas: number;
  num_musicos: number;
  mensaje: string | null;
};

export type SolicitudReservaSala = NuevaSolicitudReserva & {
  id: string;
  estado: EstadoSolicitudReserva;
  created_at: string;
  updated_at: string;
  espacio?: { nombre: string | null } | null;
  musico?: {
    nombre: string | null;
    email: string | null;
    codigo_postal: string | null;
    provincia: string | null;
  } | null;
};

type SolicitudReservaRaw = NuevaSolicitudReserva & {
  id: string;
  estado: EstadoSolicitudReserva;
  created_at: string;
  updated_at: string;
  espacio?: { nombre: string | null } | { nombre: string | null }[] | null;
  musico?:
    | {
        nombre: string | null;
        email: string | null;
        codigo_postal: string | null;
        provincia: string | null;
      }
    | {
        nombre: string | null;
        email: string | null;
        codigo_postal: string | null;
        provincia: string | null;
      }[]
    | null;
};

const solicitudSelect = `
  id,
  sala_id,
  musico_id,
  espacio_id,
  fecha,
  hora_inicio,
  duracion_horas,
  num_musicos,
  mensaje,
  estado,
  created_at,
  updated_at,
  espacio:espacios_ensayo(nombre),
  musico:usuarios!solicitudes_reserva_sala_musico_id_fkey(nombre,email,codigo_postal,provincia)
`;

function primerJoin<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function normalizarSolicitudReserva(
  solicitud: unknown
): SolicitudReservaSala {
  const reserva = solicitud as SolicitudReservaRaw;

  return {
    ...reserva,
    espacio: primerJoin(reserva.espacio),
    musico: primerJoin(reserva.musico),
  };
}

export function normalizarSolicitudesReserva(solicitudes: unknown) {
  return Array.isArray(solicitudes)
    ? solicitudes.map(normalizarSolicitudReserva)
    : [];
}

export async function crearSolicitudReserva(payload: NuevaSolicitudReserva) {
  return supabase
    .from("solicitudes_reserva_sala")
    .insert(payload)
    .select(solicitudSelect)
    .single();
}

export async function listarSolicitudesSala(salaId: string) {
  return supabase
    .from("solicitudes_reserva_sala")
    .select(solicitudSelect)
    .eq("sala_id", salaId)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });
}

export async function actualizarEstadoSolicitud(
  id: string,
  estado: EstadoSolicitudReserva
) {
  return supabase
    .from("solicitudes_reserva_sala")
    .update({ estado, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(solicitudSelect)
    .single();
}

export function formatearFechaReserva(fecha: string, horaInicio: string) {
  const date = new Date(`${fecha}T${horaInicio}`);

  if (Number.isNaN(date.getTime())) {
    return `${fecha} ${horaInicio.slice(0, 5)}`;
  }

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
