import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_460px]">
        <div className="app-surface relative overflow-hidden border-none bg-slate-950 px-8 py-10 text-white lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-brand-grid bg-[size:22px_22px] opacity-20" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-teal-200">Plataforma para psicologos</p>
              <div className="space-y-4">
                <h1 className="font-display text-6xl leading-[0.92] text-white lg:text-7xl">AtendeMente</h1>
                <p className="max-w-xl text-xl leading-8 text-slate-200 lg:text-2xl">
                  Mais organizacao na rotina, mais foco no atendimento.
                </p>
              </div>
              <p className="max-w-xl text-base leading-7 text-slate-300">
                Reuna agenda, pacientes e anotacoes importantes em um so lugar para trabalhar com mais clareza no dia a dia.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Tenha a rotina da semana organizada sem depender de planilhas soltas.",
                "Encontre rapidamente a ficha de cada paciente quando precisar.",
                "Registre atendimentos e combinados sem perder contexto.",
                "Mantenha tudo pronto para acompanhar sua rotina com tranquilidade.",
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="border-none bg-white/94">
          <CardHeader className="space-y-5">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Entrar</CardTitle>
              <CardDescription>
                Acesse sua rotina profissional e retome rapidamente o que precisa fazer hoje.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoginForm redirectTo={params.redirectTo} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
