// app/lib/api.ts
import {
  API_BASE_URL,
  SeatingPlanResponse,
  CsvImportResponse,
  Weights,
  Guest,
  TableConfig,
  EventSummary,
  EventDetail,
} from "../types";

export async function generateSeating(params: {
  guests: any[];
  tables: any[];
  profile: string;
  maxAttempts: number;
  seed?: number;
  weights: Weights;
}): Promise<SeatingPlanResponse> {
  const res = await fetch(`${API_BASE_URL}/api/seating/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `API returned a non-JSON response (${res.status} ${res.statusText}).`
    );
  }

  if (!res.ok) {
    const detail = (data as any)?.detail || `API error (${res.status})`;
    throw new Error(detail);
  }

  return data as SeatingPlanResponse;
}

export async function importGuestsCsv(
  file: File,
  profile: string
): Promise<CsvImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("profile", profile);

  const res = await fetch(`${API_BASE_URL}/api/guests/import-csv`, {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as CsvImportResponse;

  if (!res.ok) {
    throw new Error(
      (data as any)?.detail ||
        `CSV import failed (${res.status}: ${res.statusText})`
    );
  }

  return data;
}

/**
 * Events API
 */

export async function fetchEvents(): Promise<EventSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/events`, {
    method: "GET",
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Failed to parse events response (${res.status} ${res.statusText}).`
    );
  }

  if (!res.ok) {
    const detail = (data as any)?.detail || `Failed to load events`;
    throw new Error(detail);
  }

  return data as EventSummary[];
}

export async function fetchEvent(id: number): Promise<EventDetail> {
  const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
    method: "GET",
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Failed to parse event response (${res.status} ${res.statusText}).`
    );
  }

  if (!res.ok) {
    const detail = (data as any)?.detail || `Failed to load event`;
    throw new Error(detail);
  }

  return data as EventDetail;
}

export async function saveEvent(payload: {
  name: string;
  profile: string;
  maxAttempts: number;
  seed: number | null;
  weights: Weights;
  guests: Guest[];
  tables: TableConfig[];
  lastResult: SeatingPlanResponse | null;
}): Promise<EventDetail> {
  const res = await fetch(`${API_BASE_URL}/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(
      `Failed to parse save-event response (${res.status} ${res.statusText}).`
    );
  }

  if (!res.ok) {
    const detail = (data as any)?.detail || `Failed to save event`;
    throw new Error(detail);
  }

  return data as EventDetail;
}
