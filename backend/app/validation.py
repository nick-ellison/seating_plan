from typing import List
from fastapi import HTTPException
from app.schemas import GuestIn, TableIn


def validate_event_payload(guests: List[GuestIn], tables: List[TableIn]) -> None:
    """Basic safety checks before saving an event."""

    if not guests:
        raise HTTPException(status_code=400, detail="At least one guest is required.")

    if not tables:
        raise HTTPException(status_code=400, detail="At least one table is required.")

    # Capacity check
    total_capacity = sum(t.capacity for t in tables)
    if len(guests) > total_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough total capacity ({total_capacity}) for {len(guests)} guests.",
        )

    # Unique IDs
    guest_ids = [g.id for g in guests]
    if len(set(guest_ids)) != len(guest_ids):
        raise HTTPException(
            status_code=400,
            detail="Guest IDs must be unique within an event.",
        )

    table_ids = [t.id for t in tables]
    if len(set(table_ids)) != len(table_ids):
        raise HTTPException(
            status_code=400,
            detail="Table IDs must be unique within an event.",
        )

    # Check references in wants/must-not
    known_ids = set(guest_ids)
    bad_refs = []
    for g in guests:
        for target in g.wantsToSitNextTo:
            if target not in known_ids:
                bad_refs.append((g.id, target, "wantsToSitNextTo"))
        for target in g.mustNotSitNextTo:
            if target not in known_ids:
                bad_refs.append((g.id, target, "mustNotSitNextTo"))

    if bad_refs:
        # you can make this more detailed if you want
        raise HTTPException(
            status_code=400,
            detail=f"Some wants/must-not references point to unknown guest IDs: {bad_refs[:5]}",
        )
