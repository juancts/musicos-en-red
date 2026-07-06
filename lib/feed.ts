import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type TipoPublicacion = "post" | "show";

export type Publicacion = {
  id: string;
  autor_id: string;
  contenido: string;
  tipo: TipoPublicacion;
  fecha_evento: string | null;
  lugar: string | null;
  created_at: string;
  updated_at: string;
};

export type AutorResumen = {
  id: string;
  nombre: string | null;
  avatar_url: string | null;
  tipo: string | null;
  instrumento: string | null;
  provincia: string | null;
};

export type PublicacionConAutor = Publicacion & {
  autor: AutorResumen | null;
};

export type Comentario = {
  id: string;
  publicacion_id: string;
  autor_id: string;
  parent_id: string | null;
  contenido: string;
  created_at: string;
};

export type ComentarioConAutor = Comentario & {
  autor: AutorResumen | null;
};

export type MetricasPublicacion = {
  likes: number;
  comentarios: number;
  likedByMe: boolean;
};

export const comentarioSelect = `
  id,
  publicacion_id,
  autor_id,
  parent_id,
  contenido,
  created_at,
  autor:usuarios!publicacion_comentarios_autor_id_fkey (
    id,
    nombre,
    avatar_url,
    tipo,
    instrumento,
    provincia
  )
`;

export const publicacionSelect = `
  id,
  autor_id,
  contenido,
  tipo,
  fecha_evento,
  lugar,
  created_at,
  updated_at,
  autor:usuarios!publicaciones_autor_id_fkey (
    id,
    nombre,
    avatar_url,
    tipo,
    instrumento,
    provincia
  )
`;

export function mensajeErrorEsquemaFeed(error: PostgrestError | null) {
  if (!error) return null;

  const msg = error.message.toLowerCase();
  if (
    error.code === "42P01" ||
    msg.includes("publicaciones") ||
    msg.includes("publicacion_likes") ||
    msg.includes("publicacion_comentarios")
  ) {
    return {
      titulo: "Falta una migración del feed",
      detalle:
        "Ejecuta 005_feed_publicaciones.sql y 006_feed_likes_comentarios.sql en Supabase.",
      tecnico: error.message,
    };
  }

  return {
    titulo: "Error al cargar el feed",
    detalle: "Inténtalo de nuevo en unos segundos.",
    tecnico: error.message,
  };
}

export function formatearFechaRelativa(iso: string) {
  const fecha = new Date(iso);
  const ahora = Date.now();
  const diffMs = ahora - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `hace ${diffD} d`;

  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: fecha.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function formatearFechaShow(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function listarPublicaciones(limite = 50) {
  return supabase
    .from("publicaciones")
    .select(publicacionSelect)
    .order("created_at", { ascending: false })
    .limit(limite);
}

export async function crearPublicacion(input: {
  autorId: string;
  contenido: string;
  tipo: TipoPublicacion;
  fechaEvento?: string | null;
  lugar?: string | null;
}) {
  const contenido = input.contenido.trim();
  if (!contenido) {
    return { data: null, error: { message: "Escribe algo antes de publicar." } };
  }

  const payload: Record<string, unknown> = {
    autor_id: input.autorId,
    contenido,
    tipo: input.tipo,
    fecha_evento: input.tipo === "show" ? input.fechaEvento : null,
    lugar: input.tipo === "show" ? input.lugar?.trim() : null,
  };

  return supabase.from("publicaciones").insert(payload).select(publicacionSelect).single();
}

export async function eliminarPublicacion(id: string, autorId: string) {
  return supabase.from("publicaciones").delete().eq("id", id).eq("autor_id", autorId);
}

export async function obtenerMetricasPublicaciones(
  publicacionIds: string[],
  usuarioId?: string | null
): Promise<Record<string, MetricasPublicacion>> {
  const metricas: Record<string, MetricasPublicacion> = {};
  if (!publicacionIds.length) return metricas;

  for (const id of publicacionIds) {
    metricas[id] = { likes: 0, comentarios: 0, likedByMe: false };
  }

  const { data: likes } = await supabase
    .from("publicacion_likes")
    .select("publicacion_id, usuario_id")
    .in("publicacion_id", publicacionIds);

  for (const like of likes ?? []) {
    const m = metricas[like.publicacion_id];
    if (m) {
      m.likes += 1;
      if (usuarioId && like.usuario_id === usuarioId) m.likedByMe = true;
    }
  }

  const { data: comentarios } = await supabase
    .from("publicacion_comentarios")
    .select("publicacion_id")
    .in("publicacion_id", publicacionIds);

  for (const c of comentarios ?? []) {
    const m = metricas[c.publicacion_id];
    if (m) m.comentarios += 1;
  }

  return metricas;
}

export async function toggleLike(publicacionId: string, usuarioId: string, liked: boolean) {
  if (liked) {
    return supabase
      .from("publicacion_likes")
      .delete()
      .eq("publicacion_id", publicacionId)
      .eq("usuario_id", usuarioId);
  }
  return supabase.from("publicacion_likes").insert({
    publicacion_id: publicacionId,
    usuario_id: usuarioId,
  });
}

export async function listarComentarios(publicacionId: string) {
  return supabase
    .from("publicacion_comentarios")
    .select(comentarioSelect)
    .eq("publicacion_id", publicacionId)
    .order("created_at", { ascending: true });
}

export async function crearComentario(input: {
  publicacionId: string;
  autorId: string;
  contenido: string;
  parentId?: string | null;
}) {
  const contenido = input.contenido.trim();
  if (!contenido) {
    return { data: null, error: { message: "El comentario está vacío." } };
  }

  return supabase
    .from("publicacion_comentarios")
    .insert({
      publicacion_id: input.publicacionId,
      autor_id: input.autorId,
      parent_id: input.parentId ?? null,
      contenido,
    })
    .select(comentarioSelect)
    .single();
}

export async function eliminarComentario(id: string, autorId: string) {
  return supabase
    .from("publicacion_comentarios")
    .delete()
    .eq("id", id)
    .eq("autor_id", autorId);
}

/** Ordena comentarios: raíz primero, respuestas justo después de su padre */
export function ordenarComentariosHilo(comentarios: ComentarioConAutor[]) {
  const porId = new Map(comentarios.map((c) => [c.id, c]));
  const hijos = new Map<string, ComentarioConAutor[]>();

  for (const c of comentarios) {
    if (!c.parent_id) continue;
    const lista = hijos.get(c.parent_id) ?? [];
    lista.push(c);
    hijos.set(c.parent_id, lista);
  }

  const ordenados: ComentarioConAutor[] = [];

  const visitar = (c: ComentarioConAutor) => {
    ordenados.push(c);
    for (const h of hijos.get(c.id) ?? []) {
      visitar(h);
    }
  };

  const raices = comentarios
    .filter((c) => !c.parent_id || !porId.has(c.parent_id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  for (const r of raices) visitar(r);

  return ordenados;
}

export function profundidadComentario(
  comentario: ComentarioConAutor,
  porId: Map<string, ComentarioConAutor>
): number {
  let depth = 0;
  let parentId = comentario.parent_id;
  while (parentId && porId.has(parentId)) {
    depth += 1;
    parentId = porId.get(parentId)!.parent_id;
  }
  return depth;
}
