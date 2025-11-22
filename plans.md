# ✅ **ArrangeIQ — Complete Product, Brand & Technical Specification**

### _Master Document (Markdown)_

# 1\. Brand Overview

## 1.1 Essence

**Tagline:**  
**The Intelligent Seating Engine**

**Purpose**  
ArrangeIQ solves complex seating problems using transparent, tunable optimisation — not black-box AI.

**Vision**  
To become the world’s most trusted seating logic engine for weddings, corporate dinners, conferences, galas, and diplomatic events.

**Positioning**  
A professional-grade, solver-first seating engine driven by explicit constraints, user-configurable weights, and deterministic logic.

## 1.2 Personality

ArrangeIQ is:

-   **Intelligent** — algorithmic, not arbitrary
    
-   **Professional** — built for planners, venues, corporates, government
    
-   **Modern** — crisp SaaS aesthetic
    
-   **Approachable** — clarity without jargon
    
-   **Reliable** — deterministic scoring, explainable output
    

**Tone:** Calm, confident, concise.

## 1.3 Messaging

**Primary Message:**  
ArrangeIQ intelligently and transparently optimises seating for any event.

**Supporting:**

-   Optimises relationships, preferences, and logistics
    
-   Fully explainable scoring and constraints
    
-   Reproducible output via seeds
    
-   Adjust solver behaviour via intuitive weights
    
-   Works across multiple verticals (weddings → diplomacy)
    

**Value Pillars:**

1.  **Accuracy** — Put the right people in the right places
    
2.  **Efficiency** — Reduce hours of manual effort
    
3.  **Confidence** — Avoid social or political mistakes
    
4.  **Flexibility** — Configurable profiles + weights
    
5.  **Professionalism** — Produces venue-ready plans
    

## 1.4 Visual Identity

**Design principles:**

-   Minimalist
    
-   Geometric
    
-   Modern
    
-   Softer human edge
    

**Logo directions:**

-   Stylised **A** or **IQ**
    
-   Circular seating grid
    
-   Lattice/optimisation structure
    

**Colours:**  
Midnight blue, teal accents, slate greys, white.

**Typography:**  
Inter for UI + body text, optional display font for hero sections.

# 2\. Commercial Vision

## 2.1 Why “No AI” is a Feature

Competitors claiming AI have disadvantages:

-   Lack of explainability
    
-   Non-deterministic output
    
-   Users cannot understand _why_ someone is placed somewhere
    
-   Potential bias
    
-   Impossible to audit for diplomacy or corporates
    

ArrangeIQ’s solver is:

-   Deterministic
    
-   Transparent
    
-   Weight-configurable
    
-   Auditable
    
-   Governable
    

→ This positions ArrangeIQ as **the safe, professional alternative to AI-chaos**.

## 2.2 Monetisation Model

### Free Tier

-   Up to 40 guests
    
-   No persistence
    
-   Basic metrics
    

### Pro Tier

-   Unlimited guests
    
-   Save/load events
    
-   Weight sliders
    
-   Exports (CSV, PDF)
    
-   Multiple profiles
    

### Planner / Venue Tier

-   Team accounts
    
-   Unlimited events
    
-   White-label exports
    
-   API for venue CRM
    

### Enterprise Protocol Tier

-   Diplomatic / government seating rules
    
-   Dedicated solver instances
    
-   Compliance contracts
    

# 3\. Requirements & Use Cases

## 3.1 Purpose

To generate optimised seating plans using constraint-based logic that balances relationships, preferences, politics, and social outcomes.

## 3.2 Users

-   Wedding planners
    
-   Couples
    
-   Corporate events teams
    
-   Banqueting managers
    
-   Diplomatic protocol officers
    

## 3.3 Example Use Cases

Scenario

Goal

Wedding with 250 guests

Avoid family politics, seat couples intelligently

Corporate dinner

Encourage networking by department

Diplomatic banquet

Avoid adversarial pairings

College formals

Organise by year/group

Singles event

Maximise meaningful clustering

Future Opportunities:

-   Indian weddings (very large tables)
    
-   Cruise ship dining systems
    
-   University halls
    
-   Military/state protocol
    

# 4\. Core Features

## 4.1 Data Input

-   CSV upload
    
-   Manual editing
    
-   Validation: duplicates, unresolved references, missing data
    

### CSV Format (Wedding Default)

-   Name
    
-   Gender
    
-   Marital\_Status
    
-   Wants to sit next to
    
-   Must not sit next to
    

Backend resolves names → IDs.

## 4.2 Table Layout

-   Round tables (circular adjacency)
    
-   Trestle tables (linear adjacency)
    
-   Configurable shapes, names, capacities
    
-   Future: U-shape, horseshoe, custom
    

## 4.3 Seating Logic & Constraints

Constraint

Description

**Must not sit next to**

Hard social restrictions

**Wants to sit next to**

Positive adjacency preference

**Couples handling**

Penalty for splitting (or encourage split in some profiles)

**Adjacency of singles**

Encourage singles clustering

**Gender alternation**

