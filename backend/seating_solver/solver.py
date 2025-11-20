# seating_solver/solver.py
from __future__ import annotations

import random
from typing import List, Dict, Any, Optional

from .models import (
    Guest,
    Table,
    SeatingPlan,
    SeatingMetrics,
    GuestSeat,
    TableSeating,
    Weights,
)


# -------------------------
# Helper functions
# -------------------------

def is_married_to(p1: Guest, p2: Guest) -> bool:
    """Check if p1 and p2 are a married couple based on their marital_status text."""
    ms1 = (p1.marital_status or "").strip()
    ms2 = (p2.marital_status or "").strip()
    return (f"Married to {p2.name}" in ms1) or (f"Married to {p1.name}" in ms2)


def build_table_seating(
    males: List[Guest],
    females: List[Guest],
    table_size: int,
) -> Optional[List[Guest]]:
    """
    Build a single table's seating from shared male/female pools, trying to keep
    a reasonable gender balance and alternating where possible.

    Mutates `males` and `females` by popping from them.
    Returns None if it cannot build a table of the requested size.
    """
    total_remaining = len(males) + len(females)
    if total_remaining < table_size:
        return None

    # Ideal number of males for this table based on remaining pool proportion
    if total_remaining > 0:
        ideal_males = int(round(table_size * len(males) / total_remaining))
    else:
        ideal_males = 0

    ideal_males = min(ideal_males, len(males))
    ideal_females = table_size - ideal_males

    # Adjust if one pool is too small
    if ideal_females > len(females):
        ideal_females = len(females)
        ideal_males = min(table_size - ideal_females, len(males))

    if ideal_males > len(males):
        ideal_males = len(males)
        ideal_females = min(table_size - ideal_males, len(females))

    if ideal_males + ideal_females < table_size:
        # Still short; greedily fill from the larger pool
        needed = table_size - (ideal_males + ideal_females)
        for _ in range(needed):
            if len(males) >= len(females) and males:
                ideal_males += 1
            elif females:
                ideal_females += 1

        if ideal_males > len(males) or ideal_females > len(females):
            return None

    # Pull out local pools for this table
    local_males = [males.pop() for _ in range(ideal_males)]
    local_females = [females.pop() for _ in range(ideal_females)]

    seating: List[Guest] = []
    male_turn = len(local_males) >= len(local_females)

    while local_males or local_females:
        if male_turn and local_males:
            seating.append(local_males.pop())
        elif (not male_turn) and local_females:
            seating.append(local_females.pop())
        elif local_males:
            seating.append(local_males.pop())
        elif local_females:
            seating.append(local_females.pop())
        male_turn = not male_turn

    return seating


def ensure_no_adjacent_couples(table: List[Guest]) -> List[Guest]:
    """Try to rearrange a single table so no married couples sit adjacent (circular)."""
    n = len(table)
    for i in range(n):
        if is_married_to(table[i], table[(i + 1) % n]):
            for j in range(2, n):
                a = (i + j) % n
                b = (i + j + 1) % n
                if (not is_married_to(table[i], table[a]) and
                        not is_married_to(table[(i + 1) % n], table[b])):
                    # swap
                    table[(i + 1) % n], table[a] = table[a], table[(i + 1) % n]
                    break
    return table


def valid_alternating_seating(table: List[Guest]) -> bool:
    """True if genders alternate for all adjacent seats around the table."""
    n = len(table)
    if n <= 1:
        return True
    for i in range(n):
        g1 = table[i].gender
        g2 = table[(i + 1) % n].gender
        if g1 and g2 and g1 == g2:
            return False
    return True


def count_adjacent_singles(table: List[Guest]) -> int:
    """Count adjacent single–single pairs around the table (circular)."""
    n = len(table)
    if n == 0:
        return 0
    count = 0
    for i in range(n):
        if ((table[i].marital_status or "") == "Single" and
                (table[(i + 1) % n].marital_status or "") == "Single"):
            count += 1
    return count


