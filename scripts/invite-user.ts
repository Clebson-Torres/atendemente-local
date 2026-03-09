import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const email = process.argv[2];
  const fullName = process.argv[3] ?? "";

  if (!url || !serviceRoleKey) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de enviar convites.");
  }

  if (!email) {
    throw new Error("Uso: npm run invite:user -- email@dominio.com \"Nome Opcional\"");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/accept-invite`,
    data: {
      full_name: fullName,
    },
  });

  if (error) {
    throw error;
  }

  console.log(`Convite enviado para ${email}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
