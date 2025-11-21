ArrangeIQ Backend
=================

The ArrangeIQ backend provides the core seating-plan optimisation engine and a FastAPI web service.It exposes an HTTP API that accepts guest and table definitions, runs the solver, and returns an optimised seating plan with metrics.

This service powers the ArrangeIQ web application and can also be called programmatically or via CLI.

Features
--------

### ✓ Intelligent Seating Solver

*   Constraint-aware optimisation
    
*   Must-not conflicts avoided
    
*   Preference scoring (“wants to sit next to”)
    
*   Couple awareness
    
*   Gender alternation scoring
    
*   Support for multiple table shapes and capacities
    

### ✓ FastAPI Web API

*   /api/seating/generate endpoint
    
*   /api/health for health checks
    
*   Typed request/response models
    
*   Automatic OpenAPI documentation
    

### ✓ Developer CLI

Run seating generation directly from the command line using JSON input.

Project Structure
-----------------

backend/   app/      main.py      schemas.py      converters.py   seating\_solver/      models.py      solver.py      cli.py   tests/      test\_solver\_basic.py      test\_api\_generate.py   pyproject.toml   README.md

Installation
------------

From inside backend/ run:

pip install -r requirements.txt

or, if using Poetry:

poetry install

Running the API (Development)
-----------------------------

Start the FastAPI server:

uvicorn app.main:app --reload

Then open:

[http://127.0.0.1:8000](http://127.0.0.1:8000)http://127.0.0.1:8000/docshttp://127.0.0.1:8000/redoc

Example: API Call
-----------------

POST JSON to /api/seating/generate such as:

{ "guests": \[...\], "tables": \[...\], "profile": "wedding\_default", "maxAttempts": 1000, "seed": 42 }

Example using curl:

curl -X POST [http://127.0.0.1:8000/api/seating/generate](http://127.0.0.1:8000/api/seating/generate) -H "Content-Type: application/json" -d '{ "guests": \[...\], "tables": \[...\], "profile": "wedding\_default" }'

Using the CLI
-------------

Run the solver locally with:

python -m seating\_solver.cli example\_input.json

Or via stdin:

cat example\_input.json | python -m seating\_solver.cli -

Outputs a full seating plan as JSON.

Testing
-------

Run all tests:

pytest

Or individual suites:

pytest tests/test\_api\_generate.py -vpytest tests/test\_solver\_basic.py -v

Branding
--------

This backend is part of ArrangeIQ – The Intelligent Seating Engine.The service focuses on reliability, clarity, and professional-grade optimisation in line with the ArrangeIQ brand principles.

License
-------

CopyrightArrangeIQ – The Intelligent Seating EngineAll rights reserved.