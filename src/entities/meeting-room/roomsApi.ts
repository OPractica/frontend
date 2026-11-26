import { request } from "../../shared/api/client";

// Sălile din backend aparțin oficiului 1: Zity Mall, etajul 7, singurul etaj cu plan desenat
export const ROOMS_OFFICE_ID = 1;

/** O sală cu starea ei în intervalul cerut. Aici câmpurile vin în stilul roomId, iar capacitatea e text. */
export type RoomStatus = {
  roomId: number;
  roomAlias: string; // același nume ca pe hartă: „Chili”, „Cabină 1”
  roomCapacity: string;
  roomEquipments: string;
  isBusy: boolean;
};

/** Echipamentul sălii ca listă: „TV,  Whiteboard” → ["TV", "Whiteboard"]. */
export const roomEquipment = (room: RoomStatus): string[] =>
  room.roomEquipments
    .split(",")
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter(Boolean);

/** Sala încape toți oamenii și are tot echipamentul cerut; literele mari nu contează. */
export function roomFits(room: RoomStatus, people: number | null, equipment: readonly string[]): boolean {
  const has = new Set(roomEquipment(room).map((item) => item.toLowerCase()));
  const enoughSeats = people === null || parseInt(room.roomCapacity, 10) >= people;
  return enoughSeats && equipment.every((item) => has.has(item.toLowerCase()));
}

export type ApiRoomBooking = {
  id: number;
  room_id: number;
  user_id: number;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  created_at: string;
};

/** GET /meeting/getMeetingRoomsWithStatusByOfficeId: toate sălile, cu ocupat / liber. Ora fără fus = ora biroului. */
export function fetchRooms(fromDate: string, toDate: string) {
  const query = new URLSearchParams({ officeId: String(ROOMS_OFFICE_ID), fromDate, toDate });
  return request<RoomStatus[]>(`/meeting/getMeetingRoomsWithStatusByOfficeId?${query}`);
}

export function createRoomBooking(roomId: number, startsAt: string, endsAt: string) {
  return request<ApiRoomBooking>("/meeting/bookings", {
    method: "POST",
    body: JSON.stringify({ room_id: roomId, starts_at: startsAt, ends_at: endsAt }),
  });
}

export function fetchMyRoomBookings() {
  return request<ApiRoomBooking[]>("/meeting/bookings/me");
}

export function cancelRoomBooking(id: number) {
  return request<ApiRoomBooking>(`/meeting/bookings/${id}/cancel`, { method: "PATCH" });
}