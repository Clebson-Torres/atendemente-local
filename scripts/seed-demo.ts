import { randomUUID } from "node:crypto";
import { addDays, addHours } from "date-fns";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import { encryptRecordContent } from "@/lib/crypto/records";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!url || !serviceRoleKey || !databaseUrl) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e DATABASE_URL antes do seed.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const sql = postgres(databaseUrl, { prepare: false });
  const demoEmail = "demo@atendemente.local";
  const demoPassword = "AtendeMente123!";

  const { data: users } = await supabase.auth.admin.listUsers();
  let authUser = users.users.find((user) => user.email === demoEmail);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Dra. Helena Costa",
      },
    });

    if (error || !data.user) {
      throw error ?? new Error("Nao foi possivel criar o usuario demo.");
    }

    authUser = data.user;
  }

  await sql`
    insert into public.users (id, email, full_name, two_factor_enabled)
    values (
      ${authUser.id},
      ${authUser.email ?? demoEmail},
      ${String(authUser.user_metadata?.full_name ?? "Dra. Helena Costa")},
      false
    )
    on conflict (id) do update
    set
      email = excluded.email,
      full_name = excluded.full_name,
      updated_at = timezone('utc', now())
  `;

  const patientId = randomUUID();
  const appointmentId = randomUUID();
  const paymentId = randomUUID();
  const recordId = randomUUID();
  const encrypted = encryptRecordContent(
    "Paciente relatou melhora no sono e menor nivel de ansiedade. Combinado revisar rotina matinal na proxima sessao.",
  );

  await sql`
    insert into public.patients (id, user_id, full_name, phone, email, birth_date, admin_notes)
    values (
      ${patientId},
      ${authUser.id},
      ${"Marina Alves"},
      ${"11999998888"},
      ${"marina.alves@email.com"},
      ${"1992-08-12"},
      ${"Paciente prefere contatos administrativos por WhatsApp."}
    )
    on conflict (id) do nothing
  `;

  const appointmentStart = addHours(new Date(), 2);
  const appointmentEnd = addHours(new Date(), 3);
  const pendingStart = addDays(addHours(new Date(), 4), 1);
  const pendingEnd = addDays(addHours(new Date(), 5), 1);

  await sql`
    insert into public.appointments (id, user_id, patient_id, starts_at, ends_at, status, session_price_cents, quick_notes)
    values
      (${appointmentId}, ${authUser.id}, ${patientId}, ${appointmentStart.toISOString()}, ${appointmentEnd.toISOString()}, 'completed', 18000, ${"Sessao presencial confirmada."}),
      (${randomUUID()}, ${authUser.id}, ${patientId}, ${pendingStart.toISOString()}, ${pendingEnd.toISOString()}, 'scheduled', 18000, ${"Sessao online com foco em rotina."})
    on conflict (id) do nothing
  `;

  await sql`
    insert into public.payments (id, user_id, appointment_id, status, method, paid_at, amount_received_cents, notes)
    values (${paymentId}, ${authUser.id}, ${appointmentId}, 'paid', 'pix', ${new Date().toISOString()}, 18000, ${"Recebido no dia da sessao."})
    on conflict (appointment_id) do nothing
  `;

  await sql`
    insert into public.session_records (id, user_id, patient_id, appointment_id, encrypted_payload, iv, auth_tag, key_version)
    values (
      ${recordId},
      ${authUser.id},
      ${patientId},
      ${appointmentId},
      ${encrypted.encryptedPayload},
      ${encrypted.iv},
      ${encrypted.authTag},
      ${encrypted.keyVersion}
    )
    on conflict (appointment_id) do nothing
  `;

  console.log("Seed concluido.");
  console.log(`Login demo: ${demoEmail}`);
  console.log(`Senha demo: ${demoPassword}`);

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
