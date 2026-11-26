import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Breadcrumb, Button, Checkbox, Divider, Empty, InputNumber, Popover, message, theme as antdTheme } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { BookingPanel, type BookingSelection } from "../../features/booking-panel";
import { FloorPlan } from "../../features/floor-plan";
import { SEATS, type SeatAttribute } from "../../features/floor-plan/floorPlanData";
import { AiAssistant } from "../../features/ai-assistant";
import { useNotifications } from "../../features/notifications/notifications";
import { useAuth } from "../../features/auth/auth";
import { intervalOf } from "../../entities/booking";
import { createBooking, fetchMyBookings, inOfficeTime, officeTime, type ApiBooking } from "../../entities/booking/bookingsApi";
import { fetchAvailability, fetchSeats } from "../../entities/seat/seatsApi";
import { createRoomBooking, fetchRooms, roomEquipment, roomFits, type RoomStatus } from "../../entities/meeting-room/roomsApi";
import { ApiError } from "../../shared/api/client";
import { OFFICES, type Floor, type Office } from "../../entities/office/offices";
import { useLanguage } from "../../shared/i18n/language";
import { dayMonth, floorName, placeName } from "../../shared/i18n/format";

const ORANGE = "#ff7900";
const pad = (h: number) => String(h).padStart(2, "0");

type Props = {
  office: Office;
  floor: Floor;
  onChangeFloor: (office: Office, floor: Floor) => void;
};

