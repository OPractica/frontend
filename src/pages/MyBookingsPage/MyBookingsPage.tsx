import { useEffect, useState } from "react";
import { Button, Popconfirm, Table, Tag, Typography, message, type TableColumnsType } from "antd";
import { cancelBooking, checkIn, fetchMyBookings, inOfficeTime } from "../../entities/booking/bookingsApi";
import { checkInState } from "../../entities/booking/checkIn";
import { locationOf } from "../../entities/office/offices";
import { fetchSeats } from "../../entities/seat/seatsApi";
import { cancelRoomBooking, fetchMyRoomBookings, fetchRooms } from "../../entities/meeting-room/roomsApi";
import { useAuth } from "../../features/auth/auth";
import { useNotifications } from "../../features/notifications/notifications";
import { CheckInButton } from "../../features/check-in";
import { ApiError } from "../../shared/api/client";
import { useLanguage } from "../../shared/i18n/language";
import { floorName, longDate, placeName } from "../../shared/i18n/format";

// Backendul are locuri doar pentru etajul cu plan desenat
const BOOKABLE_FLOOR_ID = "zity-mall-7";

/** Un rând din tabel: o rezervare de loc sau de sală. Sălile nu au check-in. */
type Row = {
  key: string;
  kind: "seat" | "room";
  id: number;
  place: string; // numele de pe hartă: „A01”, „Chili”
  starts_at: string;
  ends_at: string;
  is_checked_in: boolean;
};

const timeOf = (b: Row) =>
  `${inOfficeTime(b.starts_at).format("HH:mm")}–${inOfficeTime(b.ends_at).format("HH:mm")}`;

export default function MyBookingsPage() {
  const { isGuest } = useAuth();
  const { t } = useLanguage();
  const { push } = useNotifications();
  const [messageApi, contextHolder] = message.useMessage();

  const [bookings, setBookings] = useState<Row[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  // Crește după fiecare anulare, ca lista să fie cerută din nou
  const [reload, setReload] = useState(0);
  // Rezervarea pentru care se trimite acum check-in-ul
  const [checkingId, setCheckingId] = useState<number | null>(null);

  // Ora de acum, actualizată la 30 de secunde, ca butonul de check-in să-și schimbe singur starea
  const [now, setNow] = useState(() => inOfficeTime(new Date().toISOString()));
  useEffect(() => {
    const id = setInterval(() => setNow(inOfficeTime(new Date().toISOString())), 30_000);
    return () => clearInterval(id);
  }, []);

  // O rezervare fără check-in la timp e anulată de backend în cel mult un minut;
  // cât timp există una expirată, lista se cere din nou, ca ea să dispară.
  const hasExpired = bookings.some(
    (b) => b.kind === "seat" && checkInState(inOfficeTime(b.starts_at), now, b.is_checked_in) === "expired"
  );
  useEffect(() => {
    if (!hasExpired) return;
    const id = setInterval(() => setReload((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [hasExpired]);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;

    // Lista sălilor se cere doar pentru nume; intervalul nu contează aici
    const today = inOfficeTime(new Date().toISOString()).format("YYYY-MM-DD");
    Promise.all([
      fetchMyBookings(),
      fetchSeats(),
      fetchMyRoomBookings(),
      fetchRooms(`${today}T00:00:00`, `${today}T00:01:00`),
    ])
      .then(([mine, seats, myRooms, rooms]) => {
        if (cancelled) return;
        const seatLabels = Object.fromEntries(seats.map((s) => [s.id, s.label]));
        const roomLabels = Object.fromEntries(rooms.map((r) => [r.roomId, r.roomAlias]));
        const rows: Row[] = [
          ...mine.map((b) => ({ ...b, key: `seat-${b.id}`, kind: "seat" as const, place: seatLabels[b.seat_id] ?? `#${b.seat_id}` })),
          ...myRooms.map((b) => ({
            ...b,
            key: `room-${b.id}`,
            kind: "room" as const,
            place: roomLabels[b.room_id] ?? `#${b.room_id}`,
            is_checked_in: false,
          })),
        ];
        rows.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        setBookings(rows);
      })
      .catch(() => {
        if (!cancelled) messageApi.error(t.mine.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isGuest, reload, messageApi, t]);

  const placeOf = (b: Row) => placeName(t, b.place);

  const handleCancel = async (b: Row) => {
    try {
      if (b.kind === "seat") await cancelBooking(b.id);
      else await cancelRoomBooking(b.id);
    } catch {
      messageApi.error(t.mine.cancelFailed);
      return;
    }
    const start = inOfficeTime(b.starts_at);
    push({
      kind: "cancelled",
      place: b.place,
      date: start.format("YYYY-MM-DD"),
      from: start.format("HH:mm"),
      to: inOfficeTime(b.ends_at).format("HH:mm"),
    });
    setReload((n) => n + 1);
  };

  const handleCheckIn = async (b: Row) => {
    setCheckingId(b.id);
    try {
      const updated = await checkIn(b.id);
      setBookings((prev) => prev.map((x) => (x.key === b.key ? { ...x, is_checked_in: updated.is_checked_in } : x)));
      messageApi.success(t.checkIn.success(placeOf(b)));
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 422) messageApi.error(t.checkIn.notYet);
      else if (status === 400 || status === 404) {
        // fereastra a trecut, rezervarea a fost anulată sau confirmată deja: lista se ia din nou
        messageApi.error(t.checkIn.notPossible);
        setReload((n) => n + 1);
      } else messageApi.error(t.checkIn.failed);
    } finally {
      setCheckingId(null);
    }
  };

  const columns: TableColumnsType<Row> = [
    { title: t.mine.place, key: "place", render: (_, b) => placeOf(b) },
    { title: t.mine.location, key: "location", render: () => locationOf(BOOKABLE_FLOOR_ID, (f) => floorName(t, f)) },
    { title: t.mine.date, key: "date", render: (_, b) => longDate(inOfficeTime(b.starts_at)) },
    { title: t.mine.time, key: "time", render: (_, b) => timeOf(b) },
    { title: "", key: "status", render: () => <Tag color="orange">{t.mine.upcoming}</Tag> },
    {
      title: "",
      key: "checkin",
      // Check-in există doar pentru locuri; la săli coloana rămâne goală
      render: (_, b) =>
        b.kind === "seat" && (
          <CheckInButton
            start={inOfficeTime(b.starts_at)}
            now={now}
            checkedIn={b.is_checked_in}
            busy={checkingId === b.id}
            onCheckIn={() => handleCheckIn(b)}
          />
        ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, b) => (
        <Popconfirm
          title={t.mine.confirm}
          okText={t.mine.confirmOk}
          cancelText={t.mine.keep}
          onConfirm={() => handleCancel(b)}
        >
          <Button size="small" danger>
            {t.mine.cancel}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #ececec", borderRadius: 8, padding: 16 }}>
      {contextHolder}
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {t.menu.mine}
      </Typography.Title>
      <Table<Row>
        rowKey="key"
        columns={columns}
        dataSource={isGuest ? [] : bookings}
        loading={loading}
        pagination={false}
        scroll={{ x: true }}
        locale={{ emptyText: isGuest ? t.mine.signInToSee : t.mine.empty }}
      />
    </div>
  );
}