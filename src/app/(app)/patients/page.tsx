import Link from "next/link";
import { Search, UserRoundX, UsersRound } from "lucide-react";
import { PatientImportForm } from "@/components/forms/patient-import-form";
import { PatientForm } from "@/components/forms/patient-form";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deactivatePatientAction, reactivatePatientAction } from "@/features/patients/actions";
import { listPatients } from "@/features/patients/queries";
import { requireUser } from "@/lib/auth/session";
import { formatPhone, getPatientStatusLabel } from "@/lib/utils";

type PatientsPageProps = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

function SearchSummary({
  totalCount,
  activeCount,
  inactiveCount,
  query,
}: {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  query: string;
}) {
  if (!query) {
    return (
      <p className="text-sm text-muted-foreground">
        {totalCount} pacientes no total: {activeCount} ativos e {inactiveCount} inativos.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      {totalCount} resultados para &quot;{query}&quot;: {activeCount} ativos e {inactiveCount} inativos.
    </p>
  );
}

function EmptySearchState({ query, type }: { query: string; type: "active" | "inactive" }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
      {type === "active" ? (
        <UsersRound className="h-8 w-8 text-muted-foreground" />
      ) : (
        <UserRoundX className="h-8 w-8 text-muted-foreground" />
      )}
      <p className="mt-3 font-semibold text-slate-900">
        {query ? "Nenhum paciente encontrado nesta secao" : "Nenhum paciente nesta secao"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {query
          ? "Tente buscar por outro nome, telefone ou email."
          : type === "active"
            ? "Os pacientes ativos aparecerao aqui assim que forem cadastrados."
            : "Pacientes pausados aparecerao aqui quando forem desativados."}
      </p>
    </div>
  );
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const query =
    typeof resolvedSearchParams?.q === "string"
      ? resolvedSearchParams.q
      : Array.isArray(resolvedSearchParams?.q)
        ? resolvedSearchParams?.q[0] ?? ""
        : "";

  const patients = await listPatients(user.id, query);
  const activePatients = patients.filter((patient) => patient.status === "active");
  const inactivePatients = patients.filter((patient) => patient.status === "inactive");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pacientes"
        title="Cadastro e acompanhamento centralizados"
        description="Mantenha dados administrativos, historico de atendimentos e acesso rapido a ficha de cada paciente."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="space-y-2">
              <CardTitle>Base de pacientes</CardTitle>
              <CardDescription>
                Busque por nome, telefone ou email sem misturar pacientes ativos e inativos.
              </CardDescription>
            </div>

            <form className="flex flex-col gap-3 sm:flex-row" method="get">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-11"
                  defaultValue={query}
                  name="q"
                  placeholder="Buscar por nome, telefone ou email"
                />
              </div>
              <Button type="submit">Buscar</Button>
              {query ? (
                <Button asChild type="button" variant="outline">
                  <Link href="/patients">Limpar</Link>
                </Button>
              ) : null}
            </form>

            <SearchSummary
              activeCount={activePatients.length}
              inactiveCount={inactivePatients.length}
              query={query}
              totalCount={patients.length}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Pacientes ativos
                </h3>
                <Badge variant="success">{activePatients.length}</Badge>
              </div>

              {activePatients.length ? (
                <div className="max-h-[520px] overflow-auto rounded-3xl border border-border/70">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activePatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{patient.fullName}</p>
                              <Badge variant="secondary">{patient.email || "Sem email"}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>{formatPhone(patient.phone)}</TableCell>
                          <TableCell>
                            <Badge variant="success">{getPatientStatusLabel(patient.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-3">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/patients/${patient.id}`}>Abrir ficha</Link>
                              </Button>
                              <form
                                action={async () => {
                                  "use server";
                                  await deactivatePatientAction(patient.id);
                                }}
                              >
                                <Button size="sm" type="submit" variant="outline">
                                  Desativar
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptySearchState query={query} type="active" />
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Pacientes inativos
                </h3>
                <Badge variant="secondary">{inactivePatients.length}</Badge>
              </div>

              {inactivePatients.length ? (
                <div className="max-h-[420px] overflow-auto rounded-3xl border border-border/70">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactivePatients.map((patient) => (
                        <TableRow key={patient.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{patient.fullName}</p>
                              <Badge variant="secondary">{patient.email || "Sem email"}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>{formatPhone(patient.phone)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getPatientStatusLabel(patient.status)}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-3">
                              <Button asChild size="sm" variant="outline">
                                <Link href={`/patients/${patient.id}`}>Abrir ficha</Link>
                              </Button>
                              <form
                                action={async () => {
                                  "use server";
                                  await reactivatePatientAction(patient.id);
                                }}
                              >
                                <Button size="sm" type="submit" variant="outline">
                                  Reativar
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptySearchState query={query} type="inactive" />
              )}
            </section>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importar pacientes</CardTitle>
              <CardDescription>Use um CSV exportado do Excel para acelerar a migracao da base atual.</CardDescription>
            </CardHeader>
            <CardContent>
              <PatientImportForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Novo paciente</CardTitle>
              <CardDescription>Cadastro administrativo inicial para organizar agenda e registros.</CardDescription>
            </CardHeader>
            <CardContent>
              <PatientForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
