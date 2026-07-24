import type { SupabaseClient } from "@supabase/supabase-js";

export type EstadoSuscripcion =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export const LIMITE_ANUNCIOS_GRATIS = 3;
export const LIMITE_CENTROS_GRATIS = 1;

const ESTADOS_CON_BENEFICIOS: EstadoSuscripcion[] = ["active", "trialing"];

export function esSuscriptorActivo(estado: string | null | undefined) {
  return ESTADOS_CON_BENEFICIOS.includes(estado as EstadoSuscripcion);
}

export async function obtenerSuscripcion(client: SupabaseClient, usuarioId: string) {
  const { data, error } = await client
    .from("suscripciones")
    .select("usuario_id, estado")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return { estado: (data?.estado as string | undefined) ?? null, error };
}

export const DIAS_GRACIA_SALA = 60;

function msRestantesGracia(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const creado = new Date(createdAt).getTime();
  if (Number.isNaN(creado)) return null;
  return creado + DIAS_GRACIA_SALA * 24 * 60 * 60 * 1000 - Date.now();
}

// true mientras la sala esté dentro de su ventana de 60 días desde el alta.
export function enPeriodoGraciaSala(createdAt: string | null | undefined) {
  const restante = msRestantesGracia(createdAt);
  return restante !== null && restante > 0;
}

// Días completos de gracia restantes (0 si ya expiró o no se puede calcular).
export function diasGraciaRestantes(createdAt: string | null | undefined) {
  const restante = msRestantesGracia(createdAt);
  if (restante === null || restante <= 0) return 0;
  return Math.ceil(restante / (24 * 60 * 60 * 1000));
}

// Visibilidad pública de una sala: suscrita (activa/trialing) O dentro de
// los 60 días de gracia desde el alta. No aplica a músicos.
export function salaVisiblePublicamente(
  estadoSuscripcion: string | null | undefined,
  createdAt: string | null | undefined
) {
  return esSuscriptorActivo(estadoSuscripcion) || enPeriodoGraciaSala(createdAt);
}

export async function obtenerSuscriptoresActivos(
  client: SupabaseClient,
  usuarioIds: string[]
): Promise<Set<string>> {
  const idsUnicos = Array.from(new Set(usuarioIds));
  if (idsUnicos.length === 0) return new Set();

  const { data } = await client
    .from("suscripciones")
    .select("usuario_id, estado")
    .in("usuario_id", idsUnicos)
    .in("estado", ESTADOS_CON_BENEFICIOS);

  return new Set((data ?? []).map((fila) => fila.usuario_id as string));
}
