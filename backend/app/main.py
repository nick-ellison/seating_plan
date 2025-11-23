# app/main.py
from __future__ import annotations

import json
import logging
from typing import List, Optional

from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Depends,
    Path,
    Query,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from seating_solver.solver import solve, seating_plan_to_dict

from app.schemas import (
    GenerateRequest,
    SeatingPlanOut,
    CsvImportResponse,
    EventCreate,
    EventUpdate,
    EventSummary,
    EventDetail,
    GuestIn,
    TableIn,
    WeightConfig,
)
from app.converters import (
    guest_in_to_solver,
    table_in_to_solver,
    seating_plan_dict_to_out,
)
from app.importers.wedding_csv import parse_wedding_csv
from app.database import Base, engine, get_db
from app.event_models import Event

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create tables on startup (MVP)
Base.metadata.create_all(bind=engine)

tags_metadata = [
    {"name": "health", "description": "Health and status checks."},
    {"name": "seating", "description": "Generate optimised seating plans"},
    {"name": "csv", "description": "CSV import for guest lists"},
    {"name": "events", "description": "Save and load events"},
]

app = FastAPI(
    title="ArrangeIQ Seating API",
    description=(
        "API for generating optimised seating plans for weddings, "
        "corporate events and complex dinners."
    ),
    version="0.1.0",
    contact={
        "name": "ArrangeIQ",
        "url": "https://arrangeiq.app",
        "email": "support@arrangeiq.app",
    },
    openapi_tags=tags_metadata,
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Small helpers
# -----------------------------

def _validate_guests_and_tables(
    guests: List[GuestIn],
    tables: List[TableIn],
) -> None:
    """
    Basic validation for events:
      - at least one guest and one table
      - total capacity >= number of guests
    """
    if not guests:
        raise HTTPException(
            status_code=400,
            detail="Event must contain at least one guest.",
        )
    if not tables:
        raise HTTPException(
            status_code=400,
            detail="Event must contain at least one table.",
        )

    total_capacity = sum(t.capacity for t in tables)
    if total_capacity < len(guests):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Total table capacity ({total_capacity}) "
                f"is less than guest count ({len(guests)})."
            ),
        )


# -----------------------------
# Internal helpers
# -----------------------------

def _event_to_detail_schema(db_event: Event) -> EventDetail:
    from app.schemas import GuestIn, TableIn, WeightConfig, SeatingPlanOut, MetricsOut

    guests_raw = json.loads(db_event.guests_json)
    tables_raw = json.loads(db_event.tables_json)
    weights_raw = json.loads(db_event.weights_json) if db_event.weights_json else None
    plan_raw = json.loads(db_event.last_plan_json) if db_event.last_plan_json else None

    guests = [GuestIn(**g) for g in guests_raw]
    tables = [TableIn(**t) for t in tables_raw]
    weights = WeightConfig(**weights_raw) if weights_raw else None
    result = SeatingPlanOut(**plan_raw) if plan_raw else None

    metrics = None
    if db_event.must_not_violations is not None:
        metrics = MetricsOut(
            mustNotViolations=db_event.must_not_violations or 0,
            wantsSatisfied=db_event.wants_satisfied or 0,
            adjacentSingles=db_event.adjacent_singles or 0,
            sameGenderAdjacencies=db_event.same_gender_adjacencies or 0,
            alternatingTables=db_event.alternating_tables or 0,
            splitCouples=db_event.split_couples or 0,
        )

    return EventDetail(
        id=db_event.id,
        name=db_event.name,
        profile=db_event.profile,
        guestCount=len(guests),          # 👈 REQUIRED
        tableCount=len(tables),          # 👈 REQUIRED
        createdAt=db_event.created_at,
        updatedAt=db_event.updated_at,
        guests=guests,
        tables=tables,
        weights=weights,
        result=result,
        metrics=metrics,
    )

# -----------------------------
# Health
# -----------------------------

@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


# -----------------------------
# Seating (stateless)
# -----------------------------

