"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { inviteAcceptanceSchema, type InviteAcceptanceInput } from "@/features/auth/schemas";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ResetPasswordFormProps = {
  mode: "invite" | "recovery";
};

export function ResetPasswordForm({ mode }: ResetPasswordFormProps) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [isPending, startTransition] = useTransition();
  const form = useForm<InviteAcceptanceInput>({
    resolver: zodResolver(inviteAcceptanceSchema),
    defaultValues: {
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(Boolean(data.session));

      if (data.session?.user?.user_metadata?.full_name) {
        form.setValue("fullName", data.session.user.user_metadata.full_name, {
          shouldDirty: false,
        });
      }
    };

    const completeAuthFromUrl = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
      const queryParams = url.searchParams;
      const code = queryParams.get("code");
      const tokenHash = queryParams.get("token_hash");
      const type = queryParams.get("type");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      try {
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (tokenHash && type) {
          await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "invite" | "recovery",
          });
        }
      } finally {
        await syncSession();
        setIsCheckingLink(false);
      }
    };

    void completeAuthFromUrl();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void syncSession();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [form]);

  const onSubmit = form.handleSubmit((values) => {
    setServerMessage(null);

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
        data: values.fullName ? { full_name: values.fullName } : undefined,
      });

      if (error) {
        const message =
          mode === "invite"
            ? "Nao foi possivel ativar sua conta agora."
            : "Nao foi possivel redefinir sua senha agora.";
        setServerMessage(message);
        toast.error(message);
        return;
      }

      toast.success(mode === "invite" ? "Conta ativada com sucesso." : "Senha redefinida com sucesso.");
      router.push("/dashboard");
      router.refresh();
    });
  });

  if (isCheckingLink) {
    return <p className="text-sm text-muted-foreground">Validando o link de acesso...</p>;
  }

  if (!hasSession) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">O link pode estar expirado ou ja ter sido utilizado.</p>
        <Button asChild variant="outline">
          <Link href={mode === "invite" ? "/login" : "/forgot-password"}>
            {mode === "invite" ? "Voltar para o login" : "Solicitar novo link"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome completo</Label>
        <Input id="fullName" placeholder="Seu nome profissional" {...form.register("fullName")} />
        <FieldError message={form.formState.errors.fullName?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input id="password" type="password" {...form.register("password")} />
        <FieldError message={form.formState.errors.password?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
        <FieldError message={form.formState.errors.confirmPassword?.message} />
      </div>

      <FieldError message={serverMessage ?? undefined} />

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending
          ? mode === "invite"
            ? "Ativando..."
            : "Salvando..."
          : mode === "invite"
            ? "Ativar conta"
            : "Salvar nova senha"}
      </Button>
    </form>
  );
}
