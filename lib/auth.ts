import { supabase } from "./supabase";

// Registro
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
};

// Login
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

// Login con Google
export const signInWithGoogle = async (redirectTo: string) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  return { data, error };
};

// Logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Enviar email de recuperación de contraseña
export const resetPasswordForEmail = async (email: string, redirectTo: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { data, error };
};

// Actualizar contraseña (usado tras seguir el link de recuperación)
export const updatePassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password });
  return { data, error };
};

// Obtener el usuario actual
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
