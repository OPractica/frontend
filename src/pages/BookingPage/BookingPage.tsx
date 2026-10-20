import { useState } from "react";
import { Button, message } from "antd";
import { BookingPanel, type BookingSelection } from "../../features/booking-panel";

const pad = (h: number) => String(h).padStart(2, "0");

export default function BookingPage() {
  const [place, setPlace] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleBook = (selection: BookingSelection) => {
    const start = selection.hourly ? selection.from : 9;
    const end = selection.hourly ? selection.to : 18;
    messageApi.success(
      `Place ${place} booked for ${selection.date.format("DD MMM")}, ${pad(start)}:00–${pad(end)}:00`
    );
    setPlace(null); // după rezervare, locul se deselectează
  };

  return (
    <div style={{ padding: 16 }}>
      {contextHolder}
      <BookingPanel placeLabel={place} onBook={handleBook} />
      {/* Temporar, până facem harta */}
      <Button style={{ marginTop: 16 }} onClick={() => setPlace("A3")}>
        Test: alege locul A3
      </Button>
    </div>
  );
}