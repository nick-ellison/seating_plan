# seating_solver/cli.py
import argparse
import json
import sys
from typing import Any, Dict, List

from .models import guest_from_dict, table_from_dict
from .solver import solve, seating_plan_to_dict


def main(argv: List[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="Seating solver CLI – JSON in, JSON out."
    )
    parser.add_argument(
        "input",
        help="Path to JSON file with guests and tables, or '-' for stdin.",
    )
    parser.add_argument(
        "--max-attempts",
        type=int,
        default=1000,
        help="Maximum number of attempts (default: 1000)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducible runs",
    )
    args = parser.parse_args(argv)

    # Read JSON input
    if args.input == "-":
        raw = sys.stdin.read()
    else:
        with open(args.input, "r", encoding="utf-8") as f:
            raw = f.read()

    payload: Dict[str, Any] = json.loads(raw)

    guests = [guest_from_dict(g) for g in payload["guests"]]
    tables = [table_from_dict(t) for t in payload["tables"]]

    plan = solve(guests, tables, max_attempts=args.max_attempts, seed=args.seed)
    out = seating_plan_to_dict(plan)

    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
