import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
    !supabaseAnonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ].filter(Boolean);
  throw new Error(
    `Faltan variables de Supabase en .env.local: ${missing.join(", ")}. ` +
      "Copia la clave «anon public» desde Supabase → Project Settings → API. " +
      "No uses SUPABASE_SERVICE_ROLE_KEY en el cliente. Reinicia el servidor (npm run dev)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
