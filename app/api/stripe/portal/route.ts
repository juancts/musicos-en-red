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

  const { data: suscripcion } = await supabaseAdmin
    .from("suscripciones")
    .select("stripe_customer_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!suscripcion?.stripe_customer_id) {
    return Response.json(
      { error: "Todavía no tienes una suscripción." },
      { status: 400 }
    );
  }

  const origin = new URL(req.url).origin;

  const session = await getStripeAdmin().billingPortal.sessions.create({
    customer: suscripcion.stripe_customer_id,
    return_url: `${origin}/perfil`,
  });

  return Response.json({ url: session.url });
}
