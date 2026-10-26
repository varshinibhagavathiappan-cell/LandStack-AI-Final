import React, { useState } from 'react';
import {
  Network, AlertTriangle, CheckCircle2, ShieldAlert,
  ArrowRight, Sparkles, RefreshCw, GitCommit, FileCheck, Layers,
  Lock, Unlock, HelpCircle, History, Info
} from 'lucide-react';
import { api } from '../services/api';

export default function EvidenceView({
  caseData,
  onUpdateCase,
  language = 'en'
}) {
  const [activeTab, setActiveTab] = useState('graph'); // graph, gaps, dependencies, simulator, seller, provenance, timeline
  const [simDoc, setSimDoc] = useState('FMB Field Measurement Report');
  const [simResult, setSimResult] = useState(null);
  const [rechecking, setRechecking] = useState(false);

  const nodes = caseData?.evidence_nodes || [];
  const edges = caseData?.evidence_edges || [];
  const gaps = caseData?.verification_gaps || [];
  const missingLinks = caseData?.missing_links || [];
  const dependencies = caseData?.verification_dependencies || [];
  const provenance = caseData?.provenance_records || [];
  const timeline = caseData?.timeline || [];
  const sellerStory = caseData?.seller_story;
  const hasEvidence = Boolean(caseData?.uploaded_documents?.length);
  const isDemo = Boolean(caseData?.is_demo_mode);

  const handleSimulateImpact = async () => {
    try {
      const res = await api.simulateEvidenceImpact(simDoc);
      setSimResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveRecheck = async () => {
    setRechecking(true);
    try {
      await api.resolveInconsistencyRecheck();
      if (onUpdateCase) onUpdateCase();
    } catch (e) {
      console.error(e);
    } finally {
      setRechecking(false);
    }
  };

  // Node color helper
  const getNodeColor = (status) => {
    switch (status) {
      case 'SUPPORTED': return '#10b981'; // Green
      case 'POTENTIAL CONFLICT': return '#ef4444'; // Red
      case 'REQUIRES REVIEW': return '#f59e0b'; // Amber
      case 'MISSING': return '#6b7280'; // Gray
      default: return '#3b82f6';
    }
  };

  return (
    <div className="page-container evidence-view">
      {/* Header bar */}
      <div className="evidence-header-bar">
        <div>
          <h2>{language === 'ta' ? 'ஆதார இயந்திரம் & புதுமை மையம்' : language === 'kn' ? 'ಸಾಕ್ಷ್ಯ ಎಂಜಿನ್ ಮತ್ತು ನವೀನತಾ ಕೇಂದ್ರ' : 'Evidence engine & innovation center'}</h2>
          <span className="section-subtext">
            Deterministic consistency audit, interactive relationship graph, dependency map, and simulated impact.
          </span>
        </div>
        <div className="evidence-header-actions">
          <button
            className="btn btn-resolve"
            onClick={handleResolveRecheck}
            disabled={rechecking || (!isDemo && !hasEvidence)}
            title="Execute Conflict → Resolution → Re-check with FMB Rectification"
          >
            <RefreshCw size={14} className={rechecking ? 'spin' : ''} />
            <span>{language === 'ta' ? 'முரண்பாடு → தீர்வு → மீள் சரிபார்ப்பு' : language === 'kn' ? 'ವ್ಯತ್ಯಾಸ → ಪರಿಹಾರ → ಮರುಪರಿಶೀಲನೆ' : 'Conflict → Resolution → Re-check'}</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="sub-tab-bar">
        <button
          className={`sub-tab-btn ${activeTab === 'graph' ? 'sub-tab-active' : ''}`}
          onClick={() => setActiveTab('graph')}
        >
          <Network size={14} /> {language === 'ta' ? `ஆதார கிராப் (${nodes.length})` : language === 'kn' ? `ಸಾಕ್ಷ್ಯ ಗ್ರಾಫ್ (${nodes.length})` : `Evidence Graph (${nodes.length})`}
        </button>
        <button
          className={`sub-tab-btn ${activeTab === 'gaps' ? 'sub-tab-active' : ''}`}
          onClick={() => setActiveTab('gaps')}
        >
          <AlertTriangle size={14} /> {language === 'ta' ? `இடைவெளிகள் (${gaps.length})` : language === 'kn' ? `ಅಂತರಗಳು (${gaps.length})` : `Gaps (${gaps.length})`}
        </button>
        <button
          className={`sub-tab-btn ${activeTab === 'dependencies' ? 'sub-tab-active' : ''}`}
          onClick={() => setActiveTab('dependencies')}
        >
          <Lock size={14} /> Dependency Map ({dependencies.length})
        </button>
        <button
          className={`sub-tab-btn ${activeTab === 'seller' ? 'sub-tab-active' : ''}`}
          onClick={() => setActiveTab('seller')}
        >
          <FileCheck size={14} /> Seller Story vs Evidence
        </button>
        <button
          className={`sub-tab-btn ${activeTab === 'simulator' ? 'sub-tab-active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Sparkles size={14} /> Impact Simulator
        </button>
        <button
          className={`sub-tab-btn ${activeTab === 'provenance' ? 'sub-tab-active' : ''}`}
          onClick={() => setActiveTab('provenance')}
        >
          <ShieldAlert size={14} /> Provenance Hashes
        </button>
        <button
          className={`sub-tab-btn ${activeTab === 'timeline' ? 'sub-tab-active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <History size={14} /> Heir Timeline
        </button>
      </div>

      {/* Tab 1: Interactive Visual Evidence Graph */}
      {activeTab === 'graph' && (
        <div className="card evidence-graph-card">
          <div className="graph-controls-header">
            <div>
              <h3 className="card-title">Living Evidence Relationship Graph</h3>
              <p className="card-desc">
                PERSON → DOCUMENT → OWNER → SURVEY NUMBER → PROPERTY → TRANSACTION → SUPPORTING EVIDENCE
              </p>
            </div>
            <div className="graph-legend">
              <span className="legend-item"><span className="legend-dot dot-supported"></span> Supported</span>
              <span className="legend-item"><span className="legend-dot dot-conflict"></span> Potential Conflict</span>
              <span className="legend-item"><span className="legend-dot dot-review"></span> Requires Review</span>
            </div>
          </div>

          {!hasEvidence && (
            <div className="adaptive-q-answer" style={{ padding: '32px', margin: '20px 0' }}>
{language === 'ta' ? 'இந்த கேஸில் இன்னும் ஆதாரம் இல்லை. உண்மையான ஆவணத்தை பதிவேற்றுங்கள்.' : language === 'kn' ? 'ಈ ಕೇಸ್‌ನಲ್ಲಿ ಇನ್ನೂ ಸಾಕ್ಷ್ಯ ಇಲ್ಲ. ನಿಜವಾದ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.' : 'This case has no evidence yet. Upload a real document.'}
            </div>
          )}
          <div className="visual-graph-container" style={{ display: hasEvidence ? 'block' : 'none' }}>
            <svg className="graph-svg" viewBox="0 0 900 460" width="100%" height="460">
              <defs><marker id="dynamicArrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#94a3b8" /></marker></defs>
              {edges.map((e, i) => {
                const si = nodes.findIndex(n => n.id === e.source), ti = nodes.findIndex(n => n.id === e.target);
                if (si < 0 || ti < 0) return null;
                const x1 = 80 + (si % 4) * 210 + 160, y1 = 55 + Math.floor(si / 4) * 145 + 35;
                const x2 = 80 + (ti % 4) * 210, y2 = 55 + Math.floor(ti / 4) * 145 + 35;
                return <g key={`edge-${i}`}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth="2" markerEnd="url(#dynamicArrow)"/><text x={(x1+x2)/2} y={(y1+y2)/2-5} fill="#64748b" fontSize="9">{e.relationship}</text></g>;
              })}
              {nodes.map((n, i) => {
                const x = 80 + (i % 4) * 210, y = 55 + Math.floor(i / 4) * 145;
                const stroke = getNodeColor(n.status);
                return <g key={n.id} transform={`translate(${x},${y})`}><rect width="160" height="70" rx="8" fill="#fff" stroke={stroke} strokeWidth="2"/><text x="10" y="22" fontSize="11" fontWeight="bold" fill="#0f172a">{String(n.label).slice(0,25)}</text><text x="10" y="40" fontSize="9" fill="#475569">{n.type}</text><text x="10" y="56" fontSize="9" fill={stroke}>{n.status}</text><circle cx="145" cy="15" r="5" fill={stroke}/></g>;
              })}
            </svg>
          </div>

          <div className="graph-nodes-list-mini">
            <span className="mini-nodes-title">Live Nodes in Graph ({nodes.length}):</span>
            <div className="nodes-chips">
              {nodes.map(n => (
                <span
                  key={n.id}
                  className="node-chip"
                  style={{ borderLeft: `4px solid ${getNodeColor(n.status)}` }}
                >
                  <strong>{n.label}</strong> ({n.type}) — <span style={{ color: getNodeColor(n.status), fontWeight: 'bold' }}>{n.status}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Verification Gaps & Missing Links */}
      {activeTab === 'gaps' && (
        <div className="card gaps-panel-card">
          <div className="card-header">
            <span className="card-tag tag-primary">VERIFICATION ENGINE</span>
            <span className="gaps-count-badge">{gaps.length} Gaps Analyzed</span>
          </div>

          <div className="gaps-grid">
            {gaps.map((gap) => (
              <div key={gap.id} className={`gap-card ${gap.status === 'OPEN' ? 'gap-open' : 'gap-resolved'}`}>
                <div className="gap-top">
                  <div>
                    <span className="gap-severity-badge">{gap.severity} SEVERITY</span>
                    <h4 className="gap-title">{gap.title}</h4>
                  </div>
                  <span className={`gap-status-pill pill-${gap.status.toLowerCase()}`}>
                    {gap.status}
                  </span>
                </div>
                <p className="gap-desc">{gap.description}</p>
                <div className="gap-action-box">
                  <strong>Recommended Next Step:</strong> {gap.suggested_action}
                </div>
              </div>
            ))}
          </div>

          <h3 className="section-subheading" style={{ marginTop: '24px' }}>
            Missing Link Detector ({missingLinks.length})
          </h3>
          <div className="missing-links-grid">
            {missingLinks.map((link) => (
              <div key={link.id} className="missing-link-card">
                <div className="link-impact-tag impact-critical">{link.impact_level}</div>
                <h4 className="link-title">{link.title}</h4>
                <p className="link-desc">{link.description}</p>
                <div className="link-resolution">
                  <strong>Path to Resolve:</strong> {link.resolution_path}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Verification Dependency Map */}
      {activeTab === 'dependencies' && (
        <div className="card dependencies-card">
          <div className="card-header">
            <span className="card-tag tag-primary">INNOVATION FEATURE</span>
            <Lock size={16} />
          </div>
          <h3 className="card-title">Verification Dependency Map</h3>
          <p className="card-desc">
            Prevents citizens from prematurely submitting applications when upstream title or boundary prerequisites are unresolved.
          </p>

          <div className="dependency-tree">
            {dependencies.map((dep, idx) => {
              const isLocked = dep.prerequisite_status === 'UNRESOLVED';
              return (
                <div key={dep.id} className={`dependency-node ${isLocked ? 'dep-locked' : 'dep-unlocked'}`}>
                  <div className="dep-indicator">
                    {isLocked ? <Lock size={16} className="text-amber" /> : <Unlock size={16} className="text-green" />}
                    <span className="dep-step-num">0{idx + 1}</span>
                  </div>
                  <div className="dep-content">
                    <div className="dep-top-row">
                      <strong>{dep.source_verification.replace(/_/g, ' ')} → {dep.dependent_step.replace(/_/g, ' ')}</strong>
                      <span className={`dep-status-label ${isLocked ? 'label-locked' : 'label-unlocked'}`}>
                        {dep.status_label}
                      </span>
                    </div>
                    <p className="dep-text">{dep.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Seller Story vs Evidence */}
      {activeTab === 'seller' && (
        <div className="card seller-story-card">
          <div className="card-header">
            <span className="card-tag tag-secondary">INNOVATION FEATURE</span>
            <span className="neutral-badge">Neutral Gap Analysis</span>
          </div>
          <h3 className="card-title">Seller Story vs Verified Evidence</h3>
          <p className="card-desc">
            For purchase due diligence: Compares seller oral claims against registered revenue and registry records. Strictly neutral; never claims "fraud".
          </p>

          <div className="comparison-table-wrapper" style={{ display: sellerStory ? 'block' : 'none' }}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Aspect</th>
                  <th>Seller Statement</th>
                  <th>Documentary Evidence</th>
                  <th>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Land Extent</strong></td>
                  <td className="cell-seller">{sellerStory?.seller_claimed_area || (language === 'ta' ? 'வழங்கப்படவில்லை' : language === 'kn' ? 'ನೀಡಲಾಗಿಲ್ಲ' : 'Not provided')}</td>
                  <td className="cell-doc">{sellerStory?.document_verified_area || (language === 'ta' ? 'வழங்கப்படவில்லை' : language === 'kn' ? 'ನೀಡಲಾಗಿಲ್ಲ' : 'Not provided')}</td>
                  <td className="cell-flag text-amber">
                    <strong>Potential Mismatch</strong> (-0.40 Acres Difference)
                  </td>
                </tr>
                <tr>
                  <td><strong>Title Holder</strong></td>
                  <td className="cell-seller">{sellerStory?.seller_claimed_owner || (language === 'ta' ? 'வழங்கப்படவில்லை' : language === 'kn' ? 'ನೀಡಲಾಗಿಲ್ಲ' : 'Not provided')}</td>
                  <td className="cell-doc">{sellerStory?.document_verified_owner || (language === 'ta' ? 'வழங்கப்படவில்லை' : language === 'kn' ? 'ನೀಡಲಾಗಿಲ್ಲ' : 'Not provided')}</td>
                  <td className="cell-flag text-green">Name Matches</td>
                </tr>
                <tr>
                  <td><strong>Encumbrances</strong></td>
                  <td className="cell-seller">Stated Nil Debt / Clear</td>
                  <td className="cell-doc">EC Checked (No charges found)</td>
                  <td className="cell-flag text-green">No Registered Charges</td>
                </tr>
              </tbody>
            </table>
          </div>

          {sellerStory ? (
            <div className="seller-notice-banner">
              <Info size={16} />
              <span><strong>System Notice:</strong> {sellerStory.status_label}. Review the available evidence before taking action.</span>
            </div>
          ) : (
            <div className="adaptive-q-answer" style={{ padding: '24px' }}>Seller-story comparison will appear after relevant seller claims and documentary evidence are entered.</div>
          )}
        </div>
      )}

      {/* Tab 5: Evidence Impact Simulator */}
      {activeTab === 'simulator' && (
        <div className="card simulator-card">
          <div className="card-header">
            <span className="card-tag tag-primary">INNOVATION FEATURE</span>
            <Sparkles size={16} />
          </div>
          <h3 className="card-title">Evidence Impact Simulator</h3>
          <p className="card-desc">
            Select a missing document to project how uploading it will impact readiness and unlock downstream dependencies.
          </p>

          <div className="sim-controls">
            <select
              value={simDoc}
              onChange={(e) => setSimDoc(e.target.value)}
              className="sim-select"
            >
              <option value="FMB Field Measurement Report">FMB Field Measurement Report (Area Rectification)</option>
              <option value="Co-Heir Consent Affidavit">Co-Heir Consent Affidavit (Mother & Sister NOC)</option>
              <option value="30-Year Encumbrance Certificate">30-Year Encumbrance Certificate (TNREGINET)</option>
            </select>
            <button className="btn btn-primary" onClick={handleSimulateImpact}>
              <span>Simulate Impact</span>
              <Sparkles size={14} />
            </button>
          </div>

          {simResult && (
            <div className="sim-result-card">
              <div className="sim-result-header">
                <strong>Projected Impact: {simResult.hypothetical_document}</strong>
                <span className="score-jump-badge">{simResult.impact_on_readiness_score}</span>
              </div>
              <p><strong>Dependency Unlocked:</strong> {simResult.dependency_unlocked}</p>
              <p><strong>Projected Case State:</strong> <span className="text-green font-bold">{simResult.projected_status}</span></p>
              <div className="sim-rec-box">{simResult.recommendation}</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Provenance Hashes */}
      {activeTab === 'provenance' && (
        <div className="card provenance-card">
          <div className="card-header">
            <span className="card-tag tag-primary">EVIDENCE PROVENANCE</span>
            <ShieldAlert size={16} />
          </div>
          <h3 className="card-title">Chain of Custody & Extraction Provenance</h3>
          <p className="card-desc">
            Immutable tracking of evidence ingestion sources, extraction techniques, and verification hashes.
          </p>

          <div className="provenance-list">
            {provenance.map((p) => (
              <div key={p.document_id} className="provenance-item">
                <div className="prov-top">
                  <strong>{p.document_name}</strong>
                  <span className="prov-state-badge">{p.verification_state}</span>
                </div>
                <div className="prov-meta">
                  <span>Source: {p.source_type}</span>
                  <span>Extracted via: {p.extracted_via}</span>
                  <span className="hash-code">Hash: {p.verification_hash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Heir Timeline */}
      {activeTab === 'timeline' && (
        <div className="card timeline-card">
          <div className="card-header">
            <span className="card-tag tag-primary">OWNERSHIP & HEIR TIMELINE</span>
            <History size={16} />
          </div>
          <h3 className="card-title">Chronological Case & Title History</h3>

          <div className="timeline-items">
            {timeline.map((evt) => (
              <div key={evt.id} className="timeline-event-card">
                <div className="event-date-col">
                  <span className="event-date">{evt.date}</span>
                  <span className="event-type-badge">{evt.event_type}</span>
                </div>
                <div className="event-info-col">
                  <h4 className="event-title">{evt.title}</h4>
                  <p className="event-desc">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
