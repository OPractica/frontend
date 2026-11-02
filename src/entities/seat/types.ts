// A seat on the office map
export type Seat = {
  id: number;
  label: string;
  zone: string;
};

// State of a seat for the selected day
export type SeatStatus = "free" | "booked" | "mine";