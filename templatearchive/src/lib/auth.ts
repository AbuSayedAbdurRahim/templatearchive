import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Every page, action and route handler that touches private data calls this first. */
export async function requireOwner() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser(); // validates the JWT with Supabase, not just the cookie
  const user = data.user;
  if (!user) redirect("/login");
  const { data: admin } = await supabase.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/login?error=not_authorized");
  return { supabase, user };
}
