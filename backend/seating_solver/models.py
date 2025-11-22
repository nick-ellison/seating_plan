# seating_solver/models.py
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class Guest:
    id: str
    name: str
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    wants_to_sit_next_to: List[str] = field(default_factory=list)  # list of guest IDs
    must_not_sit_next_to: List[str] = field(default_factory=list)  # list of guest IDs
    tags: List[str] = field(default_factory=list)                  # e.g. ["family", "VIP"]
    attributes: Dict[str, Any] = field(default_factory=dict)       # arbitrary metadata


@dataclass
class Table:
    id: str
    name: str
    shape: str  # "round" or "trestle"
    capacity: int


@dataclass
class SeatingMetrics:
    must_not_violations: int
    wants_satisfied: int
    adjacent_singles: int
    same_gender_adjacencies: int
    alternating_tables: int
    split_couples: int


@dataclass
class GuestSeat:
    seat_index: int
    guest_id: str


@dataclass
class TableSeating:
    table_id: str
    seats: List[GuestSeat]


@dataclass
class SeatingPlan:
    tables: List[TableSeating]
    metrics: SeatingMetrics
    attempts_made: int


@dataclass
class Weights:
    must_not: int = 100
    wants: int = 10
    adjacent_singles: int = 5
    alternating: int = 2
    split_couples: int = 1
    # NEW — soft penalty for seating married couples together
    adjacent_couples: int = 0


# Helper functions to convert from/to primitive dicts for JSON

def guest_from_dict(d: Dict[str, Any]) -> Guest:
    return Guest(
        id=d["id"],
        name=d["name"],
        gender=d.get("gender"),
        marital_status=d.get("maritalStatus"),
        wants_to_sit_next_to=d.get("wantsToSitNextTo", []),
        must_not_sit_next_to=d.get("mustNotSitNextTo", []),
        tags=d.get("tags", []),
        attributes=d.get("attributes", {}),
    )


def table_from_dict(d: Dict[str, Any]) -> Table:
    return Table(
        id=d["id"],
        name=d["name"],
        shape=d["shape"],
        capacity=int(d["capacity"]),
    )
