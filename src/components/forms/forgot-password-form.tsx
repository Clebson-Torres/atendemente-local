"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { sendPasswordResetAction } from "@/features/auth/actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/features/auth/schemas";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setServerMessage(null);

    startTransition(async () => {
      const result = await sendPasswordResetAction(values);

      if (!result.success) {
        setServerMessage(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setServerMessage(result.message);
      form.reset();
    });
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input id="forgot-email" placeholder="voce@consultorio.com.br" type="email" {...form.register("email")} />
        <FieldError message={form.formState.errors.email?.message} />
      </div>

      <FieldError message={serverMessage ?? undefined} />

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Enviando..." : "Enviar link de redefinicao"}
      </Button>
    </form>
  );
}
