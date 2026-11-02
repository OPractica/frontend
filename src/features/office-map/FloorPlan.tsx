import { DOORS, DASHED_CIRCLES, DASHED_RECTS, RECTS, WALLS } from "./layout";

export default function FloorPlan() {
  return (
    <g>
      
      {WALLS.map((wall, i) => (
        <line key={`wall-${i}`} {...wall} stroke="#bfbfbf" strokeDasharray="4 4" />
      ))}
      {RECTS.map((r, i) => (
        <rect key={`rect-${i}`} {...r} fill="none" stroke="#bfbfbf" strokeWidth={1.5} />
      ))}
      {DASHED_CIRCLES.map((c, i) => (
        <circle key={`circle-${i}`} {...c} fill="none" stroke="#bfbfbf" strokeDasharray="4 4" />
      ))}
      {DASHED_RECTS.map((r, i) => (
        <rect key={`dashed-${i}`} {...r} fill="none" stroke="#bfbfbf" strokeDasharray="4 4" />
      ))}
      {DOORS.map((door, i) => (
        <line key={`door-${i}`} {...door} stroke="#000" strokeWidth={4} />
      ))}
    </g>
  );
}