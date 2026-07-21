import "server-only";
import { Resend } from "resend";

let cliente: Resend | null = null;

// Inicialización perezosa: mismo motivo que lib/stripeAdmin.ts — evita
// romper `next build` si la env var todavía no está configurada.
export function getResendAdmin(): Resend {
  if (cliente) return cliente;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta RESEND_API_KEY en el entorno del servidor. Copia la API key desde Resend → API Keys."
    );
  }

  cliente = new Resend(apiKey);
  return cliente;
}

export function getRemitente(): string {
  const email = process.env.RESEND_FROM || "hola@musicosenred.com";
  return `Músicos en Red <${email}>`;
}
