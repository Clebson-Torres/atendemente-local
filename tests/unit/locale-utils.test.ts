import { describe, expect, it } from "vitest";
import {
  addOneHourToTimeInput,
  buildWhatsAppUrl,
  getAppointmentConfirmationLabel,
  getPatientStatusLabel,
  getRecurrenceFrequencyLabel,
  formatDateInputBR,
  formatCentsForInput,
  getAppointmentStatusLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  maskDateInputBR,
  normalizeBRLCurrencyInput,
  parseBRLToCents,
  parseDateInputBR,
} from "@/lib/utils";

describe("locale utils", () => {
  it("converts BRL strings to cents", () => {
    expect(parseBRLToCents("180,00")).toBe(18000);
    expect(parseBRLToCents("R$ 215,90")).toBe(21590);
  });

  it("formats cents for pt-BR inputs", () => {
    expect(formatCentsForInput(18000)).toBe("180,00");
  });

  it("keeps BRL text input stable while typing", () => {
    expect(normalizeBRLCurrencyInput("180,00")).toBe("180,00");
    expect(normalizeBRLCurrencyInput("00180,00")).toBe("180,00");
  });

  it("converts date inputs to dd/mm/aaaa safely", () => {
    expect(maskDateInputBR("12032026")).toBe("12/03/2026");
    expect(parseDateInputBR("12/03/2026")).toBe("2026-03-12");
    expect(formatDateInputBR("2026-03-12")).toBe("12/03/2026");
  });

  it("adds one hour to appointment end time defaults", () => {
    expect(addOneHourToTimeInput("09:30")).toBe("10:30");
  });

  it("returns pt-BR labels for domain enums", () => {
    expect(getAppointmentStatusLabel("scheduled")).toBe("Agendado");
    expect(getAppointmentConfirmationLabel("confirmed")).toBe("Confirmado");
    expect(getPaymentStatusLabel("pending")).toBe("Pendente");
    expect(getPaymentMethodLabel("bank_transfer")).toBe("Transferencia");
    expect(getPatientStatusLabel("inactive")).toBe("Inativo");
    expect(getRecurrenceFrequencyLabel("biweekly")).toBe("Quinzenal");
  });

  it("builds contact shortcuts safely", () => {
    expect(buildWhatsAppUrl("(11) 99999-1111")).toBe("https://wa.me/5511999991111");
  });
});
