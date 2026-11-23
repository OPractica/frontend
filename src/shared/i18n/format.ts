import type { Dayjs } from "dayjs";
import type { Dict } from "./translations";

// Prima literă mare: "ноября" -> "Ноября", "ср" -> "Ср"
const capFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "17 Noiembrie", "17 Ноября", "17 November": luna întreagă, cu majusculă, în limba aleasă. */
export const dayMonth = (d: Dayjs) => d.format("D MMMM").replace(/ (\S)/, (_, c: string) => ` ${c.toUpperCase()}`);

/** "Mie., 18 Noiembrie 2026": cu ziua săptămânii și anul. */
export const longDate = (d: Dayjs) => `${capFirst(d.format("ddd"))}, ${dayMonth(d)} ${d.format("YYYY")}`;

/** Numele etajului în limba aleasă; dacă lipsește din traduceri, rămâne cel din date. */
export const floorName = (t: Dict, floor: { id: string; label: string }) => t.floors[floor.id] ?? floor.label;

/** Numele scurt al unui loc în limba aleasă: „Sala 1” → „Room 1”; locurile obișnuite („A01”) rămân la fel. */
export const placeName = (t: Dict, label: string) => t.plan.rooms[label]?.split(" · ")[0] ?? label;