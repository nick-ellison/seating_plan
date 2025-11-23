from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ---------- Core seating models ----------

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
    shape: str
    capacity: int


# Weight configuration passed from frontend
class WeightConfig(BaseModel):
    mustNot: float = 100.0
    wants: float = 10.0
    adjacentSingles: float = 5.0
    alternating: float = 2.0
    splitCouples: float = 1.0
    adjacentCouples: float = 0.0   # reserved for future use


class GenerateRequest(BaseModel):
    guests: List[GuestIn]
    tables: List[TableIn]
    profile: str = "wedding_default"
    maxAttempts: int = 1000
    seed: Optional[int] = None

    # optional for older clients, supports your UI sliders
    weights: Optional[WeightConfig] = None


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


class CsvImportResponse(BaseModel):
    guests: List[GuestIn]
    warnings: List[str]


# ---------- Event schemas ----------

class EventBase(BaseModel):
    name: str
    profile: str = "wedding_default"


class EventCreate(EventBase):
    guests: List[GuestIn]
    tables: List[TableIn]
    weights: Optional[WeightConfig] = None
    # you *could* also include result/metrics here later if you
    # want "Save event with current plan" in a single call


class EventUpdate(BaseModel):
    name: Optional[str] = None
    profile: Optional[str] = None
    guests: Optional[List[GuestIn]] = None
    tables: Optional[List[TableIn]] = None
    weights: Optional[WeightConfig] = None
    # allow updating last solver output + metrics
    result: Optional[SeatingPlanOut] = None
    metrics: Optional[MetricsOut] = None


class EventSummary(BaseModel):
    id: int
    name: str
    profile: str
    guestCount: int
    tableCount: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True


class EventDetail(EventSummary):
    guests: List[GuestIn]
    tables: List[TableIn]
    weights: Optional[WeightConfig] = None
    result: Optional[SeatingPlanOut] = None
    metrics: Optional[MetricsOut] = None