def count_split_couples(seating1: List[Guest], seating2: List[Guest]) -> int:
    """Count unique married couples split between two tables."""
    split = set()
    for p1 in seating1:
        for p2 in seating2:
            if is_married_to(p1, p2):
                key = tuple(sorted((p1.id, p2.id)))
                split.add(key)
    return len(split)


def count_wants_score(seating: List[Guest]) -> int:
    """Count how many 'wants to sit next to' constraints are satisfied at a table."""
    n = len(seating)
    score = 0
    for i, person in enumerate(seating):
        wants = person.wants_to_sit_next_to or []
        if not wants:
            continue
        left = seating[(i - 1) % n]
        right = seating[(i + 1) % n]
        if left.id in wants or right.id in wants:
            score += 1
    return score


def count_must_not_violations(seating: List[Guest]) -> int:
    """Count violations of 'must not sit next to' at a table."""
    n = len(seating)
    violations = 0
    for i, person in enumerate(seating):
        must_not = person.must_not_sit_next_to or []
        if not must_not:
            continue
        left = seating[(i - 1) % n]
        right = seating[(i + 1) % n]
        if left.id in must_not or right.id in must_not:
            violations += 1
    return violations


def count_same_gender_adjacencies(table: List[Guest]) -> int:
    """Count adjacent MM or FF pairs around a table (circular)."""
    n = len(table)
    if n == 0:
        return 0
    count = 0
    for i in range(n):
        g1 = table[i].gender
        g2 = table[(i + 1) % n].gender
        if g1 and g2 and g1 == g2:
            count += 1
    return count


def scoring_tuple(
    must_not_violations: int,
    wants_score: int,
    alternating_score: int,
    split_couples: int,
    adjacent_singles: int,
) -> tuple:
    """
    Priority order (wedding_default profile):
      1. Minimise must-not violations
      2. Maximise wants satisfied
      3. Maximise adjacent singles
      4. Maximise alternating tables
      5. Maximise split couples
    """
    return (
        must_not_violations,      # minimise
        -wants_score,             # maximise
        -adjacent_singles,        # maximise
        -alternating_score,       # maximise
        -split_couples,           # maximise
    )


# -------------------------
# Core solver
# -------------------------

