import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, it, expect } from "vitest";
import { patientSchema, type PatientInput } from "../src/lib/schemas";
import Input from "../src/components/ui/Input";
import FieldError from "../src/components/ui/FieldError";

function FormShell({ onSubmit }: { onSubmit: (data: PatientInput) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: { full_name: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Input label="Nome completo *" {...register("full_name")} />
        <FieldError message={errors.full_name?.message} />
      </div>
      <div>
        <Input label="Telefone" {...register("phone")} />
        <FieldError message={errors.phone?.message} />
      </div>
      <div>
        <Input label="Email" type="email" {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div>
        <Input label="Nº Prontuário" {...register("chart_number")} />
        <FieldError message={errors.chart_number?.message} />
      </div>
      <button type="submit">Salvar</button>
    </form>
  );
}

describe("PatientForm integration", () => {
  it("submits with only full_name filled (empty optional fields)", async () => {
    const user = userEvent.setup();
    let submitted: PatientInput | null = null;

    render(<FormShell onSubmit={(d) => { submitted = d; }} />);

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "clebson torres");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await new Promise((r) => setTimeout(r, 100));

    expect(submitted).not.toBeNull();
    expect(submitted!.full_name).toBe("clebson torres");
  });

  it("shows validation error when full_name is missing", async () => {
    const user = userEvent.setup();
    render(<FormShell onSubmit={() => {}} />);

    await user.click(screen.getByRole("button", { name: /salvar/i }));
    await new Promise((r) => setTimeout(r, 100));

    expect(screen.getByText(/Nome deve ter/)).toBeInTheDocument();
  });

  it("submits with all fields empty except full_name", async () => {
    const user = userEvent.setup();
    let submitted: PatientInput | null = null;

    render(<FormShell onSubmit={(d) => { submitted = d; }} />);

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Maria Silva");
    await user.click(screen.getByRole("button", { name: /salvar/i }));
    await new Promise((r) => setTimeout(r, 100));

    expect(submitted).not.toBeNull();
    expect(submitted!.full_name).toBe("Maria Silva");
    expect(submitted!.phone).toBe("");
  });
});
