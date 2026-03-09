import { AgendaWorkspace } from "@/components/calendar/agenda-workspace";
import { PageHeader } from "@/components/shell/page-header";
import { listPatients } from "@/features/patients/queries";
import { requireUser } from "@/lib/auth/session";

export default async function AgendaPage() {
  const user = await requireUser();
  const patients = await listPatients(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agenda"
        title="Agenda por dia e por horario"
        description="Visualize o dia atual, selecione um slot de 1 hora e cadastre atendimentos sem sair do contexto da agenda."
      />

      <AgendaWorkspace
        patientOptions={patients.map((patient) => ({
          id: patient.id,
          fullName: patient.fullName,
        }))}
      />
    </div>
  );
}
