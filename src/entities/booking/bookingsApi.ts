import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { request } from "../../shared/api/client";

dayjs.extend(utc);
dayjs.extend(timezone);

const OFFICE_TZ = "Europe/Chisinau";

export type ApiBooking = {
  id: number;
  user_id: number;
  seat_id: number;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  source: string;
  is_checked_in: boolean;
  created_at: string;
};

// "2026-11-12", 9 -> "2026-11-12T09:00:00+02:00"
export function officeTime(date: string, hour: number): string {
  return dayjs.tz(`${date} ${String(hour).padStart(2, "0")}:00`, OFFICE_TZ).format();
}

export function createBooking(seatId: number, startsAt: string, endsAt: string) {
  return request<ApiBooking>("/bookings", {
    method: "POST",
    body: JSON.stringify({ seat_id: seatId, starts_at: startsAt, ends_at: endsAt, source: "manual" }),
  });
}

export function fetchMyBookings() {
  return request<ApiBooking[]>("/bookings/me");
}

export function cancelBooking(id: number) {
  return request<ApiBooking>(`/bookings/${id}/cancel`, { method: "PATCH" });
}

// Ora primită de la backend, arătată în ora biroului
export function inOfficeTime(iso: string) {
  return dayjs(iso).tz(OFFICE_TZ);
}