Soft preference for balance

**Side-based mixing**

Bride/Groom, Company A/B

**Tags & attributes**

Family, team, VIP, department

# 5\. Scoring Engine

## 5.1 Default Weight-Based Scoring

Lowest score wins.

```
Score = (
    mustNotWeight           * mustNotViolations,
   -wantsWeight             * wantsSatisfied,
   -adjacentSinglesWeight   * adjacentSingles,
   -sameGenderAdjWeight     * sameGenderAdjacencies,
   -alternatingTablesWeight * alternatingTables,
    splitCouplesWeight      * splitCouples   # +ve or -ve based on profile
)
```

## 5.2 Priorities (Wedding Default)

1.  Minimise must-not violations
    
2.  Maximise wants
    
3.  Encourage singles adjacency
    
4.  Encourage alternating gender
    
5.  Penalise split couples
    

# 6\. Data Models

## 6.1 Guest

```json
{
  "id": "g1",
  "name": "Charlotte",
  "gender": "Female",
  "maritalStatus": "Married to Nick",
  "wantsToSitNextTo": ["g1"],
  "mustNotSitNextTo": [],
  "tags": ["VIP"],
  "attributes": {
    "side": "bride",
    "department": "Legal"
  }
}
```

## 6.2 Table

```json
{
  "id": "t1",
  "name": "Table 1",
  "shape": "round",
  "capacity": 10
}
```

## 6.3 Seating Plan Output

```json
{
  "tables": [
    {
      "tableId": "t1",
      "seats": [
        { "seatIndex": 0, "guestId": "g1" }
      ]
    }
  ],
  "metrics": {
    "mustNotViolations": 0,
    "wantsSatisfied": 1,
    "adjacentSingles": 0,
    "sameGenderAdjacencies": 1,
    "alternatingTables": 1,
    "splitCouples": 0
  },
  "attemptsMade": 214,
  "profileUsed": "wedding_default"
}
```

# 7\. Architecture

## 7.1 Global Architecture

```
Next.js Frontend
      ↓
FastAPI Backend
      ↓
Python Solver (pure, stateless, deterministic)
```

## 7.2 Frontend

-   React / Next.js
    
-   CSV upload & export
    
-   Guest editor
    
-   Table config UI
    
-   Weight sliders
    
-   SVG seating visualization
    

## 7.3 Backend (FastAPI)

-   `/api/seating/generate`
    
-   `/api/guests/import-csv`
    
-   `/api/health`
    
-   Does **not** contain seating logic — delegates to solver
    

## 7.4 Python Solver

-   Stateless
    
-   No wedding assumptions
    
-   Profiles control scoring priorities
    
-   Deterministic with optional seed
    

# 8\. Visual Output

-   Round and trestle SVG tables
    
-   Seat arcs / positions
    
-   Guest colours by gender
    
-   Tooltips showing attributes/tags
    
-   Debug modes showing adjacency pairs
    

Exports:

-   CSV
    
-   Browser-based PDF
    
-   Future: vector PDF generation
    

# 9\. Non-Functional Requirements

Requirement

Target

Solve speed

300 guests < 10 seconds

Determinism

Seed produces repeatability

Privacy

All data deletable; no AI storage

Extensibility

Profiles fully modular

Reliability

Solver never drops guests silently

# 10\. Risks & Mitigations

Risk

Mitigation

Unsatisfiable constraints

Solver returns conflict report

UX overwhelm

Keep solver-first; UI layered gradually

Competitors using AI

Market “transparent optimisation, not AI”

Manual data entry pain

CSV mapping, templates, autofill

# 11\. Development Roadmap (Merged & Updated)

## **Iteration 1 — Solver Module (Standalone)**

-   Core models
    
-   `solve()`
    
-   CLI
    
-   Unit tests
    

## **Iteration 2 — FastAPI Solver API**

-   `/generate` + `/health`
    
-   Weight support
    
-   Profile field
    

## **Iteration 3 — Minimal Frontend**

-   JSON editor
    
-   Generate button
    
-   Raw output viewer
    

## **Iteration 4 — CSV Import (Wedding Adapter)**

-   CSV parsing
    
-   Validation
    
-   Guests table editor
    

## **Iteration 5 — Visual Seating (SVG)**

-   Round & trestle
    
-   Tooltips
    
-   Colouring
    

## **Iteration 6 — Weight Controls**

-   Slider-driven optimisation
    
-   Live metrics panel
    

## **Iteration 7 — Save Events**

-   SQLite → Postgres
    
-   Event model (guests, weights, tables, results)
    
-   List & load events
    

## **Iteration 8 — Manual Overrides**

-   Drag & drop guests
    
-   Locking mechanism
    
-   Re-run solver respecting frozen seats
    

## **Iteration 9 — Additional Profiles**

-   Corporate networking
    
-   Formal protocol
    
-   Singles mixer
    
-   Conference group mixing
    

# 12\. Brand Promise

ArrangeIQ delivers **intelligent**, **transparent**, and **precise** seating optimisation—balancing human relationships with mathematical clarity.