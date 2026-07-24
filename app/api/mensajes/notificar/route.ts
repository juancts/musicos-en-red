import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRemitente, getResendAdmin } from "@/lib/resendAdmin";
import { emailNuevoMensaje } from "@/lib/emails/nuevoMensaje";

export const runtime = "nodejs";

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

  const { data: participantes } = await supabaseAdmin
    .from("usuarios")
    .select("id, nombre, email, notificar_mensajes_email")
    .in("id", [mensaje.remitente_id, destinatarioId]);

  const remitenteUsuario = participantes?.find((u) => u.id === mensaje.remitente_id);
  const destinatarioUsuario = participantes?.find((u) => u.id === destinatarioId);

  if (
    !destinatarioUsuario?.email ||
    destinatarioUsuario.notificar_mensajes_email === false
  ) {
    return Response.json({ enviado: false });
  }

  const { subject, html } = emailNuevoMensaje({
    remitenteNombre: remitenteUsuario?.nombre ?? null,
    destinatarioNombre: destinatarioUsuario.nombre,
    cuerpo: mensaje.cuerpo,
    conversacionId: mensaje.conversacion_id,
  });

  try {
    await getResendAdmin().emails.send({
      from: getRemitente(),
      to: destinatarioUsuario.email,
      subject,
      html,
    });
  } catch (err) {
    console.error("No se pudo enviar el email de nuevo mensaje:", err);
    return Response.json({ enviado: false });
  }

  return Response.json({ enviado: true });
}
