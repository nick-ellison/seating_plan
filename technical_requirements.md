# Technical Requirements — Auto Seating Planner (MVP)

This document defines the technical implementation of the core MVP feature groups:

1. Data Input  
2. Seating Logic  
3. Constraints  
4. Output  

MVP focuses on wedding-style events, but the architecture must support other event types (corporate dinners, networking events, diplomatic seating) without redesigning the core solver.

---

## 1. Architecture (High Level)

### Frontend (Web)

- Stack: React / Next.js (or similar)
- Responsibilities:
  - Upload guest list (CSV)
  - Manual guest editing
  - Table configuration (shape, capacity, count)
  - Trigger “Generate seating”
  - Visual seating layout
  - Export: CSV and print-friendly output

### Backend (API)

- Stack: Python (FastAPI or similar)
- Responsibilities:
  - Parse and validate CSV
  - Store guests and table configuration for an event
  - Run seating solver with specified weights and attempts
  - Return seating plan and metrics as JSON
  - Support different profiles in future (wedding, corporate, networking)

### Solver Core

- Pure Python module
- Stateless function:

  solve(guests, tables, weights, max_attempts, seed=None) -> seating_plan

- Used by both API and CLI
- General-purpose constraint optimisation engine, not wedding-specific

---

## 2. Data Model

### 2.1 Guest

Fields:

- id: string (UUID)
- name: string
- gender: "Male" | "Female" | "Other" | null
- maritalStatus: string or null (e.g., "Married to Nick Ellison", "Single")
- wantsToSitNextTo: list of guest IDs
- mustNotSitNextTo: list of guest IDs
- tags: list of strings (e.g., family, vegan, VIP)
- attributes: key–value map for arbitrary metadata (e.g., department, team, role, dietary requirements)

Example conceptual shape:

Guest {
  id: string
  name: string
  gender: "Male" | "Female" | "Other" | null
  maritalStatus: string | null
  wantsToSitNextTo: string[]
  mustNotSitNextTo: string[]
  tags: string[]
  attributes: { [key: string]: any }
}

### 2.2 Table

Fields:

- id: string
- name: string (e.g., "Table 1")
- shape: "round" or "trestle" (extensible to additional shapes)
- capacity: number (max seats)

Example:

Table {
  id: string
  name: string
  shape: "round" | "trestle"
  capacity: number
}

### 2.3 Seating Plan Output

Per seat:

- seatIndex: number (0-based index)
- guestId: string

Per plan:

- tables[]:
  - tableId
  - seats[] of { seatIndex, guestId }
- metrics:
  - mustNotViolations
  - wantsSatisfied
  - adjacentSingles
  - sameGenderAdjacencies
  - alternatingTables
  - splitCouples
- attemptsMade: number
- profileUsed: optional string

Example conceptual shape:

SeatingPlan {
  tables: {
    tableId: string
    seats: { seatIndex: number, guestId: string }[]
  }[]
  metrics: {
    mustNotViolations: number
    wantsSatisfied: number
    adjacentSingles: number
    sameGenderAdjacencies: number
    alternatingTables: number
    splitCouples: number
  }
  attemptsMade: number
  profileUsed?: string
}

---

## 3. Feature 3.1 — Data Input

### 3.1.1 CSV Upload

Expected columns (initial format):

- Name  
- Gender  
- Marital_Status  
- Wants to sit next to  
- Must not sit next to

Behaviour:

- Parse rows into Guest objects
- Normalise genders
- Detect patterns like “Married to X”
- Resolve names in wants/must-not lists to guest IDs

Validation:

- Missing name → error
- Duplicate name → warning
- Unknown references → warning
- Gender missing → allowed, but warns (null used)

API endpoint:

POST /api/guests/import-csv

Response JSON:

- guests[]
- warnings[]

Note: This is the initial schema; future CSV formats may differ per event type.

### 3.1.2 Manual Entry (Frontend)

- Add/edit/delete guests
- Dropdown selection for wants/must-not
- Inline validation
- Export back to CSV

### 3.1.3 Guest Validation (Backend)

validate_guests(guests: list[Guest]) -> list[str]

Checks:

- duplicates
- unresolved references
- empty list
- insufficient seating capacity (if tables defined)

---

## 4. Feature 3.2 — Seating Logic

### 4.2.1 Table Handling

- All tables modelled as circular seating lists
- Neighbours of index i:
  - (i - 1) mod n
  - (i + 1) mod n
- Shape affects visual layout only

### 4.2.2 Configurable Tables

Frontend:

- Set number of tables, shape, name, capacity

Backend:

- Validate total capacity >= number of guests
- If uneven distribution needed, compute final table sizes automatically

### 4.2.3 Seating Generation API

POST /api/seating/generate

Request JSON:

- guests[]
- tables[]
- maxAttempts
- weights:
  - mustNot
  - wants
  - adjacentSingles
  - alternating
  - splitCouples
- seed (optional)
- profile (optional, default wedding)

Response:

- plan (SeatingPlan)

Behaviour:

- Runs up to maxAttempts seatings
- Uses scoring tuple (section 5)
- Returns first-best result
- Never drops guests silently

---

## 5. Feature 3.3 — Constraints and Scoring

### 5.1 Scoring Priorities (Default Wedding Profile)

Priority order:

1. Minimise mustNotViolations  
2. Maximise wantsSatisfied  
3. Maximise adjacentSingles  
4. Maximise alternatingTables  
5. Maximise splitCouples (may invert for other profiles)

Tuple example:

(
  mustNotViolations,
  -wantsSatisfied,
  -adjacentSingles,
  -alternatingTables,
  -splitCouples
)

Future versions may redefine tuples based on event type.

### 5.2 Constraint Definitions

- Must-not violation: adjacent guests who appear in each other's mustNotSitNextTo list.
- Want satisfied: neighbour relationship matches wantsToSitNextTo.
- Adjacent singles: both neighbours have maritalStatus equal to “Single”.
- Alternating table: no two adjacent guests share gender Male/Female (Other/null breaks alternation).
- Split couples: pair marked by "Married to X" seated at different tables.

---

## 6. Feature 3.4 — Output

### 6.1 Visual Seating Plan (Frontend)

- Draw tables according to shape
- Place guests according to seatIndex
- Badges for Singles / Couples / Warnings
- Hover + click to inspect connections

### 6.2 Exports

CSV export:

- Table Name
- Seat Index
- Guest Name
- Gender
- Marital_Status

Print/PDF:

- Render layout in browser
- Use native Print to PDF

### 6.3 Debug Output

- Debug mode showing:
  - Seat | Name | Left neighbour | Right neighbour
  - Scoring + metrics
  - Attempts made

---

## 7. Non-Functional Requirements

- Performance:
  - 200 guests, 1000 attempts in < 3 seconds on typical server hardware
- Determinism:
  - seed produces repeatable output
- Error handling:
  - invalid CSV
  - unresolved constraints
  - insufficient capacity
- Logging:
  - number of guests
  - number of tables
  - maxAttempts + attemptsMade
  - metrics
  - profileUsed
- Extensibility:
  - New scoring profiles and metrics should be addable without structural rewrites

