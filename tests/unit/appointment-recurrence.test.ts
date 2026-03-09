import { describe, expect, it } from "vitest";
import { buildRecurringAppointments, getSeriesSummary } from "@/features/appointments/recurrence";

describe("appointment recurrence", () => {
  it("creates weekly appointments until the desired amount", () => {
    const rows = buildRecurringAppointments({
      startsAt: new Date("2026-03-10T09:00:00"),
      endsAt: new Date("2026-03-10T10:00:00"),
      frequency: "weekly",
      occurrences: 4,
    });

    expect(rows).toHaveLength(4);
    expect(rows[1]?.startsAt.getDate()).toBe(17);
    expect(rows[1]?.startsAt.getHours()).toBe(9);
  });

  it("creates biweekly appointments until the end date", () => {
    const rows = buildRecurringAppointments({
      startsAt: new Date("2026-03-10T09:00:00"),
      endsAt: new Date("2026-03-10T10:00:00"),
      frequency: "biweekly",
      untilDate: "2026-04-21",
    });

    expect(rows).toHaveLength(4);
    expect(rows[3]?.startsAt.getDate()).toBe(21);
    expect(rows[3]?.startsAt.getHours()).toBe(9);
  });

  it("summarizes the recurring series for UI cards", () => {
    expect(
      getSeriesSummary({
        frequency: "weekly",
        startsOn: "2026-03-10",
        startTime: "09:00",
        endTime: "10:00",
        occurrencesCount: 8,
      }),
    ).toContain("8 sessoes");
  });
});
