import { describe, expect, it } from "vitest";
import { patientFormSchema } from "@/features/patients/schemas";

describe("patient schema", () => {
  it("accepts a valid patient payload", () => {
    const parsed = patientFormSchema.safeParse({
      fullName: "Marina Alves",
      phone: "11999998888",
      email: "marina@email.com",
      birthDate: "1992-08-12",
      adminNotes: "Prefere contato por WhatsApp.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a too-short name", () => {
    const parsed = patientFormSchema.safeParse({
      fullName: "Ma",
    });

    expect(parsed.success).toBe(false);
  });
});
