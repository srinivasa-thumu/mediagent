import { useEffect, useMemo, useRef, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

const iconPaths = {
  overview: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  report: <><path d="M7 3.75h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5.25A1.5 1.5 0 0 1 7.5 3.75Z"/><path d="M14 4v4h4M9 13h6M9 16.5h6"/></>,
  records: <><path d="M7 3.75h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5.25A1.5 1.5 0 0 1 7.5 3.75Z"/><path d="M14 4v4h4M9 12h6M9 15h6M9 18h3"/><path d="M4 7v14"/></>,
  ultrasound: <><path d="M4 5h16v11H4zM8 20h8M12 16v4"/><path d="M8 9c1-1 2-1 3 0s2 1 3 0"/></>,
  compare: <><path d="M7 4v16M17 4v16M3.5 8H11M13 16h7.5"/><path d="m8.5 5.5 2.5 2.5-2.5 2.5M15.5 13.5 13 16l2.5 2.5"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
  chat: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.6-3.4A7.5 7.5 0 1 1 20 11.5Z"/><path d="M8.5 11.5h7M8.5 14.5h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3h-.2a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  spark: <><path d="m12 2 1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-2.8L12 2Z"/><path d="m19 14 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/></>,
  shield: <><path d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  collapse: <><path d="M14 4v16M19 8l-4 4 4 4M5 5h5M5 12h5M5 19h5"/></>,
};

function Icon({ name, size = 18, strokeWidth = 1.7 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const NAV_ITEMS = [
  { id: 'review', label: 'Report review', icon: 'report', group: 'PATIENT CARE' },
  { id: 'records', label: 'Patient record', icon: 'records' },
  { id: 'compare', label: 'Compare reports', icon: 'compare' },
  { id: 'imaging', label: 'Imaging summary', icon: 'image' },
  { id: 'ultrasound', label: 'Ultrasound request', icon: 'ultrasound' },
  { id: 'patient', label: 'Patient inquiries', icon: 'chat', group: 'CENTRE OPERATIONS' },
];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'The demo service could not complete this request.');
  }
  return response.json();
}

function Header({ pageTitle, onMenu }) {
  return <header className="workspace-header">
    <button className="mobile-menu" onClick={onMenu} aria-label="Toggle navigation"><Icon name="menu" /></button>
    <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{pageTitle}</strong></div>
    <div className="header-actions"><span className="demo-chip"><i /> Synthetic demo</span><button className="help-button" aria-label="About this demo"><Icon name="shield" size={16} /></button><div className="user-avatar">D</div></div>
  </header>;
}

function Sidebar({ page, setPage, open, close, collapsed, onToggle }) {
  let lastGroup = '';
  return <>
    {open && <button className="sidebar-scrim" aria-label="Close menu" onClick={close} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand-row"><div className="brand-lockup"><a className="app-brand" href="/" aria-label="MediAgent home"><span className="brand-symbol">M</span><span>MediAgent</span></a><span className="app-version">AI WORKSPACE</span></div><button className="sidebar-collapse-toggle" onClick={onToggle} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} title={collapsed ? 'Expand navigation' : 'Collapse navigation'}><Icon name="collapse" size={16} /></button></div>
      <div className="centre-switcher" title="Sample Diagnostics · Hyderabad, Telangana"><div className="centre-avatar"><Icon name="plus" size={19} /></div><div><b>Sample Diagnostics</b><small><Icon name="pin" size={11} /> Hyderabad, Telangana</small></div><span className="switch-caret">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="workspace-nav" aria-label="Workspace">
        {NAV_ITEMS.map((item) => {
          const group = item.group && item.group !== lastGroup ? item.group : '';
          if (item.group) lastGroup = item.group;
          return <div key={item.id}>{group && <div className="nav-group-label">{group}</div>}<button className={`nav-item ${page === item.id ? 'selected' : ''}`} title={collapsed ? item.label : undefined} onClick={() => { setPage(item.id); close(); }} aria-label={collapsed ? item.label : undefined} aria-current={page === item.id ? 'page' : undefined}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.id === 'review' && <i className="nav-live-dot" />}</button></div>;
        })}
      </nav>
      <div className="sidebar-divider" />
      <button className="nav-item settings-link" title={collapsed ? 'Centre knowledge' : undefined} aria-label={collapsed ? 'Centre knowledge' : undefined} onClick={() => { setPage('settings'); close(); }}><Icon name="settings" size={17} /><span>Centre knowledge</span></button>
      <div className="sidebar-bottom"><div className="sidebar-status" title="Demo data only · No patient records connected"><span className="status-pulse" /><div><b>Demo data only</b><small>No patient records connected</small></div><Icon name="shield" size={15} /></div><button className="sidebar-account" title={collapsed ? 'MediAgent Demo · Diagnostic workspace' : undefined}><span className="account-avatar">M</span><span><b>MediAgent Demo</b><small>Diagnostic workspace</small></span><span className="account-more">···</span></button></div>
    </aside>
  </>;
}

