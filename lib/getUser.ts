import { supabase } from "./supabase";

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};
