import { useEffect, useState } from "react";
import { Button, Popconfirm, Table, Tag, Typography, message, type TableColumnsType } from "antd";
import { cancelBooking, checkIn, fetchMyBookings, inOfficeTime, type ApiBooking } from "../../entities/booking/bookingsApi";
import { checkInState } from "../../entities/booking/checkIn";
import { locationOf } from "../../entities/office/offices";
import { fetchSeats } from "../../entities/seat/seatsApi";
import { useAuth } from "../../features/auth/auth";
import { useNotifications } from "../../features/notifications/notifications";
import { CheckInButton } from "../../features/check-in";
import { ApiError } from "../../shared/api/client";
import { useLanguage } from "../../shared/i18n/language";
import { floorName, longDate } from "../../shared/i18n/format";

// Backendul are locuri doar pentru etajul cu plan desenat
const BOOKABLE_FLOOR_ID = "zity-mall-7";

const timeOf = (b: ApiBooking) =>
  `${inOfficeTime(b.starts_at).format("HH:mm")}–${inOfficeTime(b.ends_at).format("HH:mm")}`;

export default function MyBookingsPage() {
  const { isGuest } = useAuth();
  const { t } = useLanguage();
  const { push } = useNotifications();
  const [messageApi, contextHolder] = message.useMessage();

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  // Numele fiecărui loc, după numărul (id) din backend
  const [labels, setLabels] = useState<Record<number, string>>({});
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
    (b) => checkInState(inOfficeTime(b.starts_at), now, b.is_checked_in) === "expired"
  );
  useEffect(() => {
    if (!hasExpired) return;
    const id = setInterval(() => setReload((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [hasExpired]);

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
        if (!cancelled) messageApi.error(t.mine.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isGuest, reload, messageApi, t]);

  const placeOf = (b: ApiBooking) => labels[b.seat_id] ?? `#${b.seat_id}`;

  const handleCancel = async (b: ApiBooking) => {
    try {
      await cancelBooking(b.id);
    } catch {
      messageApi.error(t.mine.cancelFailed);
      return;
    }
    const start = inOfficeTime(b.starts_at);
    push({
      kind: "cancelled",
      place: placeOf(b),
      date: start.format("YYYY-MM-DD"),
      from: start.format("HH:mm"),
      to: inOfficeTime(b.ends_at).format("HH:mm"),
    });
    setReload((n) => n + 1);
  };

  const handleCheckIn = async (b: ApiBooking) => {
    setCheckingId(b.id);
    try {
      const updated = await checkIn(b.id);
      setBookings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
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

  const columns: TableColumnsType<ApiBooking> = [
    { title: t.mine.place, key: "place", render: (_, b) => placeOf(b) },
    { title: t.mine.location, key: "location", render: () => locationOf(BOOKABLE_FLOOR_ID, (f) => floorName(t, f)) },
    { title: t.mine.date, key: "date", render: (_, b) => longDate(inOfficeTime(b.starts_at)) },
    { title: t.mine.time, key: "time", render: (_, b) => timeOf(b) },
    { title: "", key: "status", render: () => <Tag color="orange">{t.mine.upcoming}</Tag> },
    {
      title: "",
      key: "checkin",
      render: (_, b) => (
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
      <Table<ApiBooking>
        rowKey="id"
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