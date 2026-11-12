import { request } from "../../shared/api/client";

export type ApiSeat = {
  id: number;
  label: string;
  floor: number;
  zone: string;
  is_active: boolean;
  attributes: Record<string, unknown>;
};

export type SeatAvailability = { id: number; label: string; status: "free" | "booked" };

export function fetchSeats() {
  return request<ApiSeat[]>("/seats");
}

export function fetchAvailability(startsAt: string, endsAt: string) {
  const query = new URLSearchParams({ starts_at: startsAt, ends_at: endsAt });
  return request<SeatAvailability[]>(`/seats/availability?${query}`);
}