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
