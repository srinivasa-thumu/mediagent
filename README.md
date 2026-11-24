# MediAgent Diagnostic AI Prototype

A local, synthetic-data prototype for a diagnostic-centre assistant. The React workspace demonstrates cross-facility patient-record consolidation, concise summaries, two-report comparisons, a radiology report-text summary, digitized ultrasound request drafts, and routine patient inquiry handoff.

## Run the prototype

Use Python 3.10 or newer and Node.js 18 or newer.

### 1. Start the API

From this directory, create a Python environment and install the dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn backend.main:app --reload
```

### 2. Start the React workspace

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. The Vite dev server forwards `/api` requests to FastAPI on port 8000.

### Optional: serve the React build from FastAPI

```powershell
cd frontend
npm run build
cd ..
uvicorn backend.main:app --reload
```

Open `http://localhost:8000/` for the diagnostic-centre landing page or `http://localhost:8000/agent/` for the React workspace.

## What is simulated

- The CBC and metabolic panel data are fictional examples with sample reference intervals.
- Report summaries compare values only with the intervals printed in each synthetic report. Comparisons describe numeric changes and do not call them improvement or deterioration.
- The imaging screen summarizes synthetic radiologist report text. Its X-ray graphic is an illustration; no image recognition or image-based interpretation is connected.
- Patient record groups fictional reports from three sample facilities and summarizes the listed values. No real records are scanned, imported, or connected.
- Ultrasound requests are browser-session drafts for demonstration only. They are not submitted, clinically validated, or scheduled.
- The patient assistant uses deterministic demo responses. LangGraph routes each action, and LangChain structured tools handle report lookup and comparison. No external LLM or live diagnostic-centre system is connected.
- Do not enter real patient information or use these outputs for clinical care. A deployed system that analyzes patient-specific reports or images needs qualified clinical validation, appropriate privacy/security controls, and a regulatory assessment for its intended use.
