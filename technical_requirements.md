# Technical Requirements — Auto Seating Planner (MVP)

This document defines the technical implementation of the four core MVP feature groups:

1. Data Input  
2. Seating Logic  
3. Constraints  
4. Output  

---

## 1. Architecture (High Level)

**Frontend (Web)**  
- Stack: React / Next.js (or similar).  
- Responsibilities:
  - Upload guest list (CSV).
  - Manual guest editing.
  - Table configuration (shape, capacity, count).
  - Trigger “Generate seating”.
  - Visual seating layout.
  - Export options (CSV and print-friendly view).

**Backend (API)**  
- Stack: Python (FastAPI or similar).  
- Responsibilities:
  - Parse and validate CSV.
  - Store guests and table configuration for an event.
  - Run seating solver with specified weights/attempts.
  - Return seating plan + metrics as JSON.

**Solver Core**  
- Pure Python module.  
- Stateless function:
    solve(guests, tables, weights, max_attempts, seed=None) -> seating_plan  
- Used by the API and can also be run via CLI for debugging.

---

## 2. Data Model

### 2.1 Guest

Fields:

- `id`: string (UUID).
- `name`: string.
- `gender`: "Male" | "Female" | "Other" | null.
- `maritalStatus`: string or null  
  Examples: `"Married to Nick Ellison"`, `"Single"`.
- `wantsToSitNextTo`: list of guest IDs.
- `mustNotSitNextTo`: list of guest IDs.
- `tags`: list of strings (e.g. `"family"`, `"vegan"`, `"VIP"`).

Example (TypeScript style):

    Guest {
      id: string;
      name: string;
      gender: "Male" | "Female" | "Other" | null;
      maritalStatus: string | null;
      wantsToSitNextTo: string[];   // guest IDs
      mustNotSitNextTo: string[];   // guest IDs
      tags: string[];
    }

### 2.2 Table

Fields:

- `id`: string.
- `name`: string (e.g. `"Table 1"`).
- `shape`: `"round"` or `"trestle"`.
- `capacity`: number (max seats).

Example:

    Table {
      id: string;
      name: string;
      shape: "round" | "trestle";
      capacity: number;
    }

### 2.3 Seating Plan Output

Per seat:

- `seatIndex`: number (0-based index around the table).
- `guestId`: string.

Per plan:

- `tables`: list of:
  - `tableId`: string.
  - `seats`: list of `{ seatIndex, guestId }`.
- `metrics`:
  - `mustNotViolations`: number.
  - `wantsSatisfied`: number.
  - `adjacentSingles`: number.
  - `sameGenderAdjacencies`: number.
  - `alternatingTables`: number.
  - `splitCouples`: number.
- `attemptsMade`: number (how many attempts the solver ran).