function PageIntro({ eyebrow, title, subtitle, children }) {
  return <div className="page-intro"><div><div className="page-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{children && <div className="intro-actions">{children}</div>}</div>;
}

function Select({ label, value, options, onChange }) {
  return <label className="select-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><span className="select-chevron">⌄</span></label>;
}

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return <div className="error-banner" role="alert"><span>!</span><div><b>Couldn’t reach the demo service</b><small>{message} Start the FastAPI server and refresh.</small></div>{onRetry && <button onClick={onRetry}>Retry</button>}</div>;
}

function ReportReview({ reports, selectedId, setSelectedId, analysis, loading, error, reload, setPage }) {
  const current = reports.find((report) => report.id === selectedId);
  return <>
    <PageIntro eyebrow="Patient care / Report review" title="A clearer view of every report." subtitle="Turn lab results into a concise patient explanation and a structured clinician handoff.">
      <button className="button button-secondary" onClick={() => setPage('compare')}><Icon name="compare" size={16} /> Compare reports</button>
      <button className="button button-primary" onClick={() => reload()} disabled={loading}><Icon name="spark" size={16} /> {loading ? 'Summarizing…' : 'Refresh summary'}</button>
    </PageIntro>
    <ErrorBanner message={error} onRetry={reload} />
    <div className="report-context-bar"><div className="report-context-left"><span className="context-icon"><Icon name="report" /></span><div><b>{current?.panel || 'Sample lab report'}</b><small>{current?.facility || 'MediAgent Sample Diagnostics · Hyderabad, Telangana'}</small></div></div><div className="report-context-right"><Select label="SAMPLE REPORT" value={selectedId} options={reports} onChange={setSelectedId} /><span className="final-status"><i /> Final</span></div></div>
    {loading && <div className="loading-panel"><span className="loading-spinner" /> Preparing the summary from the sample report…</div>}
    {!loading && analysis && <>
      <div className="summary-grid">
        <article className="summary-card patient-summary-card"><div className="card-heading"><span className="summary-card-icon patient-icon"><Icon name="chat" /></span><div><small>PATIENT-FRIENDLY SUMMARY</small><b>Plain language, key points first</b></div><span className="ai-badge"><Icon name="spark" size={12} /> AI SUMMARY</span></div><p>{analysis.patient_summary}</p><div className="summary-footer"><span><Icon name="shield" size={13} /> No diagnosis or treatment advice</span><button className="copy-button" onClick={() => navigator.clipboard?.writeText(analysis.patient_summary)}>Copy summary</button></div></article>
        <article className="summary-card clinician-summary-card"><div className="card-heading"><span className="summary-card-icon clinician-icon"><Icon name="overview" /></span><div><small>CLINICIAN HANDOFF</small><b>Structured review note</b></div><span className="handoff-ready"><i /> Ready to review</span></div><p>{analysis.clinician_summary}</p><div className="summary-footer"><span><Icon name="clock" size={13} /> Prepared from report data</span><button className="copy-button" onClick={() => navigator.clipboard?.writeText(analysis.clinician_summary)}>Copy note</button></div></article>
      </div>
      <div className="report-results-card">
        <div className="results-heading"><div><div className="card-kicker">RESULTS AT A GLANCE</div><h2>{analysis.report.panel}</h2><p>{analysis.report.patient_label} <span>·</span> {analysis.report.date} <span>·</span> {analysis.report.facility}</p></div><div className="result-counts"><span className="count-normal"><i /> {analysis.within_range_count} within range</span>{analysis.out_of_range_count > 0 && <span className="count-flagged"><i /> {analysis.out_of_range_count} flagged</span>}</div></div>
        <div className="results-table-wrap"><table className="results-table"><thead><tr><th>TEST / MARKER</th><th>RESULT</th><th>REFERENCE INTERVAL</th><th>REPORT FLAG</th><th></th></tr></thead><tbody>{analysis.results.map((result) => <tr key={result.name}><td><b>{result.name}</b><small>From this report</small></td><td className="result-number">{result.value_display} <small>{result.unit}</small></td><td>{result.range_display} <small>{result.unit}</small></td><td><span className={`range-pill ${result.status === 'Within range' ? 'range-ok' : 'range-out'}`}><i />{result.status}</span></td><td><button className="row-action" aria-label={`More about ${result.name}`}>···</button></td></tr>)}</tbody></table></div>
        <div className="reference-note"><Icon name="shield" size={15} /><span>Flags compare each value only with the reference interval printed on this sample report. Reference intervals can vary by lab and context.</span><button>How this works <Icon name="arrow" size={13} /></button></div>
      </div>
      <div className="review-next-row"><div className="review-next-icon"><Icon name="plus" size={16} /></div><div><b>Keep the clinician in the loop</b><span>Review the source report and clinical context before discussing results or next steps.</span></div><button onClick={() => setPage('patient')}>Open patient assistant <Icon name="arrow" size={14} /></button></div>
    </>}
    {!loading && !analysis && !error && <div className="empty-state">Choose a sample report to begin.</div>}
    {analysis && <p className="synthetic-footnote">{analysis.disclaimer}</p>}
  </>;
}

