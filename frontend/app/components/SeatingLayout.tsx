"use client";

import React, { useState } from "react";

type SeatingPlanResponse = {
  tables: {
    tableId: string;
    seats: { seatIndex: number; guestId: string }[];
  }[];
  metrics: {
    mustNotViolations: number;
    wantsSatisfied: number;
    adjacentSingles: number;
    sameGenderAdjacencies: number;
    alternatingTables: number;
    splitCouples: number;
  };
  attemptsMade: number;
};

type Guest = {
  id: string;
  name: string;
  gender?: string | null;
  maritalStatus?: string | null;
  wantsToSitNextTo: string[];
  mustNotSitNextTo: string[];
  tags: string[];
  attributes: Record<string, any>;
};

type SeatingLayoutProps = {
  plan: SeatingPlanResponse | null;
  guestsById: Map<string, Guest>;
  // Table shape is provided by caller (from tables JSON)
  getTableShape?: (tableId: string) => "round" | "trestle";
};

function getDisplayName(guest?: Guest) {
  return guest?.name ?? "Unknown";
}

function getSeatLabel(guest?: Guest) {
  const name = getDisplayName(guest);
  const first = name.trim().split(" ")[0];
  return first || "Guest";
}

function getBadges(guest?: Guest): string[] {
  if (!guest) return [];
  const badges: string[] = [];

  const ms = guest.maritalStatus?.toLowerCase() ?? "";
  if (ms.includes("single")) {
    badges.push("Single");
  } else if (
    ms.includes("married") ||
    ms.includes("engaged") ||
    ms.includes("partner")
  ) {
    badges.push("Couple");
  }

  if (guest.tags?.length) {
    badges.push(...guest.tags);
  }

  return badges;
}

// seat colour by gender
function getSeatFill(guest?: Guest): string {
  const g = guest?.gender?.toLowerCase() ?? "";
  if (g.startsWith("m")) return COLORS.seatFillMale;
  if (g.startsWith("f")) return COLORS.seatFillFemale;
  return COLORS.seatFillUnknown;
}

// Tooltip content for hover
function getSeatTooltip(guest?: Guest): string {
  if (!guest) return "Unknown guest";
  const badges = getBadges(guest);
  const lines: string[] = [guest.name];

  if (guest.gender) lines.push(`Gender: ${guest.gender}`);
  if (guest.maritalStatus) lines.push(`Status: ${guest.maritalStatus}`);
  if (badges.length) lines.push(`Tags: ${badges.join(" • ")}`);

  return lines.join("\n");
}

const TABLE_SIZE = 260;
const SEAT_RADIUS = 14;
const TABLE_RADIUS = 70;

const COLORS = {
  tableFill: "#111827",
  tableStroke: "#e5e7eb",
  seatFillMale: "#0ea5e9", // blue-ish
  seatFillFemale: "#ec4899", // pink-ish
  seatFillUnknown: "#6b7280", // grey
  seatStroke: "#f9fafb",
  textMain: "#f9fafb",
  textSecondary: "#d1d5db",
};

type Seat = { seatIndex: number; guestId: string };
type TableSvgProps = {
  seats: Seat[];
  guestsById: Map<string, Guest>;
  onSeatHover: (info: SeatHoverInfo | null) => void;
};

type SeatHoverInfo = {
  x: number; // SVG px coords
  y: number;
  text: string;
} | null;