export default function BookingPage({ office, floor, onChangeFloor }: Props) {
  const { isGuest } = useAuth();
  const { t } = useLanguage();
  const { push } = useNotifications();
  const [messageApi, contextHolder] = message.useMessage();
  const { token } = antdTheme.useToken();
  const roundButton = { boxShadow: "0 2px 8px rgba(0,0,0,0.18)", background: token.colorBgContainer } as const;
  const panelStyle = { background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, padding: 16 };

  const [place, setPlace] = useState<string | null>(null);
  const [selection, setSelection] = useState<BookingSelection | null>(null);

  // Evidențierea locurilor potrivite, din filtru
  const [attrs, setAttrs] = useState<SeatAttribute[]>([]);
  // Evidențierea sălilor potrivite: câte persoane vin și ce echipament trebuie (doar filtru, nu se salvează)
  const [people, setPeople] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);

  // Numărul (id) fiecărui loc din backend, după nume; e nevoie de el la rezervare
  const [seatIds, setSeatIds] = useState<Record<string, number>>({});
  // Sălile și cabinele din backend pentru intervalul ales: id, capacitate, echipament, ocupat / liber
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  // Numărul (id) fiecărei săli și cabine, după numele de pe hartă („Chili” → 1)
  const roomIds = useMemo(() => Object.fromEntries(rooms.map((r) => [r.roomAlias, r.roomId])), [rooms]);
  // Crește după fiecare rezervare, ca harta să ceară din nou ce e ocupat
  const [reload, setReload] = useState(0);

  useEffect(() => {
    fetchSeats()
      .then((rows) => setSeatIds(Object.fromEntries(rows.map((s) => [s.label, s.id]))))
      .catch(() => setSeatIds({}));
  }, []);

  // Rezervările mele, așa cum erau înainte de ultimul răspuns al asistentului AI.
  // Asistentul rezervă și anulează direct în backend și răspunde doar cu text, așa că
  // după fiecare răspuns comparăm lista nouă cu aceasta, ca să știm ce notificări să adăugăm.
  const mineRef = useRef<ApiBooking[] | null>(null);
  const refreshMine = () =>
    fetchMyBookings()
      .then((rows) => {
        mineRef.current = rows;
        return rows;
      })
      .catch(() => null);

  useEffect(() => {
    if (isGuest) {
      mineRef.current = null;
      return;
    }
    fetchMyBookings()
      .then((rows) => {
        mineRef.current = rows;
      })
      .catch(() => {});
  }, [isGuest]);

  // Ce este ocupat vine de la backend, pentru data și orele alese în calendar
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selection) return;
    const { date, from, to } = intervalOf(selection);
    let cancelled = false;

    const fromDate = `${date}T${pad(from)}:00:00`;
    const toDate = `${date}T${pad(to)}:00:00`;
    // Locurile și sălile au endpoint-uri separate; harta le arată împreună
    Promise.all([fetchAvailability(fromDate, toDate), fetchRooms(fromDate, toDate).catch(() => [])])
      .then(([seats, roomRows]) => {
        if (cancelled) return;
        setRooms(roomRows);
        setBookedIds(
          new Set([
            ...seats.filter((r) => r.status === "booked").map((r) => r.label),
            ...roomRows.filter((r) => r.isBusy).map((r) => r.roomAlias),
          ])
        );
      })
      .catch(() => {
        if (!cancelled) setBookedIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [selection, reload]);

  // Echipamentul pentru filtru vine din datele sălilor, nu dintr-o listă scrisă de mână
  const equipmentOptions = useMemo(() => {
    const byKey = new Map<string, string>();
    rooms.forEach((r) =>
      roomEquipment(r).forEach((item) => {
        if (!byKey.has(item.toLowerCase())) byKey.set(item.toLowerCase(), item);
      })
    );
    return [...byKey.values()].sort((a, b) => a.localeCompare(b));
  }, [rooms]);

  const roomFilter = people !== null || equipment.length > 0;
  const highlighting = attrs.length > 0 || roomFilter;
  const suggestedIds = useMemo(() => {
    const ids = new Set<string>();
    if (attrs.length > 0) {
      SEATS.filter((s) => !bookedIds.has(s.id) && attrs.every((a) => s.attributes.includes(a))).forEach((s) => ids.add(s.id));
    }
    // Sălile potrivite: libere, încap toți și au tot echipamentul cerut
    if (roomFilter) rooms.filter((r) => !r.isBusy && roomFits(r, people, equipment)).forEach((r) => ids.add(r.roomAlias));
    return ids;
  }, [attrs, bookedIds, roomFilter, rooms, people, equipment]);

  // Dacă locul ales devine ocupat la altă dată sau oră, se deselectează singur
  const selectedPlace = place !== null && !bookedIds.has(place) ? place : null;

  const clearHighlights = () => {
    setAttrs([]);
    setPeople(null);
    setEquipment([]);
  };

  // Pentru sala aleasă: capacitatea și echipamentul, plus un avertisment dacă nu se potrivește filtrului
  const selectedRoom = rooms.find((r) => r.roomAlias === selectedPlace);
  let roomDetails: ReactNode = null;
  if (selectedRoom) {
    const capacity = parseInt(selectedRoom.roomCapacity, 10);
    const items = roomEquipment(selectedRoom);
    const missing = equipment.filter((e) => !items.some((item) => item.toLowerCase() === e.toLowerCase()));
    const warning = { color: token.colorWarningText };
    roomDetails = (
      <>
        <div>{t.booking.roomInfo(capacity, items.length > 0 ? items.join(", ") : t.booking.noEquipment)}</div>
        {people !== null && people > capacity && <div style={warning}>{t.booking.tooSmall(capacity, people)}</div>}
        {missing.length > 0 && <div style={warning}>{t.booking.missing(missing.join(", "))}</div>}
      </>
    );
  }

  const handleBook = async (sel: BookingSelection) => {
    if (!selectedPlace) return;
    if (isGuest) {
      messageApi.warning(t.booking.signInToBook);
      return;
    }
    const name = placeName(t, selectedPlace);
    // Locul ales e fie un loc obișnuit, fie o sală sau cabină; fiecare se rezervă prin endpoint-ul lui
    const seatId = seatIds[selectedPlace];
    const roomId = roomIds[selectedPlace];
    if (seatId === undefined && roomId === undefined) {
      messageApi.error(t.booking.cantBook(name));
      return;
    }

    const interval = intervalOf(sel);
    const startsAt = officeTime(interval.date, interval.from);
    const endsAt = officeTime(interval.date, interval.to);
    try {
      if (seatId !== undefined) await createBooking(seatId, startsAt, endsAt);
      else await createRoomBooking(roomId, startsAt, endsAt);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const code = e instanceof ApiError ? e.code : "";
      if (status === 401) messageApi.error(t.booking.sessionExpired);
      else if (code === "seat_already_booked" || code === "room_already_booked") messageApi.error(t.booking.alreadyBooked(name));
      else if (code === "room_not_found") messageApi.error(t.booking.cantBook(name));
      else messageApi.error(t.booking.errors[code] ?? t.booking.bookFailed);
      setReload((n) => n + 1);
      return;
    }

    const when = `${dayMonth(sel.date)}, ${pad(interval.from)}:00–${pad(interval.to)}:00`;
    messageApi.success(t.booking.booked(name, when));
    push({
      kind: "booked",
      place: selectedPlace,
      date: interval.date,
      from: `${pad(interval.from)}:00`,
      to: `${pad(interval.to)}:00`,
      floorId: floor.id,
    });
    setPlace(null); // după rezervare, locul se deselectează
    setReload((n) => n + 1);
    void refreshMine(); // ca rezervarea făcută de mână să nu apară încă o dată ca „nouă” după asistent
  };

  // După fiecare răspuns al asistentului: harta se reîncarcă, iar rezervările apărute sau dispărute devin notificări
  const handleAiReply = async () => {
    setReload((n) => n + 1);
    if (isGuest) return;
    const before = mineRef.current;
    const after = await refreshMine();
    if (!before || !after) return;

    const labelOf = (seatId: number) => Object.keys(seatIds).find((label) => seatIds[label] === seatId) ?? `#${seatId}`;
    const notify = (b: ApiBooking, kind: "booked" | "cancelled") => {
      const start = inOfficeTime(b.starts_at);
      push({
        kind,
        place: labelOf(b.seat_id),
        date: start.format("YYYY-MM-DD"),
        from: start.format("HH:mm"),
        to: inOfficeTime(b.ends_at).format("HH:mm"),
        floorId: kind === "booked" ? floor.id : undefined,
      });
    };

    const beforeIds = new Set(before.map((b) => b.id));
    const afterIds = new Set(after.map((b) => b.id));
    after.filter((b) => !beforeIds.has(b.id)).forEach((b) => notify(b, "booked"));
    // O rezervare poate dispărea și pentru că s-a încheiat; acelea nu sunt anulări
    const now = Date.now();
    before
      .filter((b) => !afterIds.has(b.id) && new Date(b.ends_at).getTime() > now)
      .forEach((b) => notify(b, "cancelled"));
  };


  const breadcrumb = (
    <Breadcrumb
      style={{ fontWeight: 600 }}
      items={[
        {
          title: office.name,
          menu: {
            items: OFFICES.map((o) => ({ key: o.id, label: o.name })),
            selectable: true,
            selectedKeys: [office.id],
            onClick: ({ key }) => {
              const next = OFFICES.find((o) => o.id === key);
              if (next && next.id !== office.id) onChangeFloor(next, next.floors[0]);
            },
          },
        },
        {
          title: floorName(t, floor),
          menu: {
            items: office.floors.map((f) => ({ key: f.id, label: floorName(t, f) })),
            selectable: true,
            selectedKeys: [floor.id],
            onClick: ({ key }) => {
              const next = office.floors.find((f) => f.id === key);
              if (next) onChangeFloor(office, next);
            },
          },
        },
        { title: <span style={{ color: ORANGE }}>{t.booking.selectPlace}</span> },
      ]}
    />
  );

  const filterContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
      <Checkbox.Group
        value={attrs}
        onChange={(v) => setAttrs(v as SeatAttribute[])}
        options={(Object.keys(t.booking.attrs) as SeatAttribute[]).map((k) => ({ value: k, label: t.booking.attrs[k] }))}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      />
      <Divider style={{ margin: "4px 0" }} />
      <div style={{ fontWeight: 600 }}>{t.booking.meetingRoom}</div>
      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {t.booking.people}
        <InputNumber size="small" min={1} precision={0} value={people} onChange={setPeople} style={{ width: 72 }} />
      </label>
      {equipmentOptions.length > 0 && (
        <>
          <div style={{ color: token.colorTextSecondary }}>{t.booking.equipment}</div>
          <Checkbox.Group
            value={equipment}
            onChange={(v) => setEquipment(v as string[])}
            options={equipmentOptions}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          />
        </>
      )}
      <Button size="small" type="link" style={{ alignSelf: "flex-start", padding: 0 }} onClick={clearHighlights}>
        {t.booking.clear}
      </Button>
    </div>
  );

  const tools = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <Popover trigger="click" placement="bottomRight" title={t.booking.highlight} content={filterContent}>
        <Button
          shape="circle"
          size="large"
          icon={<FilterOutlined />}
          type={highlighting ? "primary" : "default"}
          aria-label={t.booking.filter}
          style={highlighting ? undefined : roundButton}
        />
      </Popover>

      {highlighting && (
        <div style={{ fontSize: 12, color: token.colorTextSecondary, textAlign: "right" }}>
          {t.booking.available(suggestedIds.size)}{" "}
          <Button type="link" size="small" style={{ padding: 0, height: "auto", fontSize: 12 }} onClick={clearHighlights}>
            {t.booking.clear}
          </Button>
        </div>
      )}
    </div>
  );

  // Etajele fără plan desenat: doar mesaj, fără hartă și fără calendar
  if (!floor.available) {
    return (
      <div style={{ ...panelStyle, minHeight: 460 }}>
        <div style={{ paddingTop: 6 }}>{breadcrumb}</div>
        <Empty style={{ marginTop: 96 }} description={t.booking.floorUnavailable} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch" }}>
      {contextHolder}
      <div style={{ flex: "1 1 640px", minWidth: 0, display: "flex" }}>
        <FloorPlan
          topLeft={breadcrumb}
          topRight={tools}
          bookedIds={bookedIds}
          suggestedIds={suggestedIds}
          selectedId={selectedPlace}
          onSelect={(id) => setPlace(id === place ? null : id)}
        />
      </div>
      <div style={{ ...panelStyle, flex: "0 0 auto" }}>
        <BookingPanel
          placeLabel={selectedPlace && placeName(t, selectedPlace)}
          placeDetails={roomDetails}
          onBook={handleBook}
          onSelectionChange={setSelection}
        />
      </div>
      <AiAssistant signedIn={!isGuest} onReply={handleAiReply} />
    </div>
  );
}