import "server-only";
import Stripe from "stripe";

let cliente: Stripe | null = null;

// Inicialización perezosa: si esto leyera STRIPE_SECRET_KEY al importar el
// módulo, `next build` fallaría al "recolectar" las rutas de app/api/** en
// entornos donde la clave aún no está configurada, incluso sin recibir
// ninguna petición real.
export function getStripeAdmin(): Stripe {
  if (cliente) return cliente;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Falta STRIPE_SECRET_KEY en el entorno del servidor. " +
        "Copia la clave secreta desde Stripe → Developers → API keys."
    );
  }

  cliente = new Stripe(secretKey);
  return cliente;
}
