import { useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Breadcrumb, Button, Checkbox, Empty, Input, Popover, Space, Tooltip, message, theme as antdTheme } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { BookingPanel, type BookingSelection } from "../../features/booking-panel";
import { FloorPlan } from "../../features/floor-plan";
import { ROOMS, SEATS, type SeatAttribute } from "../../features/floor-plan/floorPlanData";
import { AiNotConnectedError, askAi, type AiKind } from "../../features/ai-search/aiSearch";
import { useNotifications } from "../../features/notifications/notifications";
import { useAuth } from "../../features/auth/auth";
import { intervalOf } from "../../entities/booking";
import { createBooking, officeTime } from "../../entities/booking/bookingsApi";
import { fetchAvailability, fetchSeats } from "../../entities/seat/seatsApi";
import { ApiError } from "../../shared/api/client";
import { OFFICES, type Floor, type Office } from "../../entities/office/offices";

const ORANGE = "#ff7900";
const pad = (h: number) => String(h).padStart(2, "0");

const ATTR_LABEL: Record<SeatAttribute, string> = {
  window: "Window",
  quiet: "Quiet zone",
  "dual-monitor": "Two monitors",
  dock: "Dock station",
};

// Aceleași reguli ca în calendar: nu în trecut, nu sâmbăta și duminica
const isBlocked = (d: Dayjs) => d.isBefore(dayjs(), "day") || d.day() === 0 || d.day() === 6;


type Props = {
  office: Office;
  floor: Floor;
  onChangeFloor: (office: Office, floor: Floor) => void;
};