Example shape:

    SeatingPlan {
      tables: {
        tableId: string;
        seats: { seatIndex: number; guestId: string; }[];
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
    }

---

## 3. Feature 3.1 — Data Input

### 3.1.1 CSV Upload

**Expected columns (MVP):**

- `Name`
- `Gender`
- `Marital_Status`
- `Wants to sit next to`
- `Must not sit next to`

**Behaviour:**

- Parse CSV rows into `Guest` objects.
- Normalise gender values (e.g. `"M"`, `"male"` → `"Male"`).
- Parse `Marital_Status` and detect patterns like `"Married to X"`.
- For `Wants to sit next to` and `Must not sit next to`:
  - Accept comma-separated names.
  - Resolve those names to guest IDs after all guests are loaded.

**Validation:**

- `Name` is required and non-empty.
- Duplicate names → warning (but not fatal).
- Unknown names in wants/must-not fields → warning.
- Missing or invalid gender → warning.

**API endpoint:**

- `POST /api/guests/import-csv`
- Request: multipart/form-data with `file` field.
- Response JSON:
  - `guests`: list of Guest objects (with IDs).
  - `warnings`: list of warning strings.

### 3.1.2 Manual Entry (Frontend)

Requirements:

- UI showing guests in a table:
  - Add / edit / delete guests.
  - Edit `wants` and `must-not` via dropdown of other guests.
- Inline validation:
  - Missing name → error.
  - Invalid gender → soft warning.
- Button to export current guests as CSV.

### 3.1.3 Validation Function (Backend)

Conceptual signature:

    validate_guests(guests: list[Guest]) -> list[str]

Checks:

- Duplicate names.
- Wants/must-not references that don’t match any guest.
- Empty guest list edge case.
- If tables are defined: warn if `len(guests) > sum(table.capacity)`.

---

## 4. Feature 3.2 — Seating Logic

### 4.2.1 Table Handling

- Internally, both `"round"` and `"trestle"` tables are modelled as a circular list of seats.
- Neighbours of seat `i` are:
  - `(i - 1) mod n`
  - `(i + 1) mod n`
- Geometry (circle vs rectangle) is handled only in the frontend visual layer.

### 4.2.2 Configurable Tables

Frontend:

- UI to configure:
  - number of tables,
  - shape per table,
  - capacity per table,
  - optional table names.

Backend:

- Before solving:
  - Ensure `sum(capacity) >= number_of_guests`.
  - Derive actual table sizes (e.g. 39 guests over two 20-seat tables → sizes `[20, 19]`).

### 4.2.3 Seating Generation API

Endpoint:

- `POST /api/seating/generate`

Request JSON:

- `guests`: list of Guest.
- `tables`: list of Table.
- `maxAttempts`: integer (e.g. 1000 / 5000).
- `weights`: object with numeric weights for:
  - `mustNot`
  - `wants`
  - `adjacentSingles`
  - `alternating`
  - `splitCouples`
- `seed`: optional integer for deterministic runs.

Response JSON:

- `plan`: a `SeatingPlan` object as defined above.

Solver behaviour:

- Runs up to `maxAttempts` candidate seatings.
- Uses scoring priorities (see section 5) to pick the best plan.
- If total capacity is insufficient:
  - Return an error JSON with a clear message (e.g. `"Too many guests for available tables"`).
- Do not silently drop guests.

---

## 5. Feature 3.3 — Constraints and Scoring

### 5.1 Scoring Priorities

Overall priority order (lexicographic):

1. Minimise `mustNotViolations`.
2. Maximise `wantsSatisfied`.
3. Maximise `adjacentSingles`.
4. Maximise `alternatingTables`.
5. Maximise `splitCouples` (this can later be inverted for “keep couples together”).

This translates into a scoring tuple in the solver like:

    score = (
      mustNotViolations,
      -wantsSatisfied,
      -adjacentSingles,
      -alternatingTables,
      -splitCouples
    )

Lower `score` is better.

### 5.2 Constraint Definitions

- **Must-not violation**:  
  Two adjacent guests where one’s `mustNotSitNextTo` includes the other (or vice versa).

- **Want satisfied**:  
  Guest A’s `wantsToSitNextTo` includes B and B is either left or right neighbour.

- **Adjacent singles**:  
  Both neighbours have `maritalStatus == "Single"`.

- **Alternating table**:  
  For all neighbours around the table, genders differ (`Male` vs `Female`).  
  (MVP: treat `Other` or null as breaking alternation.)

- **Split couples**:  
  A pair of guests linked via `"Married to X"` are seated at different tables.

Couple detection is performed during guest import by parsing `maritalStatus`.

---

## 6. Feature 3.4 — Output

### 6.1 Visual Seating Plan (Frontend)

Requirements:

- For each table:
  - Draw a circle (round) or rectangle (trestle).
  - Place seat labels around it in the correct order.
- Each seat label displays:
  - guest name,
  - small badges (optional) e.g.:
    - S = Single
    - ♥ = couple
    - ⚠️ = any must-not constraint nearby.

Interactions:

- Hover: show tooltip with full guest details and constraints.
- Click: highlight a guest and their immediate neighbours.

Canvas options: Konva.js / Fabric.js / SVG; choice is an implementation detail.

### 6.2 Export

CSV export:

- Frontend transforms the `SeatingPlan` into rows with columns:
  - `Table Name`
  - `Seat Index`
  - `Guest Name`
  - `Gender`
  - `Marital_Status`

Print / PDF:

- Provide a “Print layout” page with tables arranged clearly.
- Rely on the browser’s “Print to PDF” for MVP.

### 6.3 Debug / Developer Output

- Enable a debug mode (e.g. `debug=true` query parameter).
- When enabled:
  - Backend includes a per-table textual listing:

        Seat | Name | Left neighbour | Right neighbour

  - Logs final metrics and score for tuning.

---

## 7. Non-Functional Requirements

- **Performance**  
  - Target: ≤ 3 seconds wall-clock time for 200 guests and 1000 attempts on typical server hardware.

- **Determinism**  
  - If `seed` is supplied, the same input should always yield the same seating plan.

- **Error handling**  
  - Clear API errors for:
    - invalid CSV format,
    - missing required fields,
    - insufficient table capacity.

- **Logging**  
  - Log:
    - number of guests,
    - number of tables,
    - `maxAttempts`,
    - `attemptsMade`,
    - final metrics.

---
