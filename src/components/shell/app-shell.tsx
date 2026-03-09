"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CreditCard, House, LogOut, UsersRound } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const navigation = [
  { href: "/dashboard", label: "Visao geral", icon: House },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/patients", label: "Pacientes", icon: UsersRound },
  { href: "/financeiro", label: "Financeiro", icon: CreditCard },
];

type AppShellProps = {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
};

type AccountPanelProps = {
  userName: string;
  userEmail: string;
};

function AccountPanel({ userName, userEmail }: AccountPanelProps) {
  return (
    <Card className="border border-border/80 bg-white/90 p-3 shadow-none backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>

        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="border-slate-200 bg-white hover:bg-slate-50">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </div>
    </Card>
  );
}

export function AppShell({ userName, userEmail, children }: AppShellProps) {
  const currentPath = usePathname();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-3 sm:p-4 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:p-6">
        <div className="app-surface flex flex-col gap-4 border border-white/80 bg-slate-950 px-4 py-4 text-white lg:hidden">
          <div className="space-y-2">
            <p className="font-display text-3xl leading-none text-white">AtendeMente</p>
            <p className="text-sm text-slate-300">Mais organizacao na rotina, mais foco no atendimento.</p>
          </div>

          <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-white text-slate-950" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <aside className="app-surface hidden flex-col border border-white/80 bg-slate-950 px-5 py-6 text-white lg:flex">
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="font-display text-4xl leading-none text-white">AtendeMente</p>
              <p className="text-sm text-slate-300">Mais organizacao na rotina, mais foco no atendimento.</p>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 space-y-2">
          <div className="flex justify-end">
            <div className="w-full max-w-sm">
              <AccountPanel userEmail={userEmail} userName={userName} />
            </div>
          </div>

          <main className="min-w-0 space-y-6 py-0 lg:py-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
