import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 lg:px-8">
      <div className="w-full max-w-xl">
        <Card className="border-none bg-white/94">
          <CardHeader className="space-y-5">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Recuperar acesso</CardTitle>
              <CardDescription>
                Informe seu email para receber o link de redefinicao de senha.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ForgotPasswordForm />
            <Button asChild className="w-full" type="button" variant="outline">
              <Link href="/login">Voltar para o login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