function CompareReports({ reports, comparison, loading, error, firstId, secondId, setFirstId, setSecondId, reload }) {
  return <>
    <PageIntro eyebrow="Patient care / Longitudinal view" title="See what changed between reports." subtitle="Compare matching results over time. Changes are shown descriptively, with each report’s own reference interval.">
      <button className="button button-primary" onClick={reload} disabled={loading}><Icon name="spark" size={16} /> {loading ? 'Comparing…' : 'Update comparison'}</button>
    </PageIntro>
    <ErrorBanner message={error} onRetry={reload} />
    <div className="compare-selectors"><div className="compare-report-select"><span className="compare-date-icon previous-date"><Icon name="clock" size={16} /></span><Select label="EARLIER REPORT" value={firstId} options={reports} onChange={setFirstId} /></div><span className="compare-arrow"><Icon name="arrow" size={17} /></span><div className="compare-report-select"><span className="compare-date-icon current-date"><Icon name="clock" size={16} /></span><Select label="LATER REPORT" value={secondId} options={reports} onChange={setSecondId} /></div></div>
    {loading && <div className="loading-panel"><span className="loading-spinner" /> Aligning matching results…</div>}
    {!loading && comparison && <>
      <div className="compare-summary-card"><span className="summary-card-icon patient-icon"><Icon name="compare" /></span><div className="compare-summary-content"><div className="card-kicker">CHANGE SUMMARY</div><p>{comparison.patient_summary}</p><small>{comparison.first_report.date} <b>→</b> {comparison.second_report.date} <span>·</span> {comparison.comparisons.length} matching results</small></div><span className="synthetic-tag">SYNTHETIC DATA</span></div>
      {(!comparison.same_panel || !comparison.same_facility) && <div className="comparison-caveat"><Icon name="shield" size={15} /> These reports differ by panel or facility. Treat the comparison as descriptive; results may not be directly comparable.</div>}
      <div className="report-results-card compare-results-card"><div className="results-heading"><div><div className="card-kicker">RESULT-BY-RESULT COMPARISON</div><h2>{comparison.first_report.panel}</h2><p>{comparison.first_report.facility}</p></div><div className="compare-legend"><span><i className="legend-first" /> Earlier</span><span><i className="legend-second" /> Later</span></div></div>
        <div className="results-table-wrap"><table className="results-table compare-table"><thead><tr><th>TEST / MARKER</th><th>{comparison.first_report.date.toUpperCase()}</th><th>{comparison.second_report.date.toUpperCase()}</th><th>CHANGE</th><th>RANGE FLAG</th></tr></thead><tbody>{comparison.comparisons.map((item) => <tr key={item.name}><td><b>{item.name}</b><small>{item.unit}</small></td><td><b>{item.previous_display}</b><small className="range-subline">{item.previous_range} · {item.previous_status}</small></td><td><b>{item.current_display}</b><small className="range-subline">{item.current_range} · {item.current_status}</small></td><td><span className={`change-pill ${item.change > 0 ? 'change-up' : item.change < 0 ? 'change-down' : ''}`}>{item.change_display} <small>{item.unit}</small></span></td><td><span className={`range-pill ${item.current_status === 'Within range' ? 'range-ok' : 'range-out'}`}><i />{item.current_status}</span></td></tr>)}</tbody></table></div>
        <div className="reference-note"><Icon name="shield" size={15} /><span>Directional change is not labeled as improvement or deterioration. A clinician should interpret results with the full patient context.</span></div>
      </div>
      <div className="clinician-summary-strip"><span className="clinician-strip-icon"><Icon name="overview" /></span><div><small>CLINICIAN HANDOFF</small><p>{comparison.clinician_summary}</p></div><button className="copy-button" onClick={() => navigator.clipboard?.writeText(comparison.clinician_summary)}>Copy note</button></div>
    </>}
    {!loading && comparison && <p className="synthetic-footnote">{comparison.disclaimer}</p>}
  </>;
}

