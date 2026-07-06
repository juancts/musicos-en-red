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

// Logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Obtener el usuario actual
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}