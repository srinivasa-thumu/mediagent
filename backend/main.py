"""FastAPI + LangGraph API for the MediAgent diagnostic-centre demo.

The demo uses synthetic records and deterministic summaries. It does not call an
external model and does not perform diagnosis or treatment recommendations.
"""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path
from typing import Any, TypedDict
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from langchain_core.tools import StructuredTool
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from .mock_data import get_imaging_sample, get_report, list_reports


ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST = ROOT / "frontend" / "dist"


class ReportLookup(BaseModel):
    report_id: str = Field(description="ID of a synthetic report in the demo")


class CompareLookup(BaseModel):
    first_report_id: str = Field(description="Earlier synthetic report ID")
    second_report_id: str = Field(description="Later synthetic report ID")


class PatientRecordLookup(BaseModel):
    patient_id: str = Field(description="Synthetic demo patient ID")


def _flag(result: dict[str, Any]) -> str:
    if result["value"] < result["range_low"]:
        return "Below range"
    if result["value"] > result["range_high"]:
        return "Above range"
    return "Within range"


def _display(value: int | float) -> str:
    return f"{value:g}"


def _summarize_report(report_id: str) -> dict[str, Any]:
    report = get_report(report_id)
    if report is None:
        return {"error": "That sample report is not available in this demo."}

    results = []
    out_of_range = []
    for item in report["results"]:
        status = _flag(item)
        row = {
            **item,
            "status": status,
            "value_display": _display(item["value"]),
            "range_display": f"{_display(item['range_low'])}–{_display(item['range_high'])}",
        }
        results.append(row)
        if status != "Within range":
            out_of_range.append(row)

    within_count = len(results) - len(out_of_range)
    if out_of_range:
        flagged = "; ".join(
            f"{row['name']} ({row['value_display']} {row['unit']}) is {row['status'].lower()} "
            f"({row['range_display']} {row['unit']})"
            for row in out_of_range
        )
        patient_summary = (
            f"In this synthetic {report['panel'].lower()}, {within_count} of {len(results)} results fall "
            f"within the reference intervals printed on this report. {flagged}. A result outside a reference "
            "interval does not, by itself, establish a diagnosis. Please review it with a qualified clinician."
        )
        clinician_summary = (
            f"{report['panel']} · {report['date']}: {within_count}/{len(results)} values within report-listed "
            f"intervals. Outside interval: {flagged}. Interpret in clinical context."
        )
    else:
        patient_summary = (
            f"All {len(results)} values in this synthetic {report['panel'].lower()} fall within the reference "
            "intervals printed on this report. A report summary cannot determine overall health or replace a "
            "clinician's assessment."
        )
        clinician_summary = (
            f"{report['panel']} · {report['date']}: all {len(results)} displayed values are within the "
            "intervals printed on this synthetic report. Interpret in clinical context."
        )

    return {
        "report": report,
        "results": results,
        "patient_summary": patient_summary,
        "clinician_summary": clinician_summary,
        "out_of_range_count": len(out_of_range),
        "within_range_count": within_count,
        "disclaimer": "Synthetic sample data. Summary compares values only with the reference intervals printed on this report; it is not a diagnosis or treatment recommendation.",
    }


def _compare_reports(first_report_id: str, second_report_id: str) -> dict[str, Any]:
    first = get_report(first_report_id)
    second = get_report(second_report_id)
    if first is None or second is None:
        return {"error": "Choose two available sample reports to compare."}

    first_by_name = {item["name"]: item for item in first["results"]}
    second_by_name = {item["name"]: item for item in second["results"]}
    comparisons = []
    for name in first_by_name.keys() & second_by_name.keys():
        old = first_by_name[name]
        new = second_by_name[name]
        if old["unit"] != new["unit"]:
            continue
        delta = new["value"] - old["value"]
        comparisons.append({
            "name": name,
            "unit": old["unit"],
            "previous_value": old["value"],
            "current_value": new["value"],
            "previous_display": _display(old["value"]),
            "current_display": _display(new["value"]),
            "change": delta,
            "change_display": f"{delta:+g}",
            "previous_status": _flag(old),
            "current_status": _flag(new),
            "previous_range": f"{_display(old['range_low'])}–{_display(old['range_high'])}",
            "current_range": f"{_display(new['range_low'])}–{_display(new['range_high'])}",
        })
    comparisons.sort(key=lambda row: row["name"])
    same_panel = first["panel"] == second["panel"]
    same_facility = first["facility"] == second["facility"]
    deltas = [
        f"{row['name']} changed from {row['previous_display']} to {row['current_display']} {row['unit']}"
        for row in comparisons
        if row["change"] != 0
    ]
    if deltas:
        patient_summary = (
            f"Between {first['date']} and {second['date']}, " + "; ".join(deltas) +
            ". These are descriptive changes only; a clinician should interpret them in context."
        )
    else:
        patient_summary = "The displayed values are unchanged between these synthetic reports. A clinician should interpret results in context."

    return {
        "first_report": first,
        "second_report": second,
        "comparisons": comparisons,
        "same_panel": same_panel,
        "same_facility": same_facility,
        "patient_summary": patient_summary,
        "clinician_summary": (
            f"Descriptive comparison of {first['panel']} ({first['date']} → {second['date']}). "
            f"Matched {len(comparisons)} results with the same units. Reference intervals are shown per report; "
            "differences are not interpreted as clinical improvement or deterioration."
        ),
        "disclaimer": "Synthetic sample data. Compare like-for-like results; changes alone do not establish clinical improvement or deterioration.",
    }