function XrayPlaceholder() {
  return <div className="xray-placeholder" aria-label="Illustrative X-ray placeholder, not a real scan"><div className="xray-topline"><span>DEMO IMAGE</span><span>PA · SAMPLE</span></div><svg viewBox="0 0 320 360" role="img" aria-label="Abstract placeholder illustration of a chest X-ray"><defs><linearGradient id="xray-bg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1b263a"/><stop offset="1" stopColor="#101827"/></linearGradient><radialGradient id="lung" cx="50%" cy="45%" r="58%"><stop stopColor="#b8c9df" stopOpacity=".68"/><stop offset="1" stopColor="#768da8" stopOpacity=".12"/></radialGradient></defs><rect width="320" height="360" rx="16" fill="url(#xray-bg)"/><path d="M160 50v234M128 62Q80 70 66 132L49 254q-3 23 15 24 16 1 25-18l27-76M192 62q48 8 62 70l17 122q3 23-15 24-16 1-25-18l-27-76" fill="none" stroke="#c6d3e3" strokeOpacity=".42" strokeWidth="8" strokeLinecap="round"/><path d="M149 91c-42-34-73 13-76 53l-11 94q-2 20 13 21 18 1 29-24l28-71 18-73ZM171 91c42-34 73 13 76 53l11 94q2 20-13 21-18 1-29-24l-28-71-18-73Z" fill="url(#lung)" stroke="#d2dbe7" strokeOpacity=".28" strokeWidth="2"/><path d="M122 71q38 21 76 0M108 101q52 20 104 0M96 130q64 18 128 0M87 159q73 17 146 0M79 188q81 14 162 0M71 217q89 10 178 0" stroke="#dce5ef" strokeOpacity=".23" strokeWidth="2" fill="none"/><path d="M148 91q12 18 24 0v116q-13 18-24 0Z" fill="#d0d9e6" fillOpacity=".35"/><text x="160" y="333" textAnchor="middle" fill="#9cb0c8" fontSize="9" letterSpacing="2">ILLUSTRATIVE ONLY · NOT A SCAN</text></svg></div>;
}

