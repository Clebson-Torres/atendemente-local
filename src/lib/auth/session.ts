import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentAppUser() {
  const user = await requireUser();
  const db = getDb();

  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  return {
    ...user,
    fullName: profile?.fullName ?? user.user_metadata?.full_name ?? user.email ?? "Profissional",
  };
}
