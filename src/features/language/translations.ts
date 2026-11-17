import type { Lang } from "./language";

// Toate textele interfeței, pe limbi. Engleza dă forma; ro și ru trebuie să aibă aceleași chei.
const en = {
  menu: {
    offices: "Offices",
    booking: "Book a place",
    mine: "My bookings",
    notifications: "Notifications",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    language: "Language",
    signIn: "Sign in",
    signOut: "Sign out",
    guestName: "Guest",
    guest: "Guest (not signed in)",
    notSignedIn: "Not signed in",
    expand: "Expand menu",
    collapse: "Collapse menu",
  },
};

export type Dict = typeof en;

const ro: Dict = {
  menu: {
    offices: "Oficii",
    booking: "Rezervă un loc",
    mine: "Rezervările mele",
    notifications: "Notificări",
    lightMode: "Temă deschisă",
    darkMode: "Temă întunecată",
    language: "Limba",
    signIn: "Autentificare",
    signOut: "Ieșire",
    guestName: "Vizitator",
    guest: "Vizitator (neautentificat)",
    notSignedIn: "Neautentificat",
    expand: "Extinde meniul",
    collapse: "Restrânge meniul",
  },
};

const ru: Dict = {
  menu: {
    offices: "Офисы",
    booking: "Забронировать место",
    mine: "Мои бронирования",
    notifications: "Уведомления",
    lightMode: "Светлая тема",
    darkMode: "Тёмная тема",
    language: "Язык",
    signIn: "Войти",
    signOut: "Выйти",
    guestName: "Гость",
    guest: "Гость (вход не выполнен)",
    notSignedIn: "Вход не выполнен",
    expand: "Развернуть меню",
    collapse: "Свернуть меню",
  },
};

export const DICTS: Record<Lang, Dict> = { en, ro, ru };

export const LANGUAGES: { key: Lang; label: string }[] = [
  { key: "ro", label: "Română" },
  { key: "ru", label: "Русский" },
  { key: "en", label: "English" },
];