function ImagingSummary({ imaging, loading, error, reload }) {
  return <>
    <PageIntro eyebrow="Patient care / Imaging" title="Make imaging reports easier to review." subtitle="Create a concise summary from radiologist report text and keep the source wording close at hand.">
      <button className="button button-primary" onClick={reload} disabled={loading}><Icon name="spark" size={16} /> {loading ? 'Preparing…' : 'Load X-ray demo'}</button>
    </PageIntro>
    <ErrorBanner message={error} onRetry={reload} />
    <div className="imaging-notice"><span><Icon name="shield" size={16} /></span><div><b>Mock imaging workflow</b><small>This prototype summarizes synthetic radiology text. It does not analyze an X-ray image or provide a diagnosis.</small></div><span className="synthetic-tag">SYNTHETIC CASE</span></div>
    {loading && <div className="loading-panel"><span className="loading-spinner" /> Preparing the sample imaging case…</div>}
    {imaging && <div className="imaging-layout"><section className="imaging-image-card"><div className="imaging-card-heading"><div><div className="card-kicker">SOURCE IMAGE AREA</div><h2>Chest X-ray</h2><p>{imaging.date} <span>·</span> {imaging.modality}</p></div><span className="image-zoom">⊕</span></div><XrayPlaceholder /><div className="image-note"><Icon name="image" size={14} /> {imaging.image_note}</div></section>
      <section className="imaging-report-card"><div className="card-kicker">RADIOLOGIST REPORT TEXT</div><h2>Source report</h2><blockquote>“{imaging.report_text.replace('Synthetic radiology report text for demonstration: ', '')}”</blockquote><div className="source-divider"/><div className="card-heading imaging-summary-heading"><span className="summary-card-icon patient-icon"><Icon name="spark" /></span><div><small>PLAIN-LANGUAGE SUMMARY</small><b>For patient &amp; care team</b></div><span className="ai-badge"><Icon name="spark" size={12} /> MOCK SUMMARY</span></div><p className="imaging-summary-text">{imaging.patient_summary}</p><div className="imaging-clinical-note"><Icon name="shield" size={14} /> No independent image reading, diagnosis or treatment advice was generated.</div></section></div>}
    {imaging && <div className="imaging-handoff"><span className="handoff-avatar">R</span><div><b>Keep the original report attached to the summary.</b><small>Summaries help with review time; the interpreting clinician remains responsible for the report and its context.</small></div><button className="copy-button" onClick={() => navigator.clipboard?.writeText(imaging.patient_summary)}>Copy summary</button></div>}
  </>;
}

