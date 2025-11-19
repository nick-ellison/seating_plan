# Auto Seating Planner — Requirements Document

## 1. Purpose

This tool automatically generates optimised seating plans for events (weddings, dinners, corporate functions) using constraints such as:
- who must not sit together
- who prefers to sit together
- couples
- gender balance
- clustering singles
- table sizes and layouts

The goal is to reduce manual seating effort and resolve social / political seating challenges intelligently.

---

## 2. Users & Use Cases

### Primary Users
- People planning weddings or large dinners
- Event planners / coordinators
- Corporate event organisers

### Example Scenarios
| Scenario | User | Goal |
|----------|------|------|
| Wedding couple uploads guest list to auto-seat 150 guests | Bride / groom | Reduce stress & bias |
| HR team seats 300 delegates by department | Corporate | Mix teams & executives |
| Mother-of-the-bride enforces tensions | Family stakeholder | Avoid conflict |

---

## 3. Core Features (MVP)

### **3.1 Data Input**
- Upload guest list via CSV
- Manual entry in UI
- Validate missing names, gender, marital status

### **3.2 Seating Logic**
- Support circular + trestle tables
- Configurable number of tables and capacities
- Automatic seating generation based on scoring

### **3.3 Constraints**
| Type | Example |
|------|---------|
| Hard ("must not") | X not next to Y |
| Soft ("wants") | X prefers Y |
| Relationship-aware | Keep couples together / apart |
| Singles clustering | Increase adjacent single pairs |
| Gender alternation | Prefer M-F alternation but not required |

### **3.4 Output**
- Visual seating plan (rendered tables)
- Export as PDF + CSV
- Console / debug output
- Summary metrics

---

## 4. Objective Function (Scoring Priorities)

Current priority order:

1. **Minimise must-not violations**
2. **Maximise wants satisfied**
3. **Maximise adjacent singles**
4. **Maximise alternating tables**
5. **Maximise split couples** *(optional — may change to minimise)*

### Planned Enhancements
- Add weight sliders for each objective
- Allow toggling goals per event type (e.g. corporate vs wedding)

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Performance | Solve 200 guests in <5s |
| Platform | Web-first; mobile companion later |
| Data Privacy | No public indexing; deletable event data |
| Determinism | Seeding options to reproduce results |

---

## 6. Technical Design (Initial Concept)

### **Backend**
- Python (FastAPI)
- Seat solver as standalone service
- Future: GA / simulated annealing instead of random attempts

### **Frontend**
- React / Next.js
- Canvas-based drag-and-drop (Konva.js or Fabric.js)
- Real-time preview of score changes

### **Data Model**
```json
{
  "name": "Charlotte Ellison",
  "gender": "Female",
  "marital_status": "Married to Nick Ellison",
  "wants": ["Nick Ellison"],
  "must_not": ["John Ellison"],
  "tags": ["family", "top table", "vegan"]
}
