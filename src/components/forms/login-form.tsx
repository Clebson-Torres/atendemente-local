"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { signInAction } from "@/features/auth/actions";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/forms/field-error";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerMessage(null);

    startTransition(async () => {
      const result = await signInAction(values, redirectTo || "/dashboard");

      if (!result.success) {
        setServerMessage(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push(result.data?.redirectTo ?? "/dashboard");
      router.refresh();
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="voce@consultorio.com.br" {...form.register("email")} />
        <FieldError message={form.formState.errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" placeholder="Sua senha segura" {...form.register("password")} />
        <FieldError message={form.formState.errors.password?.message} />
      </div>

      <FieldError message={serverMessage ?? undefined} />

      <div className="flex items-center justify-end gap-3 text-sm">
        <Link className="font-medium text-primary hover:underline" href="/forgot-password">
          Esqueci minha senha
        </Link>
      </div>

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