function PatientRecord() {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function loadRecord() {
    setLoading(true); setError('');
    try { setRecord(await request('/api/patient-record/demo')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadRecord(); }, []);
  return <>
    <PageIntro eyebrow="Patient care / Consolidated history" title="One clearer view across hospitals." subtitle="Bring prior reports together and prepare a concise, source-linked summary for a faster clinician review.">
      <button className="button button-secondary" onClick={loadRecord} disabled={loading}><Icon name="records" size={16} /> {loading ? 'Refreshing…' : 'Refresh demo record'}</button>
    </PageIntro>
    <ErrorBanner message={error} onRetry={loadRecord} />
    <div className="record-demo-banner"><span><Icon name="shield" size={16} /></span><div><b>Illustrative consolidated record</b><small>Fictional patient data only. This demo groups sample reports; it does not scan or connect to hospital records.</small></div><span className="synthetic-tag">SYNTHETIC</span></div>
    {loading && <div className="loading-panel"><span className="loading-spinner" /> Gathering the sample reports…</div>}
    {record && <>
      <section className="record-overview-card"><div className="record-person"><span className="record-avatar">A</span><div><small>DEMO PATIENT ID</small><h2>{record.patient.label}</h2><p>{record.facility_count} sample facilities · {record.documents.length} reports</p></div></div><div className="record-facilities"><small>SOURCE FACILITIES</small>{record.facilities.map((facility) => <span key={facility}><Icon name="pin" size={13} />{facility}</span>)}</div></section>
      <section className="record-summary-card"><div className="record-section-heading"><span className="summary-card-icon patient-icon"><Icon name="spark" /></span><div><small>CONCISE CROSS-REPORT SUMMARY</small><h2>Review highlights</h2></div><span className="ai-badge"><Icon name="spark" size={12} /> DEMO SUMMARY</span></div><p>{record.record_summary}</p><div className="record-summary-foot"><Icon name="shield" size={14} /> Always verify against the original report and patient context.</div></section>
      <section className="record-documents"><div className="record-section-heading"><div><small>CONSOLIDATED DOCUMENTS</small><h2>Reports from the patient history</h2></div><span>{record.documents.length} documents</span></div><div className="record-document-list">{record.documents.map((doc) => <article className="record-document" key={doc.id}><span className="document-icon"><Icon name="report" size={17} /></span><div className="record-document-main"><div><b>{doc.panel}</b><span className="final-status"><i /> {doc.status}</span></div><p>{doc.date} · {doc.facility}</p><small>{doc.clinician_summary}</small></div><button className="copy-button" onClick={() => navigator.clipboard?.writeText(doc.clinician_summary)}>Copy summary</button></article>)}</div></section>
      <p className="synthetic-footnote">{record.disclaimer}</p>
    </>}
  </>;
}

function UltrasoundRequest() {
  const [form, setForm] = useState({ patient: 'Demo patient · A-104', clinician: '', study: '', indication: '', priority: 'Routine', notes: '' });
  const [saved, setSaved] = useState(false);
  const update = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setSaved(false); };
  function submit(event) {
    event.preventDefault();
    if (event.currentTarget.reportValidity()) setSaved(true);
  }
  return <>
    <PageIntro eyebrow="Patient care / Digital clinical request" title="Turn paper ultrasound forms into a clear draft." subtitle="Capture the request details in one place so centre staff can route it for clinician review."><span className="synthetic-tag">DEMO DRAFT</span></PageIntro>
    <div className="record-demo-banner"><span><Icon name="shield" size={16} /></span><div><b>Request capture only</b><small>This form does not place an order, choose a protocol, assess urgency or book an appointment.</small></div></div>
    <div className="ultrasound-layout"><form className="ultrasound-form-card" onSubmit={submit}><div className="record-section-heading"><div><small>DIGITAL REQUEST FORM</small><h2>Ultrasound request details</h2></div><span className="synthetic-tag">SYNTHETIC CASE</span></div><div className="ultrasound-fields">
      <label>Patient reference<input required value={form.patient} onChange={update('patient')} /></label>
      <label>Referring clinician<input required placeholder="Clinician name" value={form.clinician} onChange={update('clinician')} /></label>
      <label>Requested study<input required placeholder="e.g. Abdomen ultrasound" value={form.study} onChange={update('study')} /></label>
      <label>Priority<select value={form.priority} onChange={update('priority')}><option>Routine</option><option>As stated by clinician</option></select></label>
      <label className="ultrasound-wide">Clinical indication<textarea required rows="3" placeholder="Enter the indication as provided by the referring clinician" value={form.indication} onChange={update('indication')} /></label>
      <label className="ultrasound-wide">Additional notes<textarea rows="2" placeholder="Optional request notes" value={form.notes} onChange={update('notes')} /></label>
    </div><div className="ultrasound-form-footer"><small>Draft is kept only in this browser session.</small><button className="button button-primary" type="submit"><Icon name="plus" size={15} /> Save request draft</button></div>
      {saved && <div className="request-saved" role="status"><Icon name="shield" size={16} /><div><b>Draft ready for clinician review</b><small>{form.study} · {form.patient} · No request was sent or scheduled.</small></div></div>}
    </form><aside className="request-review-card"><span className="knowledge-icon"><Icon name="records" /></span><small>WORKFLOW PREVIEW</small><h3>From paper to review</h3><ol><li className="step-done"><span>1</span><div><b>Details captured</b><small>Structured request draft</small></div></li><li><span>2</span><div><b>Clinician review</b><small>Confirm indication and request</small></div></li><li><span>3</span><div><b>Centre follow-up</b><small>Handled by authorised staff</small></div></li></ol><p>Clinical decisions and order approval stay with the referring clinician.</p></aside></div>
  </>;
}