@app.post(
    "/api/seating/generate",
    response_model=SeatingPlanOut,
    tags=["seating"],
)
def generate_seating(req: GenerateRequest) -> SeatingPlanOut:
    """
    Stateless seating generation (no persistence).
    Used by the playground UI in the frontend.
    """
    # Convert to solver models
    solver_guests = [guest_in_to_solver(g) for g in req.guests]
    solver_tables = [table_in_to_solver(t) for t in req.tables]

    weights_dict = req.weights.dict() if getattr(req, "weights", None) else None

    logger.debug(
        "Generating seating plan (stateless)",
        extra={
            "profile": req.profile,
            "max_attempts": req.maxAttempts,
            "seed": req.seed,
            "weights": weights_dict,
        },
    )

    try:
        plan = solve(
            solver_guests,
            solver_tables,
            profile=req.profile,
            max_attempts=req.maxAttempts,
            seed=req.seed,
            weights=weights_dict,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return seating_plan_dict_to_out(seating_plan_to_dict(plan))


# -----------------------------
# CSV Import
# -----------------------------

@app.post(
    "/api/guests/import-csv",
    response_model=CsvImportResponse,
    tags=["csv"],
)
async def import_guests_csv(
    file: UploadFile = File(...),
    profile: str = "wedding_default",
) -> CsvImportResponse:
    """
    Import guests from a profile-specific CSV.

    Currently only supports:
      - profile = "wedding_default"
    """
    if profile != "wedding_default":
        raise HTTPException(
            status_code=400,
            detail="Only profile 'wedding_default' is supported for CSV import.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    guests, warnings = parse_wedding_csv(content)

    if not guests:
        warnings.append("No guests could be parsed from the uploaded CSV.")

    return CsvImportResponse(guests=guests, warnings=warnings)


# -----------------------------
# Events (Iteration 7)
# -----------------------------

@app.post(
    "/api/events",
    response_model=EventDetail,
    tags=["events"],
)
def create_event(event: EventCreate, db: Session = Depends(get_db)) -> EventDetail:
    """
    Create and persist a new event with guests, tables and weights.
    """
    # Validation: basic sanity checks
    _validate_guests_and_tables(event.guests, event.tables)

    db_event = Event(
        name=event.name,
        profile=event.profile,
        guests_json=json.dumps([g.dict() for g in event.guests]),
        tables_json=json.dumps([t.dict() for t in event.tables]),
        weights_json=json.dumps(event.weights.dict()) if event.weights else None,
        last_plan_json=None,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return _event_to_detail_schema(db_event)


@app.get(
    "/api/events",
    response_model=List[EventSummary],
    tags=["events"],
)
def list_events(db: Session = Depends(get_db)) -> List[EventSummary]:
    """
    List all events (no auth yet, MVP).
    """
    events = db.query(Event).order_by(Event.created_at.desc()).all()
    summaries: List[EventSummary] = []

    for e in events:
        try:
            guests_raw = json.loads(e.guests_json) if e.guests_json else []
        except json.JSONDecodeError:
            guests_raw = []

        try:
            tables_raw = json.loads(e.tables_json) if e.tables_json else []
        except json.JSONDecodeError:
            tables_raw = []

        summaries.append(
            EventSummary(
                id=e.id,
                name=e.name,
                profile=e.profile,
                guestCount=len(guests_raw),
                tableCount=len(tables_raw),
                createdAt=e.created_at,
                updatedAt=e.updated_at,
            )
        )

    return summaries


@app.get(
    "/api/events/{event_id}",
    response_model=EventDetail,
    tags=["events"],
)
def get_event(
    event_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
) -> EventDetail:
    """
    Load a single event by ID.
    """
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found.")
    return _event_to_detail_schema(db_event)


@app.put(
    "/api/events/{event_id}",
    response_model=EventDetail,
    tags=["events"],
)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
) -> EventDetail:
    """
    Update event name/profile/guests/tables/weights.
    """
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found.")

    # Start from existing JSON blobs
    guests_raw = json.loads(db_event.guests_json)
    tables_raw = json.loads(db_event.tables_json)

    # Apply simple field updates
    if payload.name is not None:
        db_event.name = payload.name
    if payload.profile is not None:
        db_event.profile = payload.profile
    if payload.guests is not None:
        guests_raw = [g.dict() for g in payload.guests]
        db_event.guests_json = json.dumps(guests_raw)
    if payload.tables is not None:
        tables_raw = [t.dict() for t in payload.tables]
        db_event.tables_json = json.dumps(tables_raw)
    if payload.weights is not None:
        db_event.weights_json = json.dumps(payload.weights.dict())

    # Optional validation after updates
    try:
        guests = [GuestIn(**g) for g in guests_raw]
        tables = [TableIn(**t) for t in tables_raw]
        _validate_guests_and_tables(guests, tables)
    except HTTPException as exc:
        # Rollback changes if invalid
        db.rollback()
        raise exc

    db.commit()
    db.refresh(db_event)

    return _event_to_detail_schema(db_event)


@app.delete(
    "/api/events/{event_id}",
    tags=["events"],
)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """
    Delete an event by ID.
    """
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found.")

    db.delete(db_event)
    db.commit()
    return {"status": "deleted", "id": event_id}


@app.post(
    "/api/events/{event_id}/generate",
    response_model=SeatingPlanOut,
    tags=["events", "seating"],
)
def generate_seating_for_event(
    event_id: int,
    maxAttempts: int = Query(1000, gt=0),
    seed: Optional[int] = Query(None),
    db: Session = Depends(get_db),
) -> SeatingPlanOut:
    """
    Run the solver for a stored event and persist the last plan.

    Also stores metrics in the Event row if the corresponding columns exist
    (must_not_violations, wants_satisfied, etc.), but does not expose them
    separately from the SeatingPlanOut yet.
    """
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found.")

    try:
        guests_raw = json.loads(db_event.guests_json)
        tables_raw = json.loads(db_event.tables_json)
        weights_raw = json.loads(db_event.weights_json) if db_event.weights_json else None
    except Exception:
        raise HTTPException(status_code=500, detail="Corrupt event JSON data.")

    guests_in = [GuestIn(**g) for g in guests_raw]
    tables_in = [TableIn(**t) for t in tables_raw]

    # Validate capacity again when generating
    _validate_guests_and_tables(guests_in, tables_in)

    solver_guests = [guest_in_to_solver(g) for g in guests_in]
    solver_tables = [table_in_to_solver(t) for t in tables_in]

    logger.debug(
        "Generating seating plan for event",
        extra={
            "event_id": event_id,
            "profile": db_event.profile,
            "max_attempts": maxAttempts,
            "seed": seed,
            "weights": weights_raw,
        },
    )

    try:
        plan = solve(
            solver_guests,
            solver_tables,
            profile=db_event.profile,
            max_attempts=maxAttempts,
            seed=seed,
            weights=weights_raw,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    plan_dict = seating_plan_to_dict(plan)

    # Persist last plan JSON
    db_event.last_plan_json = json.dumps(plan_dict)

    # Store metrics in Event if those columns exist on the model
    metrics = plan_dict.get("metrics", {}) or {}
    if hasattr(db_event, "must_not_violations"):
        db_event.must_not_violations = metrics.get("mustNotViolations")
    if hasattr(db_event, "wants_satisfied"):
        db_event.wants_satisfied = metrics.get("wantsSatisfied")
    if hasattr(db_event, "adjacent_singles"):
        db_event.adjacent_singles = metrics.get("adjacentSingles")
    if hasattr(db_event, "same_gender_adjacencies"):
        db_event.same_gender_adjacencies = metrics.get("sameGenderAdjacencies")
    if hasattr(db_event, "alternating_tables"):
        db_event.alternating_tables = metrics.get("alternatingTables")
    if hasattr(db_event, "split_couples"):
        db_event.split_couples = metrics.get("splitCouples")

    db.commit()
    db.refresh(db_event)

    return seating_plan_dict_to_out(plan_dict)