export const SeatingLayout: React.FC<SeatingLayoutProps> = ({
  plan,
  guestsById,
  getTableShape,
}) => {
  if (!plan || !plan.tables.length) {
    return (
      <div className="text-xs text-slate-500">
        No seating plan available. Generate a plan to see the layout.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plan.tables.map((table) => {
        const seats = table.seats;
        const seatCount = seats.length;
        const shape: "round" | "trestle" =
          getTableShape?.(table.tableId) ?? "round";

        return (
          <div
            key={table.tableId}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-slate-100">
                Table {table.tableId}
              </h3>
              <span className="text-[10px] text-slate-400">
                {shape === "round" ? "Round" : "Trestle"} · {seatCount} seats
              </span>
            </div>

            <div className="flex justify-center">
              <TableWithTooltip
                shape={shape}
                seats={seats}
                guestsById={guestsById}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Local wrapper so each table has its own hover state & tooltip.
 */
const TableWithTooltip: React.FC<{
  shape: "round" | "trestle";
  seats: Seat[];
  guestsById: Map<string, Guest>;
}> = ({ shape, seats, guestsById }) => {
  const [hover, setHover] = useState<SeatHoverInfo>(null);

  return (
    <div className="relative inline-block">
      <svg
        width={TABLE_SIZE}
        height={TABLE_SIZE}
        viewBox={`0 0 ${TABLE_SIZE} ${TABLE_SIZE}`}
      >
        {shape === "round" ? (
          <RoundTable
            seats={seats}
            guestsById={guestsById}
            onSeatHover={setHover}
          />
        ) : (
          <TrestleTable
            seats={seats}
            guestsById={guestsById}
            onSeatHover={setHover}
          />
        )}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute whitespace-pre rounded-md bg-slate-900/95 border border-slate-700 px-2 py-1 text-[10px] text-slate-100 shadow-lg"
          style={{
            left: hover.x,
            top: hover.y,
            transform: "translate(-50%, -140%)",
            maxWidth: 180,
          }}
        >
          {hover.text}
        </div>
      )}
    </div>
  );
};

const RoundTable: React.FC<TableSvgProps> = ({
  seats,
  guestsById,
  onSeatHover,
}) => {
  const cx = TABLE_SIZE / 2;
  const cy = TABLE_SIZE / 2;
  const seatCount = seats.length;

  return (
    <>
      {/* table top */}
      <circle
        cx={cx}
        cy={cy}
        r={TABLE_RADIUS}
        fill={COLORS.tableFill}
        stroke={COLORS.tableStroke}
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={COLORS.textSecondary}
        style={{ fontSize: 11, fontFamily: "system-ui, sans-serif" }}
      >
        {seatCount} seats
      </text>

      {/* seats */}
      {seats.map((seat, index) => {
        const angle = (2 * Math.PI * index) / seatCount - Math.PI / 2;
        const r = TABLE_RADIUS + 45;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);

        const guest = guestsById.get(seat.guestId);
        const label = getSeatLabel(guest);
        const tooltip = getSeatTooltip(guest);
        const fill = getSeatFill(guest);

        const isTopSeat = Math.abs(angle + Math.PI / 2) < Math.PI / 8;
        const nameY = isTopSeat
          ? y + SEAT_RADIUS + 14 // top seat: name below circle
          : Math.max(y - SEAT_RADIUS - 8, 14);

        return (
          <g
            key={seat.seatIndex}
            onMouseEnter={() =>
              onSeatHover({
                x,
                y,
                text: tooltip,
              })
            }
            onMouseLeave={() => onSeatHover(null)}
          >
            {/* name */}
            <text
              x={x}
              y={nameY}
              textAnchor="middle"
              fill={COLORS.textMain}
              style={{
                fontSize: 11,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
              }}
            >
              {label}
            </text>

            {/* seat */}
            <circle
              cx={x}
              cy={y}
              r={SEAT_RADIUS}
              fill={fill}
              stroke={COLORS.seatStroke}
              strokeWidth={2}
            />
          </g>
        );
      })}
    </>
  );
};

const TrestleTable: React.FC<TableSvgProps> = ({
  seats,
  guestsById,
  onSeatHover,
}) => {
  const width = 180;
  const height = 50;
  const cx = TABLE_SIZE / 2;
  const cy = TABLE_SIZE / 2;

  const x1 = cx - width / 2;
  const y1 = cy - height / 2;
  const y2 = cy + height / 2;

  const seatCount = seats.length;
  const topCount = Math.ceil(seatCount / 2);
  const bottomCount = seatCount - topCount;

  return (
    <>
      {/* table top */}
      <rect
        x={x1}
        y={y1}
        width={width}
        height={height}
        rx={10}
        ry={10}
        fill={COLORS.tableFill}
        stroke={COLORS.tableStroke}
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={COLORS.textSecondary}
        style={{ fontSize: 11, fontFamily: "system-ui, sans-serif" }}
      >
        {seatCount} seats
      </text>

      {/* seats */}
      {seats.map((seat, idx) => {
        const isTop = idx < topCount;
        const indexInRow = isTop ? idx : idx - topCount;
        const rowCount = isTop ? topCount : bottomCount || 1;

        const padding = 16;
        const usableWidth = width - padding * 2;
        const step = rowCount > 1 ? usableWidth / (rowCount - 1) : 0;
        const sx = x1 + padding + step * indexInRow;
        const sy = isTop ? y1 - 24 : y2 + 24;

        const guest = guestsById.get(seat.guestId);
        const label = getSeatLabel(guest);
        const tooltip = getSeatTooltip(guest);
        const fill = getSeatFill(guest);

        const nameY = Math.max(sy - SEAT_RADIUS - 8, 14);

        return (
          <g
            key={seat.seatIndex}
            onMouseEnter={() =>
              onSeatHover({
                x: sx,
                y: sy,
                text: tooltip,
              })
            }
            onMouseLeave={() => onSeatHover(null)}
          >
            {/* name */}
            <text
              x={sx}
              y={nameY}
              textAnchor="middle"
              fill={COLORS.textMain}
              style={{
                fontSize: 11,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
              }}
            >
              {label}
            </text>

            {/* seat */}
            <circle
              cx={sx}
              cy={sy}
              r={SEAT_RADIUS}
              fill={fill}
              stroke={COLORS.seatStroke}
              strokeWidth={2}
            />
          </g>
        );
      })}
    </>
  );
};
