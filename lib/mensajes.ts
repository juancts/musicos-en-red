import { supabase } from "@/lib/supabase";

export type ConversacionRow = {
  id: string;
  musico_id: string;
  sala_id: string;
  created_at: string;
  updated_at: string;
};

export type MensajeRow = {
  id: string;
  conversacion_id: string;
  remitente_id: string;
  cuerpo: string;
  leido: boolean;
  created_at: string;
};

export type UsuarioResumen = {
  id: string;
  nombre: string | null;
  // Presente cuando "sala" en realidad es un centro (nuevo modelo
  // owner_id): identifica a la persona dueña, para bloqueos/permisos.
  owner_id?: string;
};

export type ConversacionConParticipantes = ConversacionRow & {
  musico: UsuarioResumen | null;
  sala: UsuarioResumen | null;
};

// sala_id es polimórfico (usuario en chats músico↔músico, o un centro) y
// ya no tiene FK propio, así que no se puede resolver con un embed de
// PostgREST — se arma a mano tras la consulta con resolverParticipantesSala.
const conversacionSelect = `
  id,
  musico_id,
  sala_id,
  created_at,
  updated_at,
  musico:usuarios!conversaciones_musico_id_fkey ( id, nombre )
`;

async function resolverParticipantesSala(salaIds: string[]) {
  const idsUnicos = Array.from(new Set(salaIds));
  const mapa = new Map<string, UsuarioResumen>();
  if (idsUnicos.length === 0) return mapa;

  const [usuariosRes, centrosRes] = await Promise.all([
    supabase.from("usuarios").select("id, nombre").in("id", idsUnicos),
    supabase.from("centros").select("id, nombre, owner_id").in("id", idsUnicos),
  ]);

  for (const u of usuariosRes.data ?? []) {
    mapa.set(u.id, { id: u.id, nombre: u.nombre });
  }
  // Los centros ganan si el mismo id existe en ambas tablas (salas legacy
  // migradas comparten id con su usuario original).
  for (const c of centrosRes.data ?? []) {
    mapa.set(c.id, { id: c.id, nombre: c.nombre, owner_id: c.owner_id });
  }

  return mapa;
}

function filtroConversaciones(userId: string, centroIds: string[]) {
  return [
    `musico_id.eq.${userId}`,
    `sala_id.eq.${userId}`,
    ...(centroIds.length ? [`sala_id.in.(${centroIds.join(",")})`] : []),
  ].join(",");
}

async function centrosDelUsuario(userId: string) {
  const { data } = await supabase.from("centros").select("id").eq("owner_id", userId);
  return (data ?? []).map((c) => c.id as string);
}

/** Iniciador en musico_id; el otro usuario en sala_id; sirve tambien entre musicos. */
export async function obtenerOCrearConversacion(musicoId: string, salaId: string) {
  const { data: existente, error: selectError } = await supabase
    .from("conversaciones")
    .select("id")
    .or(
      `and(musico_id.eq.${musicoId},sala_id.eq.${salaId}),and(musico_id.eq.${salaId},sala_id.eq.${musicoId})`
    )
    .limit(1)
    .maybeSingle();

  if (selectError) {
    return { data: null, error: selectError };
  }

  if (existente) {
    return { data: existente.id as string, error: null };
  }

  const { data: creada, error: insertError } = await supabase
    .from("conversaciones")
    .insert({ musico_id: musicoId, sala_id: salaId })
    .select("id")
    .single();

  if (insertError) {
    return { data: null, error: insertError };
  }

  return { data: creada.id as string, error: null };
}

export async function listarConversaciones(userId: string) {
  const centroIds = await centrosDelUsuario(userId);

  const { data, error } = await supabase
    .from("conversaciones")
    .select(conversacionSelect)
    .or(filtroConversaciones(userId, centroIds))
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return { data, error };
  }

  const participantes = await resolverParticipantesSala(
    data.map((c) => c.sala_id as string)
  );

  const conSala = data.map((c) => ({
    ...c,
    sala: participantes.get(c.sala_id as string) ?? null,
  }));

  return { data: conSala, error: null };
}

export async function contarMensajesNoLeidos(userId: string) {
  const centroIds = await centrosDelUsuario(userId);

  const { data: conversaciones, error: convError } = await supabase
    .from("conversaciones")
    .select("id")
    .or(filtroConversaciones(userId, centroIds));

  if (convError || !conversaciones?.length) {
    return { count: 0, error: convError };
  }

  const ids = conversaciones.map((c) => c.id);

  const { count, error } = await supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .in("conversacion_id", ids)
    .eq("leido", false)
    .neq("remitente_id", userId);

  return { count: count ?? 0, error };
}

export async function listarMensajes(conversacionId: string) {
  return supabase
    .from("mensajes")
    .select("id, conversacion_id, remitente_id, cuerpo, leido, created_at")
    .eq("conversacion_id", conversacionId)
    .order("created_at", { ascending: true });
}

async function notificarNuevoMensaje(mensajeId: string) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/mensajes/notificar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ mensajeId }),
    });
  } catch {
    // El aviso por email es un plus — si falla, el mensaje ya se envió igual.
  }
}

export async function enviarMensaje(
  conversacionId: string,
  remitenteId: string,
  cuerpo: string
) {
  const texto = cuerpo.trim();
  if (!texto) {
    return { data: null, error: { message: "El mensaje está vacío." } };
  }

  const resultado = await supabase
    .from("mensajes")
    .insert({
      conversacion_id: conversacionId,
      remitente_id: remitenteId,
      cuerpo: texto,
    })
    .select("id, conversacion_id, remitente_id, cuerpo, leido, created_at")
    .single();

  if (resultado.data) {
    notificarNuevoMensaje(resultado.data.id);
  }

  return resultado;
}

export async function marcarMensajesLeidos(
  conversacionId: string,
  userId: string
) {
  return supabase
    .from("mensajes")
    .update({ leido: true })
    .eq("conversacion_id", conversacionId)
    .eq("leido", false)
    .neq("remitente_id", userId);
}

export function nombreContraparte(
  conversacion: ConversacionConParticipantes,
  userId: string
) {
  if (userId === conversacion.musico_id) {
    return conversacion.sala?.nombre ?? "Contacto";
  }
  return conversacion.musico?.nombre ?? "Contacto";
}
