import { format } from "date-fns";
import type { RecurrenceFrequency } from "@/types/domain";

type BuildRecurringDatesInput = {
  startsAt: Date;
  endsAt: Date;
  frequency: RecurrenceFrequency;
  untilDate?: string | null;
  occurrences?: number | null;
};

export function buildRecurringAppointments({
  startsAt,
  endsAt,
  frequency,
  untilDate,
  occurrences,
}: BuildRecurringDatesInput) {
  const intervalDays = frequency === "biweekly" ? 14 : 7;
  const results: Array<{ startsAt: Date; endsAt: Date }> = [];
  const hardLimit = Math.min(Math.max(occurrences ?? 52, 2), 52);
  const untilBoundary = untilDate ? new Date(`${untilDate}T23:59:59`) : null;

  let index = 0;
  while (results.length < hardLimit) {
    const nextStart = new Date(startsAt);
    nextStart.setDate(startsAt.getDate() + intervalDays * index);

    const nextEnd = new Date(endsAt);
    nextEnd.setDate(endsAt.getDate() + intervalDays * index);

    if (untilBoundary && nextStart > untilBoundary) {
      break;
    }

    results.push({ startsAt: nextStart, endsAt: nextEnd });
    index += 1;

    if (!untilBoundary && occurrences && results.length >= occurrences) {
      break;
    }
  }

  return results;
}

export function getSeriesLabel(frequency: RecurrenceFrequency) {
  return frequency === "biweekly" ? "Quinzenal" : "Semanal";
}

export function getSeriesSummary(params: {
  frequency: RecurrenceFrequency;
  startTime: string;
  endTime: string;
  startsOn: string;
  endsOn?: string | null;
  occurrencesCount?: number | null;
}) {
  const base = `${getSeriesLabel(params.frequency)} · ${format(new Date(`${params.startsOn}T00:00:00`), "dd/MM/yyyy")} · ${params.startTime} as ${params.endTime}`;

  if (params.endsOn) {
    return `${base} · ate ${format(new Date(`${params.endsOn}T00:00:00`), "dd/MM/yyyy")}`;
  }

  if (params.occurrencesCount) {
    return `${base} · ${params.occurrencesCount} sessoes`;
  }

  return base;
}
