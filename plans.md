# Development Plan — Auto Seating Planner (Updated)

This plan reflects the refined product vision:

- Solver-first; wedding logic as one profile
- Generic data model using `attributes` and `profile`
- UI + API layers must not assume weddings by default
- CSV import treated as a wedding adapter, not the core data interface

---

## Iteration 1 — Solver Module (Standalone)

**Goal:** Extract core seating engine into reusable Python package with CLI + tests.

**Deliverables:**

- `backend/seating_solver/` directory containing:
  - Models: `Guest`, `Table`, `SeatingPlan`, `Metrics`
  - `solve(guests, tables, profile="wedding_default", weights=None, max_attempts=1000, seed=None)`
  - Guests include `attributes: dict`
  - `profile` accepted even if only `"wedding_default"` is implemented

- CLI runner:
  `python -m seating_solver input.json`

- Unit tests covering:
  - must-not enforcement
  - wants satisfied
  - adjacent singles
  - alternating tables
  - deterministic seeds
  - guests with arbitrary attributes (e.g., `{"department": "Sales"}`)

**Outcome:** Solver works independently of UI/CSV and does not assume weddings.

---

## Iteration 2 — Solver API (FastAPI)

**Goal:** Expose solver over HTTP.

**Deliverables:**

- FastAPI app in `backend/app/main.py`
- Pydantic models:
  - `GuestIn` (includes `attributes`)
  - `TableIn`
  - `GenerateRequest` (includes `profile`)
  - `SeatingPlanOut`

- Endpoints:
  - `POST /api/seating/generate`
  - `GET /api/health`

- API tests using `pytest` + `httpx`

**Outcome:** Seating can be solved via curl/Postman without UI.

---

## Iteration 3 — Minimal Frontend (Developer UI)

**Goal:** Simple UI to hit the API.

**Deliverables:**

- Basic Next.js app
- One page containing:
  - JSON editor or sample request button
  - Button “Generate seating”
  - Pretty-print seating plan and metrics
  - Profile dropdown (only `"wedding_default"` initially)

**Outcome:** Full request → solve → display loop.

---

## Iteration 4 — CSV Import + Validation (Wedding Adapter)

**Goal:** Work with real CSV guest lists.

**Backend:**

- `POST /api/guests/import-csv`
- Maps spreadsheet columns to `Guest` model
- Should be stored in:
  `backend/app/importers/wedding_csv.py`

**Frontend:**

- Upload CSV
- Show guest table (editable)
- Show warnings
- Export CSV

**Rule:**
- Parsing is profile-specific; solver input stays generic.

**Outcome:** Supports real-world workflows without wedding logic leaking into solver.

---

## Iteration 5 — Visual Seating Layout

**Goal:** Graphical rendering of tables.

**Deliverables:**

- SVG-based seat rendering
- Round tables using polar coordinates
- Trestle layout using rows
- Optional badges:
  - Single
  - Couple
  - Constraint warnings
  - Display tags/attributes optionally

**Outcome:** Human-readable seating plan.

---

## Iteration 6 — Weights & UX Controls

**Goal:** Allow the user to steer optimisation.

**Deliverables:**

- Sliders for constraint weighting
- UI structured around `profile` + `weights`
- Metrics panel shown live

**Outcome:** Configurable optimisation rather than fixed rules.

---

## Iteration 7 — Save Events & Persistence

**Goal:** Store and reload past events.

**Deliverables:**

- Database storage (SQLite initially, Postgres later)
- Persist:
  - guests
  - constraints
  - table config
  - solver results
  - weight settings
  - profile name

**Outcome:** Usable as a real system, not a one-off tool.

---

## Iteration 8 — Manual Overrides & Re-run

**Goal:** Blend automation + manual control.

**Deliverables:**

- Drag guests between seats
- Lock seats
- Re-run solver while respecting manual placements

**Outcome:** Human edits integrated with algorithmic optimisation.

---

## Iteration 9 — Additional Seating Profiles

**Goal:** Expand beyond weddings.

**Candidate profiles:**

- `corporate_networking`
- `formal_protocol`
- `singles_event`
- `conference_teams`

Each profile defines:
- different scoring priorities
- different behavioural defaults

**Outcome:** Multi-vertical product.

---

