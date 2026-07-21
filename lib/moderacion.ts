import { supabase } from "@/lib/supabase";

export type TipoObjetivoReporte = "usuario" | "publicacion" | "anuncio";

export const MOTIVOS_REPORTE = [
  "Spam o publicidad engañosa",
  "Contenido ofensivo o discriminatorio",
  "Acoso o comportamiento abusivo",
  "Suplantación de identidad",
  "Estafa o fraude",
  "Otro",
] as const;

export async function reportarContenido(params: {
  reportanteId: string;
  tipoObjetivo: TipoObjetivoReporte;
  objetivoId: string;
  motivo: string;
  detalle?: string;
}) {
  const { reportanteId, tipoObjetivo, objetivoId, motivo, detalle } = params;

  return supabase.from("reportes").insert({
    reportante_id: reportanteId,
    tipo_objetivo: tipoObjetivo,
    objetivo_id: objetivoId,
    motivo,
    detalle: detalle?.trim() || null,
  });
}

export async function bloquearUsuario(bloqueadorId: string, bloqueadoId: string) {
  return supabase
    .from("bloqueos")
    .insert({ bloqueador_id: bloqueadorId, bloqueado_id: bloqueadoId });
}

export async function desbloquearUsuario(bloqueadorId: string, bloqueadoId: string) {
  return supabase
    .from("bloqueos")
    .delete()
    .eq("bloqueador_id", bloqueadorId)
    .eq("bloqueado_id", bloqueadoId);
}

export async function estaBloqueado(bloqueadorId: string, bloqueadoId: string) {
  const { data, error } = await supabase
    .from("bloqueos")
    .select("bloqueador_id")
    .eq("bloqueador_id", bloqueadorId)
    .eq("bloqueado_id", bloqueadoId)
    .maybeSingle();

  return { bloqueado: Boolean(data), error };
}

export async function listarIdsBloqueados(userId: string) {
  const { data, error } = await supabase
    .from("bloqueos")
    .select("bloqueado_id")
    .eq("bloqueador_id", userId);

  return { ids: (data ?? []).map((b) => b.bloqueado_id as string), error };
}
