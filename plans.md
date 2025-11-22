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
    
# **Iteration 7 — Save Events & Accounts (Persistence Layer)**

> _Goal: Move from a demo tool to a real product by enabling saving, reloading, and user ownership of events._

### **Backend**

-   Introduce **SQLite**, then migrate to **Postgres** once stable.
    
-   Database schema for:
    
    -   **Event** (name, type/profile, timestamps)
        
    -   **Guests** (all guest fields, attributes JSON)
        
    -   **Tables** (shape, capacity, names)
        
    -   **Weights** (full weight config per event)
        
    -   **Solver Results** (latest recommended plan)
        
-   Add minimal **User Accounts** (email + password or magic link; no roles yet)
    
-   Associate events with users (`user_id` foreign key)
    
-   Versioning: store **event revisions** (auto-saved on solver run)
    

### **Frontend**

-   “**My Events**” dashboard (list, search, open)
    
-   Create → Edit → Save workflow
    
-   Auto-save on:
    
    -   guest edits
        
    -   table edits
        
    -   weight changes
        
    -   solver runs
        
-   Ability to **duplicate** events
    

### **Outcome**

-   The app becomes a persistent planning tool rather than a one-off generator.
    
-   Precursor to billing, collaboration, and enterprise features.
    

# **Iteration 8 — Manual Overrides & Solver Integration**

> _Goal: Combine human judgment and algorithmic optimisation. Critical for real planners._

### **Frontend**

-   **Drag & drop guests** between seats
    
-   Visual indicators for:
    
    -   empty seats
        
    -   locked seats
        
    -   constraint violations
        
-   Add “**Lock seat**” toggle on a guest/table position
    
-   Undo / redo history (shallow version first)
    

### **Backend**

-   Extend solver ingestion to accept:
    
    -   `lockedSeats: { tableId, seatIndex, guestId }[]`
        
-   Solver must:
    
    -   honour all locked seats
        
    -   optimise remaining seats around them
        
-   Validation:
    
    -   detect conflicts between locked seats and constraints
        
    -   report unsatisfiable scenarios
        

### **Outcome**

-   Essential for wedding professionals, event planners, and venues.
    
-   Unlocks collaboration, reviews, and more accurate commercial plans.
    

# **Iteration 9 — Multi-Profile Support (Wedding → Corporate → Protocol)**

> _Goal: Expand beyond weddings and unlock paid verticals._

### **Backend**

Add profile configurations with:

-   different scoring priorities
    
-   different default weights
    
-   different CSV import adapters
    
-   different constraint behaviour (e.g., corporate networking cares about group mixing, not couples)
    

### **Initial Profiles**

1.  **Corporate Networking**
    
    -   Maximise cross-department adjacencies
        
    -   Ensure seniority spread across tables
        
    -   Optional icebreaker clustering (e.g., by interest tags)
        
2.  **Formal Protocol**
    
    -   VIP tiers
        
    -   Avoid rivalries / adversarial nations
        
    -   Head table logic
        
    -   Gender alternation stronger
        
3.  **Singles Mixer**
    
    -   Strong adjacency incentives
        
    -   Avoid clustering "already matched" pairs
        
    -   Rotate tables
        
4.  **Conference Group Mixing**
    
    -   Seat delegates to maximise cross-team contact
        
    -   Avoid same-company adjacency
        

### **Frontend**

-   Add **profile chooser**
    
-   Dynamically show/hide profile-appropriate fields
    
-   Load and save profile with each event
    

### **Outcome**

-   Product becomes multi-vertical instead of wedding-only.
    
-   Opens corporate and enterprise revenue streams.
    

# 12\. Brand Promise

ArrangeIQ delivers **intelligent**, **transparent**, and **precise** seating optimisation—balancing human relationships with mathematical clarity.


### **Top Priority — Core Product (MUST HAVE FOR MVP)**

-   Constraint-based solver (deterministic, weighted, seeded)
    
-   Multi-profile support (starting with wedding\_default)
    
-   CSV import & normalisation (wedding adapter)
    
-   Guest editing UI (inline table)
    
-   Table configuration UI (round/trestle, capacity, names)
    
-   JSON-driven solver request
    
-   Visual seating layout (SVG, round + trestle)
    
-   Weight sliders for constraints
    
-   Metrics dashboard (must-not, wants, gender, singles)
    
