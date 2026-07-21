import type Stripe from "stripe";
import { getStripeAdmin } from "@/lib/stripeAdmin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getRemitente, getResendAdmin } from "@/lib/resendAdmin";
import { emailBienvenidaSuscripcion } from "@/lib/emails/bienvenidaSuscripcion";

export const runtime = "nodejs";

async function resolverUsuarioId(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.usuario_id) return sub.metadata.usuario_id;

  const { data } = await getSupabaseAdmin()
    .from("suscripciones")
    .select("usuario_id")
    .eq("stripe_customer_id", String(sub.customer))
    .maybeSingle();

  return data?.usuario_id ?? null;
}

async function enviarEmailBienvenida(usuarioId: string, emailReserva: string | null) {
  const { data: usuario } = await getSupabaseAdmin()
    .from("usuarios")
    .select("nombre, email")
    .eq("id", usuarioId)
    .maybeSingle();

  const destinatario = usuario?.email || emailReserva;
  if (!destinatario) return;

  const { subject, html } = emailBienvenidaSuscripcion(usuario?.nombre);

  try {
    await getResendAdmin().emails.send({
      from: getRemitente(),
      to: destinatario,
      subject,
      html,
    });
  } catch (err) {
    // El email es un plus, no debe tumbar el webhook si falla — la
    // suscripción ya quedó guardada en ese punto.
    console.error("No se pudo enviar el email de bienvenida:", err);
  }
}

async function upsertSuscripcion(
  usuarioId: string,
  customerId: string,
  sub: Stripe.Subscription
) {
  await getSupabaseAdmin()
    .from("suscripciones")
    .upsert(
      {
        usuario_id: usuarioId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        estado: sub.status,
        precio_id: sub.items.data[0]?.price.id ?? null,
        periodo_actual_fin: sub.items.data[0]?.current_period_end
          ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
          : null,
        cancelar_al_final_periodo: sub.cancel_at_period_end,
      },
      { onConflict: "usuario_id" }
    );
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return Response.json({ error: "Configuración de webhook incompleta" }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripeAdmin().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Firma inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const usuarioId = session.client_reference_id;

      if (usuarioId && session.subscription) {
        const sub = await getStripeAdmin().subscriptions.retrieve(
          String(session.subscription)
        );
        await upsertSuscripcion(usuarioId, String(session.customer), sub);
        await enviarEmailBienvenida(usuarioId, session.customer_details?.email ?? null);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const usuarioId = await resolverUsuarioId(sub);

      if (usuarioId) {
        await upsertSuscripcion(usuarioId, String(sub.customer), sub);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const usuarioId = await resolverUsuarioId(sub);

      if (usuarioId) {
        await getSupabaseAdmin()
          .from("suscripciones")
          .update({ estado: "canceled", cancelar_al_final_periodo: false })
          .eq("usuario_id", usuarioId);
      }
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
