ArrangeIQ — Frontend Developer UI
=================================

### The Intelligent Seating Engine

This frontend provides a minimal developer interface for interacting with the ArrangeIQ seating solver API. It is designed as an internal tool for testing solver profiles, submitting sample data, and validating solver behaviour end-to-end.

1\. About ArrangeIQ
-------------------

ArrangeIQ is an intelligent seating engine designed to solve complex seating challenges using modern optimisation logic.This developer UI supports the broader vision by enabling rapid testing, iteration, and inspection of solver results.

Core values reflected in this interface:

*   Intelligent
    
*   Professional
    
*   Modern
    
*   Approachable
    
*   Reliable
    

The aim is to keep the experience structured, calm, and efficient — a clear window into the optimisation engine.

2\. Prerequisites
-----------------

*   Node.js 20.9 or newer(Recommended: install with nvm)
    
*   Backend server running locally (FastAPI)
    

3\. Start the Backend (Required)
--------------------------------

From the backend directory:

Create / activate your Python environment if needed.

Install dependencies:pip install -e .

Run the API server:uvicorn app.main:app --reload --port 8000

Verify the backend is available by opening:http://127.0.0.1:8000/api/health

You should see:{"status": "ok"}

4\. Frontend Setup
------------------

From the frontend directory:

Install dependencies:npm install

Create a local environment file named .env.local with:

NEXT\_PUBLIC\_API\_BASE\_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)

Start the development server:npm run dev

Then open:[http://localhost:3000](http://localhost:3000)

5\. Using the Developer UI
--------------------------

The UI is intentionally minimal — reflecting ArrangeIQ’s principle of clarity and intelligence.

It includes:

*   A JSON request editor (auto-filled with sample data)
    
*   A “Generate Seating” action button
    
*   A solver profile selector (starting with “wedding\_default”)
    
*   A structured results panel showing:
    
    *   Seating tables
        
    *   Guest order and seat indices
        
    *   Solver metrics (wants satisfied, adjacency counts, etc.)
        

This interface provides an accurate view of how the ArrangeIQ engine behaves under different inputs.

### Typical workflow:

1.  Start backend (port 8000)
    
2.  Start frontend (port 3000)
    
3.  Edit or load sample guests/tables
    
4.  Choose a solver profile
    
5.  Press “Generate seating”
    
6.  Review optimised layout and metrics
    

6\. Project Structure (Frontend)
--------------------------------

*   app/page.tsx — Main testing interface
    
*   app/ — Next.js route structure
    
*   styles/ or app/globals.css — Theming and layout rules
    
*   public/ — Static assets (icons, future branding)
    

ArrangeIQ design principles influence all UI decisions:

*   Minimalism
    
*   Structured whitespace
    
*   Geometric clarity
    
*   Soft rounding
    
*   Meaningful, calm accent colours
    

7\. Troubleshooting
-------------------

If you see “Failed to fetch” in the browser:

*   Ensure .env.local contains the correct API base URL
    
*   Ensure the backend is running and listening on port 8000
    
*   Restart the frontend after editing environment variables
    

If Next.js refuses to run due to Node version:

*   Install Node 20 or laterExample using nvm:nvm install 20nvm use 20
    

8\. Future Enhancements
-----------------------

This developer UI will evolve into:

*   Visual table layouts
    
*   Drag-and-drop adjustments
    
*   Profile-based solver tuning
    
*   Comparison of multiple solver outputs
    
*   Export-ready seating visualisation (PDF / web)
    

These additions will reflect ArrangeIQ’s promise: intelligent, reliable, effortless seating design.