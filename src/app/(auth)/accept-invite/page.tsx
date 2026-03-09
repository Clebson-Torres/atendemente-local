import Link from "next/link";
import { UserPlus } from "lucide-react";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-8">
      <div className="w-full max-w-xl">
        <Card className="border-none bg-white/94">
          <CardHeader className="space-y-5">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserPlus className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Ativar conta</CardTitle>
              <CardDescription>
                Defina sua senha inicial para concluir o convite e entrar no AtendeMente.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ResetPasswordForm mode="invite" />
            <Button asChild className="w-full" type="button" variant="outline">
              <Link href="/login">Voltar para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
