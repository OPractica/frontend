import type { Dayjs } from "dayjs";

/** Fereastra de check-in, la fel ca în backend: de la 5 minute înainte de început până la 10 minute după. */
export const CHECKIN_OPENS_BEFORE_MIN = 5;
export const CHECKIN_CLOSES_AFTER_MIN = 10;

/**
 * early   – încă nu se poate (butonul e gri, „Disponibil de la …”)
 * open    – se poate face check-in acum
 * checked – prezența e confirmată
 * expired – fereastra a trecut fără check-in; backend-ul anulează rezervarea în cel mult un minut
 */
export type CheckInState = "early" | "open" | "checked" | "expired";

export const checkInOpensAt = (start: Dayjs) => start.subtract(CHECKIN_OPENS_BEFORE_MIN, "minute");

export function checkInState(start: Dayjs, now: Dayjs, checkedIn: boolean): CheckInState {
  if (checkedIn) return "checked";
  if (now.isBefore(checkInOpensAt(start))) return "early";
  if (now.isAfter(start.add(CHECKIN_CLOSES_AFTER_MIN, "minute"))) return "expired";
  return "open";
}