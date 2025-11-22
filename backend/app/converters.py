# app/converters.py
from __future__ import annotations

from typing import Dict, Any, List

from app.schemas import (
    GuestIn,
    TableIn,
    SeatOut,
    TableOut,
    MetricsOut,
    SeatingPlanOut,
)

from seating_solver.models import (
    Guest as SolverGuest,
    Table as SolverTable,
)


def guest_in_to_solver(g: GuestIn) -> SolverGuest:
    """
    Convert API-layer GuestIn into solver-layer Guest.

    Note:
    - attributes/tags are passed through so the solver can use them in future,
      but the current solver ignores them (which is fine).
    """
    return SolverGuest(
        id=g.id,
        name=g.name,
        gender=g.gender,
        marital_status=g.maritalStatus,
        wants_to_sit_next_to=g.wantsToSitNextTo,
        must_not_sit_next_to=g.mustNotSitNextTo,
        # If SolverGuest doesn't yet have these fields, remove them here.
        tags=getattr(g, "tags", []),
        attributes=getattr(g, "attributes", {}),
    )


def table_in_to_solver(t: TableIn) -> SolverTable:
    """
    Convert API-layer TableIn into solver-layer Table.
    """
    return SolverTable(
        id=t.id,
        name=t.name,
        shape=t.shape,
        capacity=t.capacity,
    )


def seating_plan_dict_to_out(d: Dict[str, Any]) -> SeatingPlanOut:
    """
    Convert the plain dict produced by seating_plan_to_dict(plan)
    into the API-layer SeatingPlanOut Pydantic model.
    """
    tables: List[TableOut] = []
    for tbl in d["tables"]:
        seats = [
            SeatOut(
                seatIndex=s["seatIndex"],
                guestId=s["guestId"],
            )
            for s in tbl["seats"]
        ]
        tables.append(
            TableOut(
                tableId=tbl["tableId"],
                seats=seats,
            )
        )

    metrics = d["metrics"]

    return SeatingPlanOut(
        tables=tables,
        metrics=MetricsOut(
            mustNotViolations=metrics["mustNotViolations"],
            wantsSatisfied=metrics["wantsSatisfied"],
            adjacentSingles=metrics["adjacentSingles"],
            sameGenderAdjacencies=metrics["sameGenderAdjacencies"],
            alternatingTables=metrics["alternatingTables"],
            splitCouples=metrics["splitCouples"],
        ),
        attemptsMade=d["attemptsMade"],
    )