-   Conflict detection (must-not / capacity failures)
    
-   Manual overrides (drag seats, lock seat)
    
-   Re-run solver with locked seat constraints
    
-   Event save/load (database persistence)
    
-   Event duplication and versioning
    
-   User authentication (email + password)
    
-   Basic access control (own events only)
    
-   Printable/exportable seating layouts
    
-   CSV export (final seating plan)
    
-   Performance targets (250–300 guests under 5–10 seconds)
    

### **Second Priority — Commercial Foundations (NECESSARY TO SELL)**

-   Stripe billing integration (monthly, annual, per-event)
    
-   Free + paid tiers enforcement (limits on guests/events/features)
    
-   Billing portal & subscription management
    
-   Password reset + email verification
    
-   Save event revisions (version history)
    
-   Audit log (changes to seats, guests, tables)
    
-   Admin dashboard (users, events, billing status)
    
-   Rate limiting + API protection
    
-   Pseudonymisation/data deletion tooling (GDPR)
    
-   Logs + error tracing (Sentry)
    
-   Usage analytics (MAU, DAU, conversions)
    
-   Hosting infrastructure (Docker, HTTPS, scaling)
    

### **Third Priority — Premium Product Features (DRIVES UPSELL)**

-   Drag-and-drop full seating editor
    
-   Seat locking + solver respecting manual placements
    
-   “Why this seat?” reasoning panel
    
-   Constraint graph visualization (wants/must-not)
    
-   Highlight conflicts live in UI
    
-   Group seating: families, teams, departments
    
-   Multiple solver profiles:
    
    -   corporate\_networking
        
    -   diplomatic\_protocol
        
    -   singles\_event
        
    -   gala\_formal
        
-   Custom profile builder (pros only)
    
-   Advanced exports (PDF packaged layouts)
    
-   Event notes and collaboration comments
    
-   Multi-table overview showing unbalanced tables
    
-   Bulk editing tools: auto-tagging, find/replace tags
    
-   Venue mode: seat-number → physical chair mapping
    

### **Fourth Priority — Professional/Planner Features (FOR AGENCY CUSTOMERS)**

-   Multi-user collaboration
    
-   Real-time collaboration (like Figma/Notion)
    
-   Role-based permissions (Owner / Planner / Viewer)
    
-   Planner dashboard: manage multiple client events
    
-   Client-safe sharing links (read-only)
    
-   White-label PDF exports with planner branding
    
-   Copy event templates (wedding, gala, corporate)
    
-   Upload floorplans (venue maps)
    
-   Assign physical table positions in venue map
    
-   Mobile/tablet layout editor
    
-   Offline support for field use at venues
    

### **Fifth Priority — Enterprise / API / Integrations**

-   Public API with API keys
    
-   Webhooks (event solved, guest updated)
    
-   SSO / SAML for enterprises
    
-   Integration with banqueting systems (Opera, Delphi)
    
-   CRM integration for guest lists (Salesforce, HubSpot)
    
-   Bulk event import/export
    
-   Data residency options (EU/US regions)
    
-   On-premise or private-cloud deployment
    
-   Dedicated enterprise support SLAs
    
-   Full audit logging + immutable event store
    

### **Sixth Priority — Marketing, Growth & Product Layer**

-   Marketing site with conversion flow
    
-   SEO-optimised landing pages per vertical
    
-   Pricing page & plan comparison
    
-   Blog + “seating optimisation insights” content
    
-   Guided onboarding (tutorial, tooltips)
    
-   Feature adoption tracking
    
-   Email flows:
    
    -   welcome series
        
    -   trial expiry
        
    -   abandoned events
        
    -   upsell nudges
        
-   Case studies (weddings, corporate, diplomatic)
    
-   Social shareable seating visual exports
    

### **Seventh Priority — Long-Term Innovation & Differentiation**

-   Personality / interest clustering for matchmaking
    
-   AI-assisted data cleaning (optional, transparent)
    
-   “Drama mode” (intentionally place adversarial pairs)
    
-   Automatic seat suggestions during manual edits
    
-   Heatmaps of social compatibility
    
-   Adaptive solver modes (annealing, genetic selection)
    
-   Predictive “event-time seating changes” engine
    
-   Guest self-check-in → seat assignment adjustments
    
-   Learning over time (profile refinement per planner)