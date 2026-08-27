import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Borra la fila de public.usuarios primero (todas las FKs relevantes —
// centros, anuncios, partituras, conversaciones, suscripciones, bloqueos,
// reportes — apuntan a usuarios(id) on delete cascade), y recién después
// la identidad en auth.users. Ese orden importa: si se borrara primero el
// usuario de auth, quedaría una fila huérfana en usuarios (mismo problema
// que ya vimos al reusar emails de prueba).
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

  const { error: deleteUsuarioError } = await supabaseAdmin
    .from("usuarios")
    .delete()
    .eq("id", user.id);

  if (deleteUsuarioError) {
    return Response.json(
      { error: "No pudimos eliminar tu perfil. Inténtalo de nuevo." },
      { status: 500 }
    );
  }

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteAuthError) {
    return Response.json(
      { error: "Tu perfil se borró, pero hubo un problema al cerrar tu cuenta. Contáctanos." },
      { status: 500 }
    );
  }

  return Response.json({ eliminado: true });
}
