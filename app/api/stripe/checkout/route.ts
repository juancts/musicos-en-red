import { getStripeAdmin } from "@/lib/stripeAdmin";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return Response.json(
      { error: "Falta configurar STRIPE_PRICE_ID en el servidor." },
      { status: 500 }
    );
  }

  const { data: suscripcion } = await supabaseAdmin
    .from("suscripciones")
    .select("stripe_customer_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const origin = new URL(req.url).origin;

  const session = await getStripeAdmin().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: {
      metadata: { usuario_id: user.id },
    },
    ...(suscripcion?.stripe_customer_id
      ? { customer: suscripcion.stripe_customer_id }
      : { customer_email: user.email ?? undefined }),
    success_url: `${origin}/perfil?suscripcion=exito`,
    cancel_url: `${origin}/perfil?suscripcion=cancelada`,
  });

  if (!session.url) {
    return Response.json(
      { error: "No pudimos crear la sesión de pago." },
      { status: 500 }
    );
  }

  return Response.json({ url: session.url });
}
