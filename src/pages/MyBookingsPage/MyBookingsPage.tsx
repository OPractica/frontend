import { useEffect, useState } from "react";
import { Button, Popconfirm, Table, Tag, Typography, message, type TableColumnsType } from "antd";
import { cancelBooking, fetchMyBookings, inOfficeTime, type ApiBooking } from "../../entities/booking/bookingsApi";
import { locationOf } from "../../entities/office/offices";
import { fetchSeats } from "../../entities/seat/seatsApi";
import { useAuth } from "../../features/auth/auth";
import { useNotifications } from "../../features/notifications/notifications";

// Backendul are locuri doar pentru etajul cu plan desenat
const BOOKABLE_FLOOR_ID = "zity-mall-7";

const timeOf = (b: ApiBooking) =>
  `${inOfficeTime(b.starts_at).format("HH:mm")}–${inOfficeTime(b.ends_at).format("HH:mm")}`;

export default function MyBookingsPage() {
  const { isGuest } = useAuth();
  const { push } = useNotifications();
  const [messageApi, contextHolder] = message.useMessage();

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  // Numele fiecărui loc, după numărul (id) din backend
  const [labels, setLabels] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(!isGuest);
  // Crește după fiecare anulare, ca lista să fie cerută din nou
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;

    Promise.all([fetchMyBookings(), fetchSeats()])
      .then(([mine, seats]) => {
        if (cancelled) return;
        setBookings(mine);
        setLabels(Object.fromEntries(seats.map((s) => [s.id, s.label])));
      })
      .catch(() => {
        if (!cancelled) messageApi.error("Couldn't load your bookings. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isGuest, reload, messageApi]);

  const placeOf = (b: ApiBooking) => labels[b.seat_id] ?? `#${b.seat_id}`;

  const handleCancel = async (b: ApiBooking) => {
    try {
      await cancelBooking(b.id);
    } catch {
      messageApi.error("Couldn't cancel the booking. Try again.");
      return;
    }
    push({
      kind: "cancelled",
      text: `${placeOf(b)} cancelled for ${inOfficeTime(b.starts_at).format("DD MMM")}, ${timeOf(b)}`,
    });
    setReload((n) => n + 1);
  };

  const columns: TableColumnsType<ApiBooking> = [
    { title: "Place", key: "place", render: (_, b) => placeOf(b) },
    { title: "Location", key: "location", render: () => locationOf(BOOKABLE_FLOOR_ID) },
    { title: "Date", key: "date", render: (_, b) => inOfficeTime(b.starts_at).format("ddd, DD MMM YYYY") },
    { title: "Time", key: "time", render: (_, b) => timeOf(b) },
    { title: "", key: "status", render: () => <Tag color="orange">Upcoming</Tag> },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, b) => (
        <Popconfirm
          title="Cancel this booking?"
          okText="Cancel booking"
          cancelText="Keep"
          onConfirm={() => handleCancel(b)}
        >
          <Button size="small" danger>
            Cancel
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 16 }}>
      {contextHolder}
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        My bookings
      </Typography.Title>
      <Table<ApiBooking>
        rowKey="id"
        columns={columns}
        dataSource={isGuest ? [] : bookings}
        loading={loading}
        pagination={false}
        scroll={{ x: true }}
        locale={{ emptyText: isGuest ? "Sign in to see your bookings." : "No bookings yet. Pick a place on the map." }}
      />
    </div>
  );
}