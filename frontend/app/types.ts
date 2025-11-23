// app/types.ts
export type SeatingPlanResponse = {
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

export type Guest = {
  id: string;
  name: string;
  gender?: string | null;
  maritalStatus?: string | null;
  wantsToSitNextTo: string[];
  mustNotSitNextTo: string[];
  tags: string[];
  attributes: Record<string, any>;
};

export type CsvImportResponse = {
  guests: Guest[];
  warnings: string[];
};

export type TableConfig = {
  id: string;
  name: string;
  shape?: "round" | "trestle";
  capacity?: number;
};

export type Weights = {
  mustNotWeight: number;
  wantsWeight: number;
  adjacentSinglesWeight: number;
  sameGenderAdjWeight: number;
  alternatingTablesWeight: number;
  splitCouplesWeight: number;
};

export const DEFAULT_WEIGHTS: Weights = {
  mustNotWeight: 10,
  wantsWeight: 5,
  adjacentSinglesWeight: 3,
  sameGenderAdjWeight: 3,
  alternatingTablesWeight: 2,
  splitCouplesWeight: 8,
};

export const API_BASE_URL = "http://127.0.0.1:8000";

export const SAMPLE_GUESTS_AND_TABLES = {
  guests: [
    {
      id: "g1",
      name: "Nick Ellison",
      gender: "Male",
      maritalStatus: "Married to Charlotte Ellison",
      wantsToSitNextTo: ["g2"],
      mustNotSitNextTo: [],
      tags: ["VIP"],
      attributes: { side: "groom" },
    },
    {
      id: "g2",
      name: "Charlotte Ellison",
      gender: "Female",
      maritalStatus: "Married to Nick Ellison",
      wantsToSitNextTo: ["g1"],
      mustNotSitNextTo: [],
      tags: [],
      attributes: { side: "bride" },
    },
    {
      id: "g3",
      name: "Tim",
      gender: "Male",
      maritalStatus: "Single",
      wantsToSitNextTo: [],
      mustNotSitNextTo: [],
      tags: [],
      attributes: {},
    },
    {
      id: "g4",
      name: "Daisy",
      gender: "Female",
      maritalStatus: "Single",
      wantsToSitNextTo: [],
      mustNotSitNextTo: [],
      tags: [],
      attributes: {},
    },
  ],
  tables: [
    {
      id: "t1",
      name: "Table 1",
      shape: "round" as const,
      capacity: 4,
    },
  ],
};

/**
 * Event types for persistence
 */

export type EventSummary = {
  id: number;
  name: string;
  profile: string;
  guestCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};

export type EventDetail = {
  id: number;
  name: string;
  profile: string;
  maxAttempts: number;
  seed: number | null;
  weights: Weights;
  guests: Guest[];
  tables: TableConfig[];
  lastResult: SeatingPlanResponse | null;
  createdAt: string;
  updatedAt: string;
};
