# app/main.py
from __future__ import annotations

from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from seating_solver.models import Guest as SolverGuest, Table as SolverTable
from seating_solver.solver import solve, seating_plan_to_dict

from fastapi.middleware.cors import CORSMiddleware

import logging

logging.basicConfig(level=logging.DEBUG)

tags_metadata = [
    {
        "name": "seating",
        "description": "Generate optimised seating plans with ArrangeIQ.",
    },
    {
        "name": "health",
        "description": "Health and status checks.",
    },
]

app = FastAPI(
    title="ArrangeIQ Seating API",
    description=(
        "API for generating optimised seating plans for weddings, corporate events and other complex dinners."
    ),
    version="0.1.0",
    contact={
        "name": "ArrangeIQ",
        "url": "https://arrangeiq.app",
        "email": "support@arrangeiq.app",
    },
    terms_of_service="https://arrangeiq.app/terms",  # optional
    openapi_tags=tags_metadata,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Pydantic models (API layer)
# -----------------------------

class GuestIn(BaseModel):
    id: str
    name: str
    gender: Optional[str] = None
    maritalStatus: Optional[str] = None
    wantsToSitNextTo: List[str] = Field(default_factory=list)
    mustNotSitNextTo: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    attributes: Dict[str, Any] = Field(default_factory=dict)


class TableIn(BaseModel):
    id: str
    name: str
    shape: str  # "round" or "trestle"
    capacity: int


class GenerateRequest(BaseModel):
    guests: List[GuestIn]
    tables: List[TableIn]
    profile: str = "wedding_default"
    maxAttempts: int = 1000
    seed: Optional[int] = None


class SeatOut(BaseModel):
    seatIndex: int
    guestId: str


class TableOut(BaseModel):
    tableId: str
    seats: List[SeatOut]


class MetricsOut(BaseModel):
    mustNotViolations: int
    wantsSatisfied: int
    adjacentSingles: int
    sameGenderAdjacencies: int
    alternatingTables: int
    splitCouples: int


class SeatingPlanOut(BaseModel):
    tables: List[TableOut]
    metrics: MetricsOut
    attemptsMade: int


# -----------------------------
# Helper conversion functions
# -----------------------------

def guest_in_to_solver(g: GuestIn) -> SolverGuest:
    return SolverGuest(
        id=g.id,
        name=g.name,
        gender=g.gender,
        marital_status=g.maritalStatus,
        wants_to_sit_next_to=g.wantsToSitNextTo,
        must_not_sit_next_to=g.mustNotSitNextTo,
        tags=g.tags,
        attributes=g.attributes,
    )


def table_in_to_solver(t: TableIn) -> SolverTable:
    return SolverTable(
        id=t.id,
        name=t.name,
        shape=t.shape,
        capacity=t.capacity,
    )


def seating_plan_dict_to_out(d: Dict[str, Any]) -> SeatingPlanOut:
    """Convert dict from seating_plan_to_dict into Pydantic SeatingPlanOut."""
    return SeatingPlanOut(
        tables=[
            TableOut(
                tableId=tbl["tableId"],
                seats=[
                    SeatOut(seatIndex=s["seatIndex"], guestId=s["guestId"])
                    for s in tbl["seats"]
                ],
            )
            for tbl in d["tables"]
        ],
        metrics=MetricsOut(
            mustNotViolations=d["metrics"]["mustNotViolations"],
            wantsSatisfied=d["metrics"]["wantsSatisfied"],
            adjacentSingles=d["metrics"]["adjacentSingles"],
            sameGenderAdjacencies=d["metrics"]["sameGenderAdjacencies"],
            alternatingTables=d["metrics"]["alternatingTables"],
            splitCouples=d["metrics"]["splitCouples"],
        ),
        attemptsMade=d["attemptsMade"],
    )


# -----------------------------
# Endpoints
# -----------------------------

@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/seating/generate", response_model=SeatingPlanOut, tags=["seating"])
def generate_seating(req: GenerateRequest) -> SeatingPlanOut:
    if not req.guests:
        raise HTTPException(status_code=400, detail="No guests provided.")
    if not req.tables:
        raise HTTPException(status_code=400, detail="No tables provided.")

    solver_guests = [guest_in_to_solver(g) for g in req.guests]
    solver_tables = [table_in_to_solver(t) for t in req.tables]

    try:
        plan = solve(
            solver_guests,
            solver_tables,
            profile=req.profile,
            max_attempts=req.maxAttempts,
            seed=req.seed,
        )
    except ValueError as e:
        # e.g. not enough capacity, etc.
        raise HTTPException(status_code=400, detail=str(e)) from e

    plan_dict = seating_plan_to_dict(plan)
    return seating_plan_dict_to_out(plan_dict)
