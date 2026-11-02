import { MOCK_SEATS } from "../../entities/seat";
import FloorPlan from "./FloorPlan";
import { MAP_HEIGHT, MAP_WIDTH, SEAT_POSITIONS, SEAT_SIZE } from "./layout";

export default function OfficeMap() {
  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      width="100%"
      style={{ background: "#fff" }}
    >

    <g transform="translate(1050, 0)">
      <FloorPlan />

      {MOCK_SEATS.map((seat) => {
        const pos = SEAT_POSITIONS[seat.label];
        if (!pos) return null;
        return (
          <rect
            key={seat.id}
            x={pos.x}
            y={pos.y}
            width={SEAT_SIZE}
            height={SEAT_SIZE}
            rx={4}
            fill="#fff"
            stroke="#000"
            strokeWidth={1.5}
            style={{ cursor: "pointer" }}
          >
            <title>{seat.label}</title>
          </rect>
        );
      })}
    </g>
    </svg>
  );
}