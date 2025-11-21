from seating_solver.models import Guest, Table
from seating_solver.solver import solve


def make_guest(id, name, gender, marital=None, wants=None, must_not=None,
               tags=None, attributes=None):
    return Guest(
        id=id,
        name=name,
        gender=gender,
        marital_status=marital,
        wants_to_sit_next_to=wants or [],
        must_not_sit_next_to=must_not or [],
        tags=tags or [],
        attributes=attributes or {},
    )


def test_two_guests_couple_want_each_other():
    g1 = make_guest(
        "g1",
        "Nick",
        "Male",
        marital="Married to Charlotte",
        wants=["g2"],
    )
    g2 = make_guest(
        "g2",
        "Charlotte",
        "Female",
        marital="Married to Nick",
        wants=["g1"],
    )
    table = Table(id="t1", name="Table 1", shape="round", capacity=4)

    plan = solve(
        [g1, g2],
        [table],
        profile="wedding_default",
        max_attempts=200,
        seed=42,
    )

    seats = plan.tables[0].seats
    ids_in_order = [s.guest_id for s in seats]

    # Both guests are seated, and both wants are satisfied
    assert set(ids_in_order) == {"g1", "g2"}
    assert plan.metrics.must_not_violations == 0
    assert plan.metrics.wants_satisfied == 2


def test_must_not_violations_minimised_when_unavoidable():
    """
    With 3 guests on a round table, everyone is adjacent to everyone.
    If A must not sit next to B, that constraint is unsatisfiable.
    The solver should minimise (not eliminate) violations.
    """
    g1 = make_guest("a", "A", "Male", must_not=["b"])
    g2 = make_guest("b", "B", "Female")
    g3 = make_guest("c", "C", "Male")
    table = Table(id="t1", name="Table 1", shape="round", capacity=3)

    plan = solve(
        [g1, g2, g3],
        [table],
        profile="wedding_default",
        max_attempts=1000,
        seed=1,
    )

    # We expect exactly 1 must-not violation (A next to B) – the minimum possible.
    assert plan.metrics.must_not_violations == 1

    # And A must indeed be adjacent to B in a 3-person circular table.
    seats = plan.tables[0].seats
    order = [s.guest_id for s in seats]
    idx_a = order.index("a")
    left = order[(idx_a - 1) % 3]
    right = order[(idx_a + 1) % 3]
    assert "b" in (left, right)


def test_attributes_and_tags_do_not_break_solver():
    """
    Guests can carry tags and arbitrary attributes; solver should ignore them
    for now but still run successfully.
    """
    g1 = make_guest(
        "g1",
        "Alice",
        "Female",
        tags=["VIP", "family"],
        attributes={"department": "Legal", "side": "bride"},
    )
    g2 = make_guest(
        "g2",
        "Bob",
        "Male",
        attributes={"department": "Finance"},
    )
    table = Table(id="t1", name="Table 1", shape="round", capacity=4)

    plan = solve(
        [g1, g2],
        [table],
        profile="wedding_default",
        max_attempts=100,
        seed=123,
    )

    seats = plan.tables[0].seats
    ids_in_order = {s.guest_id for s in seats}
    assert ids_in_order == {"g1", "g2"}
    # Just sanity check metrics exist and are ints
    assert isinstance(plan.metrics.wants_satisfied, int)
    assert isinstance(plan.metrics.must_not_violations, int)
