"""Synthetic diagnostic-centre data used by the local prototype only."""

from copy import deepcopy


REPORTS = {
    "report-current": {
        "id": "report-current",
        "label": "CBC · 08 Nov 2026",
        "patient_label": "Demo patient · A-104",
        "date": "08 Nov 2026",
        "facility": "MediAgent Sample Diagnostics · Hyderabad, Telangana",
        "panel": "Complete blood count",
        "status": "Final",
        "synthetic": True,
        "results": [
            {"name": "Hemoglobin", "value": 13.2, "unit": "g/dL", "range_low": 13.5, "range_high": 17.5},
            {"name": "White blood cells", "value": 7.4, "unit": "10⁹/L", "range_low": 4.0, "range_high": 11.0},
            {"name": "Platelets", "value": 260, "unit": "10⁹/L", "range_low": 150, "range_high": 450},
            {"name": "MCV", "value": 84, "unit": "fL", "range_low": 80, "range_high": 100},
        ],
    },
    "report-previous": {
        "id": "report-previous",
        "label": "CBC · 10 Sep 2026",
        "patient_label": "Demo patient · A-104",
        "date": "10 Sep 2026",
        "facility": "MediAgent Sample Diagnostics · Hyderabad, Telangana",
        "panel": "Complete blood count",
        "status": "Final",
        "synthetic": True,
        "results": [
            {"name": "Hemoglobin", "value": 12.6, "unit": "g/dL", "range_low": 13.5, "range_high": 17.5},
            {"name": "White blood cells", "value": 8.1, "unit": "10⁹/L", "range_low": 4.0, "range_high": 11.0},
            {"name": "Platelets", "value": 251, "unit": "10⁹/L", "range_low": 150, "range_high": 450},
            {"name": "MCV", "value": 82, "unit": "fL", "range_low": 80, "range_high": 100},
        ],
    },
    "report-metabolic": {
        "id": "report-metabolic",
        "label": "Basic metabolic panel · 08 Nov 2026",
        "patient_label": "Demo patient · A-104",
        "date": "08 Nov 2026",
        "facility": "MediAgent Sample Diagnostics · Hyderabad, Telangana",
        "panel": "Basic metabolic panel",
        "status": "Final",
        "synthetic": True,
        "results": [
            {"name": "Sodium", "value": 139, "unit": "mmol/L", "range_low": 135, "range_high": 145},
            {"name": "Potassium", "value": 4.1, "unit": "mmol/L", "range_low": 3.5, "range_high": 5.1},
            {"name": "Creatinine", "value": 0.9, "unit": "mg/dL", "range_low": 0.6, "range_high": 1.2},
            {"name": "Glucose", "value": 106, "unit": "mg/dL", "range_low": 70, "range_high": 99},
        ],
    },
}

IMAGING_SAMPLE = {
    "id": "imaging-sample",
    "label": "Chest X-ray · 08 Nov 2026",
    "patient_label": "Demo patient · A-104",
    "date": "08 Nov 2026",
    "modality": "Chest X-ray · PA view",
    "synthetic": True,
    "report_text": (
        "Synthetic radiology report text for demonstration: The cardiomediastinal silhouette is within normal size limits. "
        "No focal air-space opacity is described. No pleural effusion is described."
    ),
    "summary": (
        "The sample report describes a cardiomediastinal silhouette within normal size limits and says no focal "
        "air-space opacity or pleural effusion is described. This summary restates the supplied mock report text; "
        "it is not an independent reading of an X-ray image."
    ),
    "image_note": "Illustrative placeholder only · no diagnostic image is included or analyzed",
}


def get_report(report_id: str) -> dict | None:
    report = REPORTS.get(report_id)
    return deepcopy(report) if report else None


def list_reports() -> list[dict]:
    return [
        {key: report[key] for key in ("id", "label", "date", "panel", "status", "synthetic")}
        for report in REPORTS.values()
    ]


def get_imaging_sample() -> dict:
    return deepcopy(IMAGING_SAMPLE)
