import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import { Button, Drawer, Empty, List } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useBookings } from "../../entities/booking/bookings";
import { useLanguage } from "../../shared/i18n/language";
import { dayMonth, floorName } from "../../shared/i18n/format";
import { locationOf } from "../../entities/office/offices";

export type NoticeKind = "booked" | "cancelled" | "reminder";

/**
 * Notificarea ține minte datele (locul, ziua, orele), nu textul gata scris.
 * Textul se compune la afișare, în limba aleasă atunci, ca la schimbarea limbii să se traducă și notificările vechi.
 */
type NoticeData = {
  place: string;
  /** Ziua, AAAA-LL-ZZ. */
  date: string;
  /** Orele, de forma "09:00". */
  from: string;
  to: string;
  /** Etajul, pentru „unde” (doar la rezervare). */
  floorId?: string;
};

export type Notice = NoticeData & { id: string; kind: NoticeKind; createdAt: string; read: boolean };
type NewNotice = NoticeData & { id?: string; kind: NoticeKind };

type NotificationsApi = {
  items: Notice[];
  unread: number;
  push: (n: NewNotice) => void;
  markAllRead: () => void;
  clear: () => void;
};

const NotificationsContext = createContext<NotificationsApi | null>(null);
// v2: notificările țin date, nu text (cele din v1 erau texte gata scrise și nu se pot traduce)
const storageKey = (email: string) => `workplace-booking.notifications.v2.${email}`;
const pad = (h: number) => String(h).padStart(2, "0");

function load(email: string): Notice[] {
  try {
    const raw = window.localStorage.getItem(storageKey(email));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is Notice =>
        typeof n === "object" &&
        n !== null &&
        typeof n.id === "string" &&
        typeof n.place === "string" &&
        typeof n.date === "string" &&
        typeof n.from === "string" &&
        typeof n.to === "string" &&
        typeof n.createdAt === "string" &&
        typeof n.read === "boolean" &&
        (n.kind === "booked" || n.kind === "cancelled" || n.kind === "reminder")
    );
  } catch {
    return [];
  }
}

/** Notificările sunt separate pentru fiecare utilizator; provider-ul se reia cu `key={email}`. */
export function NotificationsProvider({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  const [items, setItems] = useState<Notice[]>(() => load(userEmail));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(userEmail), JSON.stringify(items));
    } catch {
      /* fără salvare */
    }
  }, [items, userEmail]);

  const push = useCallback((n: NewNotice) => {
    setItems((prev) => {
      const id = n.id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (prev.some((p) => p.id === id)) return prev;
      const next: Notice = { ...n, id, createdAt: new Date().toISOString(), read: false };
      return [next, ...prev].slice(0, 50);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => (prev.every((i) => i.read) ? prev : prev.map((i) => ({ ...i, read: true }))));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, unread: items.filter((i) => !i.read).length, push, markAllRead, clear }),
    [items, push, markAllRead, clear]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications(): NotificationsApi {
  const api = useContext(NotificationsContext);
  if (!api) throw new Error("useNotifications must be used inside NotificationsProvider");
  return api;
}

/** La fiecare rezervare proprie de azi care nu s-a încheiat, apare o reamintire (o singură dată pe rezervare). */
export function RemindersWatcher({ userEmail }: { userEmail: string }) {
  const { bookings } = useBookings();
  const { push } = useNotifications();

  useEffect(() => {
    const now = new Date();
    const today = dayjs(now).format("YYYY-MM-DD");
    bookings.forEach((b) => {
      if (b.userId === userEmail && b.date === today && b.to > now.getHours()) {
        push({
          id: `reminder-${b.id}`,
          kind: "reminder",
          place: b.placeId,
          date: b.date,
          from: `${pad(b.from)}:00`,
          to: `${pad(b.to)}:00`,
        });
      }
    });
  }, [bookings, userEmail, push]);

  return null;
}

const ICONS: Record<NoticeKind, ReactNode> = {
  booked: <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />,
  cancelled: <CloseCircleOutlined style={{ color: "#f5222d", fontSize: 20 }} />,
  reminder: <ClockCircleOutlined style={{ color: "#ff7900", fontSize: 20 }} />,
};

export function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, markAllRead, clear } = useNotifications();
  const { t } = useLanguage();

  // Textul notificării, în limba de acum
  const textOf = (n: Notice) => {
    const when = `${dayMonth(dayjs(n.date))}, ${n.from}–${n.to}`;
    if (n.kind === "booked") {
      const where = n.floorId ? locationOf(n.floorId, (f) => floorName(t, f)) : "";
      return where ? t.booking.bookedNotice(n.place, when, where) : t.booking.booked(n.place, when);
    }
    if (n.kind === "cancelled") return t.mine.cancelledNotice(n.place, when);
    return t.notices.today(n.place, `${n.from}–${n.to}`);
  };

  const close = () => {
    markAllRead(); // ce ai văzut se marchează citit la închidere
    onClose();
  };

  return (
    <Drawer
      title={t.menu.notifications}
      open={open}
      onClose={close}
      width={380}
      extra={
        items.length > 0 ? (
          <Button size="small" onClick={clear}>
            {t.notices.clearAll}
          </Button>
        ) : null
      }
    >
      {items.length === 0 ? (
        <Empty description={t.notices.empty} />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={items}
          renderItem={(n) => (
            <List.Item key={n.id}>
              <List.Item.Meta
                avatar={ICONS[n.kind]}
                title={<span style={{ fontWeight: n.read ? 400 : 600 }}>{textOf(n)}</span>}
                description={`${dayMonth(dayjs(n.createdAt))}, ${dayjs(n.createdAt).format("HH:mm")}`}
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}