export default function BookingPage({ office, floor, onChangeFloor }: Props) {
  const { isGuest } = useAuth();
  const { push } = useNotifications();
  const [messageApi, contextHolder] = message.useMessage();
  const { token } = antdTheme.useToken();
  const roundButton = { boxShadow: "0 2px 8px rgba(0,0,0,0.18)", background: token.colorBgContainer } as const;
  const panelStyle = { background: token.colorBgContainer, border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, padding: 16 };

  const [place, setPlace] = useState<string | null>(null);
  const [selection, setSelection] = useState<BookingSelection | null>(null);

  // Valori de pornire pentru calendar, setate de căutarea cu AI (se reia panoul prin schimbarea cheii)
  const [initial, setInitial] = useState<BookingSelection | undefined>(undefined);
  const [panelKey, setPanelKey] = useState(0);

  // Evidențierea locurilor potrivite: din filtru sau din căutarea cu AI
  const [attrs, setAttrs] = useState<SeatAttribute[]>([]);
  const [kind, setKind] = useState<AiKind | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  // Ce este ocupat depinde de etaj, dată și orele alese în calendar


  // Numărul (id) fiecărui loc din backend, după nume; e nevoie de el la rezervare
  const [seatIds, setSeatIds] = useState<Record<string, number>>({});
  // Crește după fiecare rezervare, ca harta să ceară din nou ce e ocupat
  const [reload, setReload] = useState(0);

  useEffect(() => {
    fetchSeats()
      .then((rows) => setSeatIds(Object.fromEntries(rows.map((s) => [s.label, s.id]))))
      .catch(() => setSeatIds({}));
  }, []);

  // Ce este ocupat vine de la backend, pentru data și orele alese în calendar
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selection) return;
    const { date, from, to } = intervalOf(selection);
    let cancelled = false;

    fetchAvailability(`${date}T${pad(from)}:00:00`, `${date}T${pad(to)}:00:00`)
      .then((rows) => {
        if (cancelled) return;
        setBookedIds(new Set(rows.filter((r) => r.status === "booked").map((r) => r.label)));
      })
      .catch(() => {
        if (!cancelled) setBookedIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [selection, reload]);
  

  const highlighting = attrs.length > 0 || kind !== null;
  const suggestedIds = useMemo(() => {
    const ids = new Set<string>();
    if (!highlighting) return ids;
    if (kind) {
      const roomKind = kind === "room" ? "meeting" : "booth";
      ROOMS.filter((r) => r.kind === roomKind && !bookedIds.has(r.id)).forEach((r) => ids.add(r.id));
    } else {
      SEATS.filter((s) => !bookedIds.has(s.id) && attrs.every((a) => s.attributes.includes(a))).forEach((s) =>
        ids.add(s.id)
      );
    }
    return ids;
  }, [highlighting, kind, attrs, bookedIds]);

  // Dacă locul ales devine ocupat la altă dată sau oră, se deselectează singur
  const selectedPlace = place !== null && !bookedIds.has(place) ? place : null;

  const clearHighlights = () => {
    setAttrs([]);
    setKind(null);
    setAiNote("");
    setAiText("");
  };

  // Căutarea cu AI: cheamă punctul de conectare `askAi` și aplică filtrele primite
  const runAi = async (text: string) => {
    const query = text.trim();
    if (!query) return;
    setAiBusy(true);
    try {
      const q = await askAi(query);

      const date = q.date ? dayjs(q.date) : null;
      const base = date ?? selection?.date ?? dayjs();
      if ((date || q.from !== null) && isBlocked(base)) {
        setAiNote(`${base.format("DD MMM")} can't be booked (weekend or past date). Pick a working day.`);
        return;
      }

      setAttrs(q.attributes);
      setKind(q.kind);

      const parts = [q.kind === "room" ? "meeting room" : q.kind === "booth" ? "phone booth" : "seat"];
      q.attributes.forEach((a) => parts.push(ATTR_LABEL[a].toLowerCase()));
      if (date || q.from !== null) {
        setInitial({ date: base, hourly: q.from !== null, from: q.from ?? 9, to: q.to ?? 18 });
        setPanelKey((k) => k + 1);
        parts.push(base.format("DD MMM"), q.from !== null ? `${pad(q.from)}:00–${pad(q.to ?? 18)}:00` : "all day");
      }
      setAiNote(q.message ?? parts.join(" · "));
    } catch (e) {
      setAiNote(e instanceof AiNotConnectedError ? "AI search isn't connected yet." : "AI search failed. Try again.");
    } finally {
      setAiBusy(false);
    }
  };

  const handleBook = async (sel: BookingSelection) => {
    if (!selectedPlace) return;
    if (isGuest) {
      messageApi.warning("Sign in to book a place.");
      return;
    }
    const seatId = seatIds[selectedPlace];
    if (seatId === undefined) {
      messageApi.error(`${selectedPlace} can't be booked yet.`);
      return;
    }

    const interval = intervalOf(sel);
    try {
      await createBooking(seatId, officeTime(interval.date, interval.from), officeTime(interval.date, interval.to));
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 401) messageApi.error("Your session expired. Sign out and sign in again.");
      else if (status === 409) messageApi.error(`${selectedPlace} is already booked for that time.`);
      else messageApi.error(e instanceof ApiError ? e.message : "Booking failed. Try again.");
      setReload((n) => n + 1);
      return;
    }

    const when = `${sel.date.format("DD MMM")}, ${pad(interval.from)}:00–${pad(interval.to)}:00`;
    messageApi.success(`Place ${selectedPlace} booked for ${when}`);
    push({ kind: "booked", text: `${selectedPlace} booked for ${when} · ${office.name}, ${floor.label}` });
    setPlace(null); // după rezervare, locul se deselectează
    setReload((n) => n + 1);
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
          title: floor.label,
          menu: {
            items: office.floors.map((f) => ({ key: f.id, label: f.label })),
            selectable: true,
            selectedKeys: [floor.id],
            onClick: ({ key }) => {
              const next = office.floors.find((f) => f.id === key);
              if (next) onChangeFloor(office, next);
            },
          },
        },
        { title: <span style={{ color: ORANGE }}>Select Place</span> },
      ]}
    />
  );

  const filterContent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
      <Checkbox.Group
        value={attrs}
        onChange={(v) => {
          setAttrs(v as SeatAttribute[]);
          setKind(null);
        }}
        options={(Object.keys(ATTR_LABEL) as SeatAttribute[]).map((k) => ({ value: k, label: ATTR_LABEL[k] }))}
        style={{ display: "flex", flexDirection: "column", gap: 8 }}
      />
      <Button size="small" type="link" style={{ alignSelf: "flex-start", padding: 0 }} onClick={clearHighlights}>
        Clear
      </Button>
    </div>
  );

  const tools = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <Space>
        <Tooltip title="Search with AI">
          <Button
            shape="circle"
            size="large"
            icon={<SearchOutlined />}
            type={aiOpen ? "primary" : "default"}
            aria-label="Search with AI"
            style={aiOpen ? undefined : roundButton}
            onClick={() => setAiOpen(!aiOpen)}
          />
        </Tooltip>
        <Popover trigger="click" placement="bottomRight" title="Highlight places" content={filterContent}>
          <Button
            shape="circle"
            size="large"
            icon={<FilterOutlined />}
            type={highlighting ? "primary" : "default"}
            aria-label="Filter places"
            style={highlighting ? undefined : roundButton}
          />
        </Popover>
      </Space>

      {aiOpen && (
        <div style={{ width: 380, maxWidth: "100%" }}>
          <Input.Search
            autoFocus
            allowClear
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            onSearch={runAi}
            enterButton="Ask AI"
            loading={aiBusy}
            placeholder="e.g. quiet seat with a window tomorrow 10-14"
            aria-label="Ask AI to find a place"
          />
        </div>
      )}

      {highlighting && (
        <div style={{ fontSize: 12, color: token.colorTextSecondary, textAlign: "right" }}>
          {aiNote ? `${aiNote} · ` : ""}
          {suggestedIds.size} available{" "}
          <Button type="link" size="small" style={{ padding: 0, height: "auto", fontSize: 12 }} onClick={clearHighlights}>
            Clear
          </Button>
        </div>
      )}
      {!highlighting && aiNote && <div style={{ fontSize: 12, color: token.colorTextSecondary, maxWidth: 380, textAlign: "right" }}>{aiNote}</div>}
    </div>
  );

  // Etajele fără plan desenat: doar mesaj, fără hartă și fără calendar
  if (!floor.available) {
    return (
      <div style={{ ...panelStyle, minHeight: 460 }}>
        <div style={{ paddingTop: 6 }}>{breadcrumb}</div>
        <Empty
          style={{ marginTop: 96 }}
          description="Booking is currently unavailable for this floor. Select the 7th floor · Block A to book a place."
        />
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
          key={panelKey}
          initial={initial}
          placeLabel={selectedPlace}
          onBook={handleBook}
          onSelectionChange={setSelection}
        />
      </div>
    </div>
  );
}
