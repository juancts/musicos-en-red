import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRemitente, getResendAdmin } from "@/lib/resendAdmin";
import { emailNuevoMensaje } from "@/lib/emails/nuevoMensaje";

export const runtime = "nodejs";

// El destinatario puede ser un usuario directo (músico, o una sala legacy
// que sigue siendo su propia fila en usuarios) o, para un centro nuevo,
// solo existir en centros — en ese caso el email/preferencia son los del
// owner_id, pero el nombre a mostrar es el del centro.
async function resolverDestinatario(destinatarioId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: usuario } = await supabaseAdmin
    .from("usuarios")
    .select("nombre, email, notificar_mensajes_email")
    .eq("id", destinatarioId)
    .maybeSingle();

  if (usuario) {
    return {
      nombre: usuario.nombre as string | null,
      email: usuario.email as string | null,
      notificarPorEmail: usuario.notificar_mensajes_email !== false,
    };
  }

  const { data: centro } = await supabaseAdmin
    .from("centros")
    .select("nombre, owner_id")
    .eq("id", destinatarioId)
    .maybeSingle();

  if (!centro) return null;

  const { data: propietario } = await supabaseAdmin
    .from("usuarios")
    .select("email, notificar_mensajes_email")
    .eq("id", centro.owner_id)
    .maybeSingle();

  if (!propietario) return null;

  return {
    nombre: centro.nombre as string | null,
    email: propietario.email as string | null,
    notificarPorEmail: propietario.notificar_mensajes_email !== false,
  };
}

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return Response.json({ error: "Token inválido" }, { status: 401 });
  }

  const { mensajeId } = await req.json().catch(() => ({ mensajeId: null }));
  if (!mensajeId) {
    return Response.json({ error: "Falta mensajeId" }, { status: 400 });
  }

  const { data: mensaje } = await supabaseAdmin
    .from("mensajes")
    .select("id, conversacion_id, remitente_id, cuerpo")
    .eq("id", mensajeId)
    .maybeSingle();

  // Solo el propio remitente puede disparar la notificación de su mensaje.
  if (!mensaje || mensaje.remitente_id !== user.id) {
    return Response.json({ enviado: false });
  }

  const { data: conversacion } = await supabaseAdmin
    .from("conversaciones")
    .select("musico_id, sala_id")
    .eq("id", mensaje.conversacion_id)
    .maybeSingle();

  if (!conversacion) {
    return Response.json({ enviado: false });
  }

  const destinatarioId =
    conversacion.musico_id === mensaje.remitente_id
      ? conversacion.sala_id
      : conversacion.musico_id;

  const { data: remitenteUsuario } = await supabaseAdmin
    .from("usuarios")
    .select("nombre")
    .eq("id", mensaje.remitente_id)
    .maybeSingle();

  const destinatario = await resolverDestinatario(destinatarioId);

  if (!destinatario?.email || !destinatario.notificarPorEmail) {
    return Response.json({ enviado: false });
  }

  const { subject, html } = emailNuevoMensaje({
    remitenteNombre: remitenteUsuario?.nombre ?? null,
    destinatarioNombre: destinatario.nombre,
    cuerpo: mensaje.cuerpo,
    conversacionId: mensaje.conversacion_id,
  });

  try {
    await getResendAdmin().emails.send({
      from: getRemitente(),
      to: destinatario.email,
      subject,
      html,
    });
  } catch (err) {
    console.error("No se pudo enviar el email de nuevo mensaje:", err);
    return Response.json({ enviado: false });
  }

  return Response.json({ enviado: true });
}
