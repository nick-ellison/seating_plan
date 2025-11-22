from __future__ import annotations

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from seating_solver.solver import solve, seating_plan_to_dict

from app.schemas import (
    GenerateRequest,
    SeatingPlanOut,
    CsvImportResponse
)
from app.converters import (
    guest_in_to_solver,
    table_in_to_solver,
    seating_plan_dict_to_out
)
from app.importers.wedding_csv import parse_wedding_csv

import logging

logging.basicConfig(level=logging.DEBUG)

tags_metadata = [
    {"name": "health", "description": "Health and status checks."},
    {"name": "seating", "description": "Generate optimised seating plans"},
    {"name": "csv", "description": "CSV import for guest lists"},
]

app = FastAPI(
    title="ArrangeIQ Seating API",
    description="API for generating optimised seating plans for weddings, corporate events and complex dinners.",
    version="0.1.0",
    contact={
        "name": "ArrangeIQ",
        "url": "https://arrangeiq.app",
        "email": "support@arrangeiq.app",
    },
    openapi_tags=tags_metadata,
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Endpoints
# -----------------------------

@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/seating/generate", response_model=SeatingPlanOut, tags=["seating"])
def generate_seating(req: GenerateRequest) -> SeatingPlanOut:
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
        raise HTTPException(status_code=400, detail=str(e))

    return seating_plan_dict_to_out(seating_plan_to_dict(plan))


@app.post("/api/guests/import-csv",
          response_model=CsvImportResponse,
          tags=["csv"])
async def import_guests_csv(
    file: UploadFile = File(...),
    profile: str = "wedding_default",
) -> CsvImportResponse:

    if profile != "wedding_default":
        raise HTTPException(
            status_code=400,
            detail="Only profile 'wedding_default' is supported for CSV import.",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    guests, warnings = parse_wedding_csv(content)

    if not guests:
        warnings.append("No guests could be parsed from the uploaded CSV.")

    return CsvImportResponse(guests=guests, warnings=warnings)
