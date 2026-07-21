import Stripe from "stripe";
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

  const paramsBase: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: {
      metadata: { usuario_id: user.id },
    },
    success_url: `${origin}/perfil?suscripcion=exito`,
    cancel_url: `${origin}/perfil?suscripcion=cancelada`,
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripeAdmin().checkout.sessions.create(
      suscripcion?.stripe_customer_id
        ? { ...paramsBase, customer: suscripcion.stripe_customer_id }
        : { ...paramsBase, customer_email: user.email ?? undefined }
    );
  } catch (err) {
    // El stripe_customer_id guardado puede pertenecer a otro modo (test vs
    // live) — Supabase se comparte entre entornos, pero los customers de
    // Stripe no. Si Stripe lo rechaza por eso, reintentamos sin reutilizar
    // ese customer (deja que Stripe cree uno nuevo a partir del email).
    const esCustomerInvalido =
      err instanceof Stripe.errors.StripeInvalidRequestError &&
      err.param === "customer" &&
      err.code === "resource_missing";

    if (!esCustomerInvalido) throw err;

    session = await getStripeAdmin().checkout.sessions.create({
      ...paramsBase,
      customer_email: user.email ?? undefined,
    });
  }

  if (!session.url) {
    return Response.json(
      { error: "No pudimos crear la sesión de pago." },
      { status: 500 }
    );
  }

  return Response.json({ url: session.url });
}
