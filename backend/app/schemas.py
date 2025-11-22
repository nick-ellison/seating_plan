from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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


class CsvImportResponse(BaseModel):
    guests: List[GuestIn]
    warnings: List[str]