def solve(
    guests: List[Guest],
    tables: List[Table],
    profile: str = "wedding_default",
    weights: Optional[Weights] = None,
    max_attempts: int = 1000,
    seed: Optional[int] = None,
) -> SeatingPlan:
    """
    Core solver entrypoint.

    Parameters
    ----------
    guests : list[Guest]
        All guests to be seated.
    tables : list[Table]
        Available table configurations.
    profile : str
        Name of the seating profile to use. For now only "wedding_default"
        is implemented; this argument exists so other profiles can be added
        later without changing the signature.
    weights : Weights | None
        Optional constraint weights; currently not used to alter the scoring
        function, but included for future tuning.
    max_attempts : int
        Maximum number of random seating attempts to evaluate.
    seed : int | None
        Random seed for reproducible runs.

    Returns
    -------
    SeatingPlan
        Best seating plan found within max_attempts.
    """

    # For now, `profile` and `weights` do not alter behaviour. All logic is the
    # "wedding_default" profile. Later we can branch on `profile`.
    if seed is not None:
        random.seed(seed)

    total_capacity = sum(t.capacity for t in tables)
    if len(guests) > total_capacity:
        raise ValueError(
            f"Not enough seats: {len(guests)} guests but only {total_capacity} seats."
        )

    num_tables = len(tables)
    total_guests = len(guests)

    # Decide actual number of seats per table (e.g. 39 guests across 2x20 → [20, 19])
    base_size = total_guests // num_tables
    extra = total_guests % num_tables
    table_sizes = [base_size + (1 if i < extra else 0) for i in range(num_tables)]

    # Guard: no table size should exceed declared capacity
    for size, t in zip(table_sizes, tables):
        if size > t.capacity:
            raise ValueError(
                f"Table {t.name} capacity {t.capacity} is too small for assigned {size} guests."
            )

    # Pre-split by gender (Other/None are ignored for now)
    males_all = [g for g in guests if (g.gender or "").lower().startswith("m")]
    females_all = [g for g in guests if (g.gender or "").lower().startswith("f")]

    # If there are guests with other/unknown genders, just add them to the larger pool
    others = [g for g in guests if g not in males_all and g not in females_all]
    if others:
        if len(males_all) >= len(females_all):
            males_all.extend(others)
        else:
            females_all.extend(others)

    best_seatings: List[List[Guest]] = [[] for _ in range(num_tables)]
    best_score: Optional[tuple] = None
    best_metrics = SeatingMetrics(
        must_not_violations=10 ** 9,
        wants_satisfied=-1,
        adjacent_singles=-1,
        same_gender_adjacencies=-1,
        alternating_tables=-1,
        split_couples=-1,
    )
    attempts_made = 0

    for attempt in range(1, max_attempts + 1):
        attempts_made += 1

        males = males_all[:]
        females = females_all[:]
        random.shuffle(males)
        random.shuffle(females)

        seatings: List[List[Guest]] = []
        success = True

        # Build each table from gender pools
        for size in table_sizes:
            table_seating = build_table_seating(males, females, size)
            if table_seating is None or len(table_seating) != size:
                success = False
                break
            seatings.append(table_seating)

        if not success:
            continue

        # Apply couple separation heuristic
        seatings = [ensure_no_adjacent_couples(s) for s in seatings]

        # Compute metrics
        total_adjacent_singles = sum(count_adjacent_singles(s) for s in seatings)
        split_couples = sum(
            count_split_couples(s1, s2)
            for i, s1 in enumerate(seatings)
            for s2 in seatings[i + 1:]
        )
        alternating_tables_count = sum(
            1 for s in seatings if valid_alternating_seating(s)
        )
        total_wants_score = sum(count_wants_score(s) for s in seatings)
        total_must_not_violations = sum(count_must_not_violations(s) for s in seatings)
        same_gender_adjacent = sum(count_same_gender_adjacencies(s) for s in seatings)

        current_score = scoring_tuple(
            total_must_not_violations,
            total_wants_score,
            alternating_tables_count,
            split_couples,
            total_adjacent_singles,
        )

        if best_score is None or current_score < best_score:
            best_score = current_score
            best_seatings = seatings
            best_metrics = SeatingMetrics(
                must_not_violations=total_must_not_violations,
                wants_satisfied=total_wants_score,
                adjacent_singles=total_adjacent_singles,
                same_gender_adjacencies=same_gender_adjacent,
                alternating_tables=alternating_tables_count,
                split_couples=split_couples,
            )

    # Convert best_seatings into SeatingPlan
    table_seatings: List[TableSeating] = []
    for table, guest_list in zip(tables, best_seatings):
        seats = [
            GuestSeat(seat_index=i, guest_id=g.id)
            for i, g in enumerate(guest_list)
        ]
        table_seatings.append(TableSeating(table_id=table.id, seats=seats))

    return SeatingPlan(
        tables=table_seatings,
        metrics=best_metrics,
        attempts_made=attempts_made,
    )


def seating_plan_to_dict(plan: SeatingPlan) -> Dict[str, Any]:
    """Convert SeatingPlan to a JSON-serialisable dict."""
    return {
        "tables": [
            {
                "tableId": ts.table_id,
                "seats": [
                    {"seatIndex": s.seat_index, "guestId": s.guest_id}
                    for s in ts.seats
                ],
            }
            for ts in plan.tables
        ],
        "metrics": {
            "mustNotViolations": plan.metrics.must_not_violations,
            "wantsSatisfied": plan.metrics.wants_satisfied,
            "adjacentSingles": plan.metrics.adjacent_singles,
            "sameGenderAdjacencies": plan.metrics.same_gender_adjacencies,
            "alternatingTables": plan.metrics.alternating_tables,
            "splitCouples": plan.metrics.split_couples,
        },
        "attemptsMade": plan.attempts_made,
    }