REPORT_SUMMARY_TOOL = StructuredTool.from_function(
    func=_summarize_report,
    name="summarize_sample_report",
    description="Summarize a synthetic diagnostic report using only its own printed reference intervals.",
    args_schema=ReportLookup,
)
REPORT_COMPARE_TOOL = StructuredTool.from_function(
    func=_compare_reports,
    name="compare_sample_reports",
    description="Compare two synthetic reports with matching test names and units; do not infer clinical improvement or diagnosis.",
    args_schema=CompareLookup,
)


def _consolidate_demo_record(patient_id: str) -> dict[str, Any]:
    reports = [get_report(report_id) for report_id in ("report-previous", "report-metabolic", "report-current")]
    reports = [report for report in reports if report and report["patient_label"].endswith(patient_id)]
    if not reports:
        return {"error": "That synthetic patient record is not available in this demo."}
    reports.sort(key=lambda report: datetime.strptime(report["date"], "%d %b %Y"))
    summaries = [REPORT_SUMMARY_TOOL.invoke({"report_id": report["id"]}) for report in reports]
    flags = [
        f"{row['name']} was outside the report-listed interval on {summary['report']['date']}"
        for summary in summaries for row in summary["results"] if row["status"] != "Within range"
    ]
    facilities = list(dict.fromkeys(report["facility"] for report in reports))
    highlight = (
        "; ".join(flags) if flags else "No displayed result falls outside its report-listed interval in these samples"
    )
    return {
        "patient": {"id": patient_id, "label": f"Demo patient · {patient_id}", "synthetic": True},
        "facility_count": len(facilities),
        "facilities": facilities,
        "documents": [
            {"id": report["id"], "label": report["label"], "date": report["date"], "panel": report["panel"],
             "facility": report["facility"], "status": report["status"], "clinician_summary": summary["clinician_summary"]}
            for report, summary in zip(reports, summaries)
        ],
        "record_summary": (
            f"{len(reports)} synthetic reports from {len(facilities)} facilities are grouped for review. "
            f"Across the displayed report-specific intervals: {highlight}. Reference intervals may differ by lab; "
            "review original reports and interpret the full history with a qualified clinician."
        ),
        "disclaimer": "Fictional demo record. No records were scanned or imported from a real hospital system.",
    }


PATIENT_RECORD_TOOL = StructuredTool.from_function(
    func=_consolidate_demo_record,
    name="consolidate_demo_patient_record",
    description="Group synthetic reports across sample facilities and create a concise source-linked review summary.",
    args_schema=PatientRecordLookup,
)


class AgentState(TypedDict, total=False):
    action: str
    payload: dict[str, Any]
    output: dict[str, Any]


def _summarize_node(state: AgentState) -> dict[str, Any]:
    return {"output": REPORT_SUMMARY_TOOL.invoke(state["payload"])}


def _compare_node(state: AgentState) -> dict[str, Any]:
    return {"output": REPORT_COMPARE_TOOL.invoke(state["payload"])}


def _record_node(state: AgentState) -> dict[str, Any]:
    return {"output": PATIENT_RECORD_TOOL.invoke(state["payload"])}


def _imaging_node(_: AgentState) -> dict[str, Any]:
    sample = get_imaging_sample()
    return {"output": {
        **sample,
        "patient_summary": sample["summary"],
        "clinician_summary": "Synthetic imaging report-text summary. No image was analyzed; verify the source report before clinical use.",
        "disclaimer": "Synthetic demonstration. This restates mock radiologist report text and is not an independent image interpretation.",
    }}