function PatientAssistant({}) {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  async function startSession() {
    setError('');
    try {
      const data = await request('/api/session', { method: 'POST', body: JSON.stringify({}) });
      setSessionId(data.session_id);
      setMessages([{ role: 'assistant', content: data.greeting }]);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { startSession(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages]);

  async function sendMessage(text = value) {
    const message = text.trim();
    if (!message || sending) return;
    setValue(''); setError(''); setSending(true);
    setMessages((current) => [...current, { role: 'user', content: message }, { role: 'assistant', content: '', pending: true }]);
    try {
      const data = await request('/api/chat', { method: 'POST', body: JSON.stringify({ session_id: sessionId, message }) });
      setSessionId(data.session_id);
      setMessages((current) => [...current.slice(0, -1), { role: 'assistant', content: data.reply, handoff: data.handoff }]);
    } catch (err) {
      setMessages((current) => current.slice(0, -1));
      setError(err.message);
    } finally { setSending(false); }
  }

  const suggestions = ['Do you offer a CBC test?', 'Can I request a home collection?', 'Can you explain my report?'];
  return <>
    <PageIntro eyebrow="Centre operations / Patient assistant" title="A helpful first response, any time." subtitle="Handle routine service questions, collect requests and route clinical questions to the care team."><button className="button button-secondary" onClick={startSession}>Start new conversation</button></PageIntro>
    <ErrorBanner message={error} />
    <div className="patient-chat-layout"><div className="patient-chat-card"><div className="chat-card-header"><div className="assistant-avatar"><Icon name="spark" size={18} /></div><div><b>MediAgent patient assistant</b><small><i /> Available · demo centre</small></div><span className="synthetic-tag">SIMULATED</span></div><div className="chat-transcript" aria-live="polite">{messages.map((message, index) => <div key={`${index}-${message.role}`} className={`chat-bubble-row ${message.role === 'user' ? 'from-patient' : 'from-agent'}`}><span className={`bubble-avatar ${message.role === 'user' ? 'patient-bubble-avatar' : ''}`}>{message.role === 'user' ? 'P' : 'M'}</span><div className="bubble-content"><small>{message.role === 'user' ? 'PATIENT' : 'MediAgent ASSISTANT'}</small><p>{message.pending ? <span className="typing-dots"><i /><i /><i /></span> : message.content}</p>{message.handoff && <span className="handoff-inline"><Icon name="shield" size={12} /> Routed for human review</span>}</div></div>)}<div ref={bottomRef} /></div><div className="chat-suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)} disabled={sending}>{suggestion}</button>)}</div><form className="chat-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}><input aria-label="Message the patient assistant" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Ask about a test, collection, or next step…"/><button type="submit" disabled={!value.trim() || sending} aria-label="Send message"><Icon name="arrow" size={17} /></button><small>Demo only · Avoid entering real patient information</small></form></div><aside className="assistant-side-panel"><div className="side-panel-card"><div className="card-kicker">WHAT THE ASSISTANT CAN DO</div><ul className="capability-checklist"><li><span>✓</span><div><b>Answer approved questions</b><small>Services, packages, timings and branch details</small></div></li><li><span>✓</span><div><b>Capture a service request</b><small>Test, preferred branch and collection details</small></div></li><li><span>✓</span><div><b>Hand off sensitive questions</b><small>Clinical interpretation stays with clinicians</small></div></li></ul></div><div className="side-panel-card safe-card"><span className="safe-icon"><Icon name="shield" size={18} /></span><b>Designed around human review</b><p>The assistant can organize information and prepare a handoff. It does not make clinical decisions.</p></div></aside></div>
  </>;
}

function KnowledgePage() {
  return <>
    <PageIntro eyebrow="Centre setup / Approved knowledge" title="Your centre’s approved information." subtitle="This sample configuration powers the service answers in the patient assistant." />
    <div className="knowledge-grid"><article><span className="knowledge-icon"><Icon name="report" /></span><small>TEST DIRECTORY</small><h3>Tests &amp; packages</h3><p>CBC, basic metabolic panel, thyroid profile and health-checkup packages.</p><button>View sample tests <Icon name="arrow" size={14} /></button></article><article><span className="knowledge-icon"><Icon name="clock" /></span><small>CENTRE OPERATIONS</small><h3>Hours &amp; branches</h3><p>Hyderabad centre · 7:00 AM–7:00 PM · Monday through Saturday.</p><button>View centre details <Icon name="arrow" size={14} /></button></article><article><span className="knowledge-icon"><Icon name="shield" /></span><small>SAFE RESPONSE RULES</small><h3>Clinical boundaries</h3><p>Use report-provided intervals, summarize cautiously and route clinical decisions to qualified staff.</p><button>Review response rules <Icon name="arrow" size={14} /></button></article></div>
  </>;
}

export default function App() {
  const [page, setPage] = useState('review');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState('report-current');
  const [analysis, setAnalysis] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [imaging, setImaging] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compareFirst, setCompareFirst] = useState('report-previous');
  const [compareSecond, setCompareSecond] = useState('report-current');

  useEffect(() => {
    request('/api/reports').then((data) => setReports(data.items)).catch((err) => setError(err.message));
  }, []);

  async function loadAnalysis(reportId = selectedId) {
    setSelectedId(reportId); setLoading(true); setError(''); setAnalysis(null);
    try { setAnalysis(await request('/api/reports/summarize', { method: 'POST', body: JSON.stringify({ report_id: reportId }) })); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (reports.length) loadAnalysis(selectedId); }, [reports]);
  useEffect(() => { if (page === 'review' && reports.some((report) => report.id === selectedId)) loadAnalysis(selectedId); }, [selectedId]);

  async function loadComparison(first = compareFirst, second = compareSecond) {
    setLoading(true); setError(''); setComparison(null);
    try { setComparison(await request('/api/reports/compare', { method: 'POST', body: JSON.stringify({ first_report_id: first, second_report_id: second }) })); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (page === 'compare' && reports.length) loadComparison(); }, [page, reports]);
  useEffect(() => { if (page === 'compare' && reports.length) loadComparison(compareFirst, compareSecond); }, [compareFirst, compareSecond]);

  async function loadImaging() {
    setLoading(true); setError('');
    try { setImaging(await request('/api/imaging/sample')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (page === 'imaging' && !imaging) loadImaging(); }, [page]);

  const pageTitle = useMemo(() => ({ review: 'Report review', records: 'Patient record', compare: 'Compare reports', imaging: 'Imaging summary', ultrasound: 'Ultrasound request', patient: 'Patient inquiries', settings: 'Centre knowledge' }[page] || 'Report review'), [page]);
  const closeMenu = () => setMobileNavOpen(false);

  return <div className={`app-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
    <Sidebar page={page} setPage={setPage} open={mobileNavOpen} close={closeMenu} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)} />
    <div className="workspace-main"><Header pageTitle={pageTitle} onMenu={() => setMobileNavOpen((open) => !open)} /><main className="workspace-content">
      <div className="environment-banner"><span><Icon name="shield" size={15} /></span><p><b>Prototype environment</b><i>All records, values and imaging examples are synthetic demo data.</i></p><button onClick={() => setPage('settings')}>About data <Icon name="arrow" size={13} /></button></div>
      {page === 'review' && <ReportReview reports={reports} selectedId={selectedId} setSelectedId={setSelectedId} analysis={analysis} loading={loading} error={error} reload={() => loadAnalysis()} setPage={setPage} />}
      {page === 'records' && <PatientRecord />}
      {page === 'compare' && <CompareReports reports={reports} comparison={comparison} loading={loading} error={error} firstId={compareFirst} secondId={compareSecond} setFirstId={setCompareFirst} setSecondId={setCompareSecond} reload={() => loadComparison()} />}
      {page === 'imaging' && <ImagingSummary imaging={imaging} loading={loading} error={error} reload={loadImaging} />}
      {page === 'ultrasound' && <UltrasoundRequest />}
      {page === 'patient' && <PatientAssistant />}
      {page === 'settings' && <KnowledgePage />}
    </main><footer className="workspace-footer"><span>MediAgent healthcare AI · prototype</span><span>Synthetic data only <i /> Local demo service</span></footer></div>
  </div>;
}
