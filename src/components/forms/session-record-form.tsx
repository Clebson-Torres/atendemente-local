"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveSessionRecordAction } from "@/features/records/actions";
import { sessionRecordFormSchema, type SessionRecordFormInput } from "@/features/records/schemas";
import { FieldError } from "@/components/forms/field-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SessionRecordFormProps = {
  defaultValues: SessionRecordFormInput;
};

export function SessionRecordForm({ defaultValues }: SessionRecordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<SessionRecordFormInput>({
    resolver: zodResolver(sessionRecordFormSchema),
    defaultValues,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveSessionRecordAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="content">Registro do atendimento</Label>
        <Textarea
          id="content"
          className="min-h-[220px]"
          placeholder="Resumo rapido, pontos importantes e combinados. Esse conteudo sera criptografado antes de ser salvo."
          {...form.register("content")}
        />
        <FieldError message={form.formState.errors.content?.message} />
      </div>

      <input type="hidden" {...form.register("appointmentId")} />
      <input type="hidden" {...form.register("patientId")} />

      <Button disabled={isPending} type="submit">
        {isPending ? "Protegendo..." : "Salvar registro criptografado"}
      </Button>
    </form>
  );
}