def _chat_node(state: AgentState) -> dict[str, Any]:
    message = state.get("payload", {}).get("message", "").strip()
    lower = message.lower()
    if any(term in lower for term in ("emergency", "can't breathe", "cannot breathe", "chest pain", "severe bleeding")):
        reply = "This demo cannot assess urgent symptoms. Please contact local emergency services or go to the nearest emergency department now."
        intent = "urgent_handoff"
        handoff = True
    elif any(term in lower for term in ("diagnos", "what disease", "treatment", "medicine", "medication", "interpret my x-ray", "read my xray", "what does my report mean")):
        reply = "I can make a plain-language summary of the sample report and show how each value compares with the range printed on it. I can’t diagnose, interpret an image, or recommend treatment. Please review medical meaning and next steps with a qualified clinician."
        intent = "clinical_handoff"
        handoff = True
    elif any(term in lower for term in ("book", "appointment", "test", "collection", "sample")):
        reply = "I can record a test or home-collection request for the centre team to review. Which test or service are you asking about, and would you prefer a centre visit or home collection?"
        intent = "service_request"
        handoff = False
    elif any(term in lower for term in ("report", "summary", "compare", "x-ray", "xray", "image")):
        reply = "Open Report review for a plain-language summary, Compare reports to view changes between the two synthetic CBCs, or Imaging report to see a mock summary of radiologist report text."
        intent = "report_navigation"
        handoff = False
    else:
        reply = "I can help with approved test and package information, record a booking or home-collection request, and route report questions to the right team. What would you like help with?"
        intent = "general_inquiry"
        handoff = False
    return {"output": {"reply": reply, "intent": intent, "handoff": handoff}}


def _route_action(state: AgentState) -> str:
    action = state.get("action", "chat")
    return action if action in {"summarize", "compare", "record", "imaging", "chat"} else "chat"


graph_builder = StateGraph(AgentState)
graph_builder.add_node("summarize", _summarize_node)
graph_builder.add_node("compare", _compare_node)
graph_builder.add_node("record", _record_node)
graph_builder.add_node("imaging", _imaging_node)
graph_builder.add_node("chat", _chat_node)
graph_builder.add_conditional_edges(START, _route_action, {
    "summarize": "summarize",
    "compare": "compare",
    "record": "record",
    "imaging": "imaging",
    "chat": "chat",
})
for node in ("summarize", "compare", "record", "imaging", "chat"):
    graph_builder.add_edge(node, END)
agent_graph = graph_builder.compile()


class SummaryRequest(BaseModel):
    report_id: str


class CompareRequest(BaseModel):
    first_report_id: str
    second_report_id: str


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str = Field(min_length=1, max_length=2000)


class SessionRequest(BaseModel):
    pass


sessions: dict[str, list[dict[str, str]]] = {}
app = FastAPI(title="MediAgent Diagnostic Centre Demo API", version="0.1.0")
_extra_origin = os.getenv("FRONTEND_ORIGIN", "")
_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if _extra_origin:
    _origins.append(_extra_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "synthetic-demo"}


@app.get("/api/reports")
def reports() -> dict[str, Any]:
    return {"items": list_reports(), "synthetic": True}


@app.get("/api/reports/{report_id}")
def report_detail(report_id: str) -> dict[str, Any]:
    report = get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Sample report not found")
    return report


@app.post("/api/reports/summarize")
def summarize_report(request: SummaryRequest) -> dict[str, Any]:
    result = agent_graph.invoke({"action": "summarize", "payload": {"report_id": request.report_id}})["output"]
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/reports/compare")
def compare_reports(request: CompareRequest) -> dict[str, Any]:
    result = agent_graph.invoke({"action": "compare", "payload": request.model_dump()})["output"]
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.get("/api/imaging/sample")
def imaging_sample() -> dict[str, Any]:
    return agent_graph.invoke({"action": "imaging", "payload": {}})["output"]


@app.get("/api/patient-record/demo")
def patient_record_demo() -> dict[str, Any]:
    result = agent_graph.invoke({"action": "record", "payload": {"patient_id": "A-104"}})["output"]
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.post("/api/session")
def create_session(_: SessionRequest) -> dict[str, Any]:
    session_id = str(uuid.uuid4())
    sessions[session_id] = []
    return {
        "session_id": session_id,
        "synthetic": True,
        "greeting": "Hi, I’m the MediAgent demo assistant. I can answer routine centre questions and help organize a request. For report summaries, use the report review workspace.",
    }


@app.post("/api/chat")
def chat(request: ChatRequest) -> dict[str, Any]:
    session_id = request.session_id or str(uuid.uuid4())
    history = sessions.setdefault(session_id, [])
    output = agent_graph.invoke({"action": "chat", "payload": {"message": request.message}})["output"]
    history.extend([
        {"role": "user", "content": request.message},
        {"role": "assistant", "content": output["reply"]},
    ])
    sessions[session_id] = history[-20:]
    return {"session_id": session_id, **output, "synthetic": True}


@app.get("/agent", include_in_schema=False)
def agent_redirect() -> RedirectResponse:
    return RedirectResponse(url="/agent/")


if FRONTEND_DIST.exists():
    app.mount("/agent", StaticFiles(directory=FRONTEND_DIST, html=True), name="agent-ui")

if (ROOT / "index.html").exists():
    app.mount("/", StaticFiles(directory=ROOT, html=True), name="marketing-site")
