# backend/app/importers/wedding_csv.py

import csv
import io
from typing import List, Tuple, Dict, Any

from app.schemas import GuestIn


def _normalise_gender(raw: str | None) -> str | None:
    if not raw:
        return None
    s = raw.strip().lower()
    if s.startswith("m"):
        return "Male"
    if s.startswith("f"):
        return "Female"
    return None


def parse_wedding_csv(file_bytes: bytes) -> Tuple[List[GuestIn], List[str]]:
    """
    Parse a wedding-style CSV into GuestIn objects and warnings.

    Expected columns (MVP, case-sensitive):
      - Name
      - Gender
      - Marital_Status
      - Wants to sit next to
      - Must not sit next to
    """
    text = file_bytes.decode("utf-8-sig")  # handle BOM if present
    f = io.StringIO(text)
    reader = csv.DictReader(f)

    raw_rows: List[Dict[str, Any]] = []
    warnings: List[str] = []

    for idx, row in enumerate(reader, start=2):  # start=2 to account for header row
        raw_rows.append({"row_number": idx, "data": row})

    # First pass: build guests with IDs, gather name index
    guests: List[GuestIn] = []
    name_index: Dict[str, List[str]] = {}  # normalised name -> list of IDs
    duplicate_names: Dict[str, int] = {}

    for row_info in raw_rows:
        row_num = row_info["row_number"]
        row = row_info["data"]

        name = (row.get("Name") or "").strip()
        if not name:
            warnings.append(f"Row {row_num}: Missing Name – row skipped.")
            continue

        gender = _normalise_gender(row.get("Gender"))
        marital_status = (row.get("Marital_Status") or "").strip() or None

        wants_raw = (row.get("Wants to sit next to") or "").strip()
        must_not_raw = (row.get("Must not sit next to") or "").strip()

        wants_names = [part.strip() for part in wants_raw.split(",") if part.strip()]
        must_not_names = [part.strip() for part in must_not_raw.split(",") if part.strip()]

        guest_id = f"guest-{len(guests) + 1}"
        norm_name = name.lower()

        if norm_name in name_index:
            duplicate_names[norm_name] = duplicate_names.get(norm_name, 1) + 1
            name_index[norm_name].append(guest_id)
        else:
            name_index[norm_name] = [guest_id]

        guest = GuestIn(
            id=guest_id,
            name=name,
            gender=gender,
            maritalStatus=marital_status,
            wantsToSitNextTo=[],      # filled in second pass
            mustNotSitNextTo=[],      # filled in second pass
            tags=[],
            attributes={
                "source": "wedding_csv",
                "rowNumber": row_num,
                "wantsByName": wants_names,
                "mustNotByName": must_not_names,
            },
        )
        guests.append(guest)

    # Duplicate name warnings
    for norm_name, count in duplicate_names.items():
        if count > 1:
            display_name = norm_name.title()
            warnings.append(
                f"Duplicate name '{display_name}' appears {count} times. "
                "Preferences referencing this name may be ambiguous."
            )

    # Second pass: resolve wants/must-not name lists into guest IDs (first match)
    name_to_primary_id: Dict[str, str] = {norm: ids[0] for norm, ids in name_index.items()}

    for guest in guests:
        attrs = guest.attributes or {}
        wants_names = attrs.get("wantsByName", []) or []
        must_not_names = attrs.get("mustNotByName", []) or []

        wants_ids: List[str] = []
        must_not_ids: List[str] = []

        for wn in wants_names:
            key = wn.lower()
            target_id = name_to_primary_id.get(key)
            if target_id:
                wants_ids.append(target_id)
            else:
                warnings.append(
                    f"Guest '{guest.name}' wants to sit next to '{wn}', "
                    "but no matching guest was found."
                )

        for mn in must_not_names:
            key = mn.lower()
            target_id = name_to_primary_id.get(key)
            if target_id:
                must_not_ids.append(target_id)
            else:
                warnings.append(
                    f"Guest '{guest.name}' must not sit next to '{mn}', "
                    "but no matching guest was found."
                )

        guest.wantsToSitNextTo = wants_ids
        guest.mustNotSitNextTo = must_not_ids

    if not guests:
        warnings.append("No valid guests were parsed from the CSV file.")

    return guests, warnings
