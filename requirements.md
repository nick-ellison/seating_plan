# Auto Seating Planner — Requirements Document

## 1. Purpose

This system generates optimised seating plans for events (weddings, corporate dinners, galas, conferences) using constraint-based logic. It reduces manual effort and resolves social/political seating challenges intelligently.

Key advantages:

- Avoids seating conflicts (ex-partners, politics, family drama)
- Optimises social outcomes (singles together, VIP clustering, networking)
- Automates large events dramatically faster than manual planning

---

## 2. Users & Use Cases

### Primary Users
- Wedding planners / venue coordinators
- Couples planning their own wedding
- Corporate event organisers
- Banqueting & hospitality managers

### Use Case Examples

| Scenario | User | Goal |
|----------|------|------|
| Seating 250 guests at a wedding | Bride & groom | Reduce stress, avoid family politics |
| Conference seating 400 by department | Corporate events team | Facilitate networking |
| Diplomatic banquet | Government protocol staff | Avoid adversarial pairings |
| Family reunion | Host | Group similar interests; reduce manual effort |

### Future Vertical Opportunities
- Indian weddings (very large tables, complex relationships)
- University formals & college halls
- Political, military, royalty protocol seating
- Cruise ships / onboard dining assignment
- Matchmaking / singles events

---

## 3. Core Features (MVP)

### 3.1 Data Input
- Upload guest list (CSV)
- Manual entry form
- Validation for missing gender, relationship data, duplicates

### 3.2 Table Layout Support
- Round tables
- Trestle / banquet (linear)
- Configurable number of tables & capacity

### 3.3 Seating Logic & Constraints

| Constraint Type | Example |
|----------------|---------|
| Hard (must not) | John must not sit next to Sarah |
| Soft (wants) | Nick prefers to sit next to Charlotte |
| Relationship-aware | Married couples together or apart |
| Singles clustering | Pairs singles to encourage mingling |
| Gender balance | Alternation preferred, not required |
| Groups / tags | Company, family, region, interests |

---

## 4. Scoring & Objective Function

Priority order:

1. Minimise must-not violations (hard constraint)
2. Maximise wants satisfied
3. Maximise adjacent singles
4. Maximise alternating tables
5. Configurable: minimise or maximise split couples

### Future Enhancements
- Weight sliders per constraint
- Scoring presets (Wedding, Corporate, Diplomatic, Singles Mixer)
- Genetic or annealing optimisation

---

## 5. Data Model (Conceptual)

Each guest record may include:

- id (unique identifier)
- name
- gender
- relationship descriptor (e.g., Married to Nick)
- wants_to_sit_next_to (list of IDs)
- must_not_sit_next_to (list of IDs)
- tags (family, company, VIP, dietary)

The representation can be stored in JSON, CSV, or DB schema.

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Performance | 300 guests solved in under 10 seconds |
| Determinism | Seeded runs produce reproducible results |
| Privacy | Full data deletion; no public indexing |
| Deployment | Web-first; containerised backend |
| Exportability | JSON, CSV, PDF |
| UX | Solver-first; manual override secondary |

---

## 7. Technical Architecture (Phased)

### Phase 1 — Solver Module
- Pure Python
- JSON in → JSON out
- CLI for local execution

### Phase 2 — Solver API
- FastAPI backend
- /solve endpoint returns seating + metrics

### Phase 3 — UI
- React/Next.js
- Drag-and-drop tables
- Live scoring updates

### Phase 4 — Persistence
- Save events, revisions, exports
- User accounts + auth

### Phase 5 — Collaboration
- Shareable links
- Role-based edits
- Change audit log

---

## 8. Future Extensions

| Feature | Motivation |
|---------|------------|
| Personality / interest clustering | Group compatible guests |
| Corporate networking mode | Auto-distribute professional groups |
| Venue system integration | Export directly to banqueting software |
| Drama mode | Sit problematic pairs together |
| Actual seat-number mapping | Match plan to physical chairs |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Constraints unsatisfiable | Provide conflict report & fallback plan |
| UI complexity | Build solver-first, add UI second |
| Competing apps | Differentiate via optimisation engine |
| Manual data entry overhead | Bulk import, auto-tagging, templates |

---

## 10. Commercial Strategy

| Market | Value | Customers |
|--------|-------|-----------|
| Weddings | High emotional + willingness to pay | Planners, venues, couples |
| Corporate events | Large recurring scale | Businesses, agencies |
| Universities | High volume, low ARPU | Student unions, halls |
| Diplomacy | Precision + protocol | Embassies, gov departments |

Business model options:

- SaaS subscription for planners
- Per-event pricing for individuals
- Licensing to venue/event software
- API access for enterprise workflows