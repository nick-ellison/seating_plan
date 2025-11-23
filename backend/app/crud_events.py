# app/crud_events.py
import json
from sqlalchemy.orm import Session

from app.event_models import Event
from app.schemas import (
    EventCreate,
    EventUpdate,
    EventSummary,
    EventDetail,
    GuestIn,
    TableIn,
    WeightConfig,
    SeatingPlanOut,
    MetricsOut,
)


# -----------------------------
# Helpers
# -----------------------------
def _load_json(blob):
    if not blob:
        return None
    try:
        return json.loads(blob)
    except Exception:
        return None


# -----------------------------
# Conversion helpers
# -----------------------------
def event_to_detail(event: Event) -> EventDetail:
    guests_raw = _load_json(event.guests_json) or []
    tables_raw = _load_json(event.tables_json) or []
    weights_raw = _load_json(event.weights_json)
    last_plan_raw = _load_json(event.last_plan_json)

    guests = [GuestIn(**g) for g in guests_raw]
    tables = [TableIn(**t) for t in tables_raw]
    weights = WeightConfig(**weights_raw) if weights_raw else None
    result = SeatingPlanOut(**last_plan_raw) if last_plan_raw else None

    metrics = None
    if event.must_not_violations is not None:
        metrics = MetricsOut(
            mustNotViolations=event.must_not_violations or 0,
            wantsSatisfied=event.wants_satisfied or 0,
            adjacentSingles=event.adjacent_singles or 0,
            sameGenderAdjacencies=event.same_gender_adjacencies or 0,
            alternatingTables=event.alternating_tables or 0,
            splitCouples=event.split_couples or 0,
            attemptsMade=event.attempts_made or 0,
        )

    return EventDetail(
        id=event.id,
        name=event.name,
        profile=event.profile,
        guests=guests,
        tables=tables,
        weights=weights,
        result=result,
        metrics=metrics,
        createdAt=event.created_at,
        updatedAt=event.updated_at,
    )


def event_to_summary(event: Event) -> EventSummary:
    guests_raw = _load_json(event.guests_json) or []
    tables_raw = _load_json(event.tables_json) or []

    return EventSummary(
        id=event.id,
        name=event.name,
        profile=event.profile,
        guestCount=len(guests_raw),
        tableCount=len(tables_raw),
        createdAt=event.created_at,
    )


# -----------------------------
# CRUD Operations
# -----------------------------
def create_event(db: Session, data: EventCreate) -> Event:
    event = Event(
        name=data.name,
        profile=data.profile,
        guests_json=json.dumps([g.dict() for g in data.guests]),
        tables_json=json.dumps([t.dict() for t in data.tables]),
        weights_json=json.dumps(data.weights.dict()) if data.weights else None,
        last_plan_json=None,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event: Event, data: EventUpdate) -> Event:
    if data.name is not None:
        event.name = data.name
    if data.profile is not None:
        event.profile = data.profile
    if data.guests is not None:
        event.guests_json = json.dumps([g.dict() for g in data.guests])
    if data.tables is not None:
        event.tables_json = json.dumps([t.dict() for t in data.tables])
    if data.weights is not None:
        event.weights_json = json.dumps(data.weights.dict())
    if data.result is not None:
        event.last_plan_json = json.dumps(data.result.dict())

    # Store updated metrics
    if data.metrics is not None:
        event.must_not_violations = data.metrics.mustNotViolations
        event.wants_satisfied = data.metrics.wantsSatisfied
        event.adjacent_singles = data.metrics.adjacentSingles
        event.same_gender_adjacencies = data.metrics.sameGenderAdjacencies
        event.alternating_tables = data.metrics.alternatingTables
        event.split_couples = data.metrics.splitCouples
        event.attempts_made = data.metrics.attemptsMade

    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event: Event):
    db.delete(event)
    db.commit()


def get_event(db: Session, event_id: int) -> Event | None:
    return db.query(Event).filter(Event.id == event_id).first()


def list_events(db: Session):
    return db.query(Event).order_by(Event.created_at.desc()).all()
