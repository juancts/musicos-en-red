import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

// Inicialización perezosa: ver la nota en lib/stripeAdmin.ts — evita romper
// `next build` cuando SUPABASE_SERVICE_ROLE_KEY todavía no está configurada.
export function getSupabaseAdmin(): SupabaseClient {
  if (cliente) return cliente;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [
      !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);
    throw new Error(
      `Faltan variables de Supabase en el entorno del servidor: ${missing.join(", ")}. ` +
        "Copia la clave «service_role» desde Supabase → Project Settings → API. " +
        "Nunca expongas esta clave al cliente (sin prefijo NEXT_PUBLIC_)."
    );
  }

  // Cliente con service role: bypasa RLS. Solo se usa desde app/api/** (rutas
  // de servidor), nunca desde componentes cliente — "server-only" hace fallar
  // el build si eso ocurriera por error.
  cliente = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cliente;
}
