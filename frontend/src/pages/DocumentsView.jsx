import React, { useState } from 'react';
import {
  Upload, FileText, CheckCircle2, AlertCircle, HelpCircle,
  Eye, Download, Send, Camera, ShieldCheck, Copy, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { t } from '../i18n';

export default function DocumentsView({
  caseData,
  onUpdateCase,
  language = 'en',
  onNavigate
}) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [explainerDoc, setExplainerDoc] = useState(null);
  const [requestDocType, setRequestDocType] = useState('');
  const [recipientType, setRecipientType] = useState('SELLER');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const checklist = caseData?.checklist || [];
  const uploadedDocs = caseData?.uploaded_documents || [];
  const missingChecklist = checklist.filter((item) => item.status !== 'AVAILABLE');


  const localizedDocName = (item) => {
    if (language === 'ta' && item.name_ta) return item.name_ta;
    if (language === 'kn') {
      const m = {
        REGISTERED_SALE_DEED:'ನೋಂದಾಯಿತ ಮಾರಾಟ / ಮಾಲೀಕತ್ವದ ದಾಖಲೆ', RTC_PAHAANI:'RTC / ಪಹಣಿ ದಾಖಲೆ', CHITTA:'ಚಿಟ್ಟಾ ದಾಖಲೆ', ADANGAL:'ಅಡಂಗಲ್ ದಾಖಲೆ', MUTATION_RECORD:'ಮ್ಯೂಟೇಶನ್ ದಾಖಲೆ / ಸ್ಥಿತಿ', ENCUMBRANCE_CERTIFICATE:'ವಿಲ್ಲಂಬಣ ಪ್ರಮಾಣಪತ್ರ (EC)', SURVEY_ATLAS_PT_SHEET:'ಸರ್ವೇ / ಅಟ್ಲಾಸ್ / PT ಶೀಟ್ ಮಾಹಿತಿ', KHATA_RECORD:'ಖಾತಾ / e-Aasthi ಅಥವಾ ಅನ್ವಯಿಸುವ ನಗರ ದಾಖಲೆ', PROPERTY_TAX_RECORD:'ಆಸ್ತಿ ತೆರಿಗೆ ದಾಖಲೆ', TITLE_DEED:'ನೋಂದಾಯಿತ ಹಕ್ಕುಪತ್ರ', EXISTING_PATTA:'ಪ್ರಸ್ತುತ ಭೂ ದಾಖಲೆ', FMB_SKETCH:'FMB / ಸರ್ವೇ ದಾಖಲೆ', PARENT_DEEDS:'ಹಿಂದಿನ / ಲಿಂಕ್ ದಾಖಲೆಗಳು', DEATH_CERTIFICATE:'ಮರಣ ಪ್ರಮಾಣಪತ್ರ', LEGAL_HEIR_CERTIFICATE:'ಕಾನೂನು ವಾರಸುದಾರರ ದಾಖಲೆ', LEGAL_HEIR_EVIDENCE:'ಅನ್ವಯಿಸುವ ಕಾನೂನು ವಾರಸುದಾರರ ಸಾಕ್ಷ್ಯ'
      };
      return m[item.doc_type] || item.name;
    }
    return item.name;
  };
  const localizedPurpose = (item) => {
    if (language === 'ta') return 'இந்த ஆவணம் கேஸ் தேவைக்கு ஏன் பொருந்துகிறது என்பதை சரிபார்க்கவும்.';
    if (language === 'kn') return 'ಈ ದಾಖಲೆ ಕೇಸ್ ಅಗತ್ಯಕ್ಕೆ ಏಕೆ ಸಂಬಂಧಿಸಿದೆ ಎಂಬುದನ್ನು ಪರಿಶೀಲಿಸಿ.';
    return item.purpose;
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadDocument(file, file.name, language);
      if (onUpdateCase) onUpdateCase();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSimulateUpload = async (demoFileName) => {
    setUploading(true);
    try {
      await api.uploadDocument(null, demoFileName, language);
      if (onUpdateCase) onUpdateCase();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateLetter = async () => {
    try {
      const res = await api.generateEvidenceRequest(
        requestDocType,
        recipientType,
        caseData?.citizen_name || '',
        caseData?.property_passport?.survey_number || '',
        caseData?.district || ''
      );
      setGeneratedLetter(res.letter_text);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container documents-view">
      <div className="section-title-bar">
        <div>
          <h2>{t(language,'docsTitle')}</h2>
          <span className="section-subtext">
            Upload, inspect OCR extractions, understand unfamiliar land terms, and track checklist status.
          </span>
        </div>
      </div>
      {uploadedDocs.length > 0 && (
        <div className="card" style={{marginBottom:16,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <strong>{language === 'ta' ? 'இந்த case-ன் அடுத்த படி:' : language === 'kn' ? 'ಈ ಕೇಸ್‌ನ ಮುಂದಿನ ಹಂತ:' : 'Next step for this case:'}</strong>
          <button type="button" className="btn btn-primary" onClick={()=>onNavigate && onNavigate('evidence')}>🔎 {language === 'ta' ? 'Evidence analysis தொடரவும்' : language === 'kn' ? 'ಸಾಕ್ಷ್ಯ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಮುಂದುವರಿಸಿ' : 'Continue to evidence analysis'}</button>
          <a className="btn btn-outline" href={api.getCaseFileUrl()} target="_blank" rel="noreferrer"><Download size={14}/> {language === 'ta' ? 'Case File பார்க்க / Download' : language === 'kn' ? 'ಕೇಸ್ ಫೈಲ್ ನೋಡಿ / ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'View / Download Case File'}</a>
        </div>
      )}

      {uploadedDocs.length >= 2 && <div className="card" style={{marginBottom:16}}>
        <div className="section-title-row"><h3>🔄 {language === 'ta' ? 'ஆவண ஒப்பீடு' : language === 'kn' ? 'ದಾಖಲೆ ಹೋಲಿಕೆ' : 'Cross-document comparison'}</h3><button className="btn btn-outline" disabled={comparisonLoading} onClick={async()=>{setComparisonLoading(true);try{setComparison(await api.compareDocuments())}catch(e){console.error(e)}finally{setComparisonLoading(false)}}}>{comparisonLoading?'...':(language==='ta'?'ஒப்பிடு':language==='kn'?'ಹೋಲಿಸಿ':'Compare now')}</button></div>
        <p className="card-desc">{language==='ta'?'Patta, Chitta, Adangal, Sale Deed, EC போன்ற upload செய்யப்பட்ட பதிவுகளில் extract ஆன உண்மையான தகவல்களை மட்டும் ஒப்பிடுகிறது.':language==='kn'?'ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳಿಂದ ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ ಪಡೆದ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ಹೋಲಿಸುತ್ತದೆ.':'Compares only facts reliably extracted from the documents currently uploaded to this case.'}</p>
        {comparison && <div>{comparison.comparisons?.length ? comparison.comparisons.map((c,i)=><div key={i} className="warning-box" style={{marginTop:8}}><strong>{c.status === 'CONSISTENT' ? '✓ ' : '⚠ '}{c.field.replace(/_/g,' ')}</strong><div>{c.message}</div>{c.values?.map(([doc,val],j)=><div key={j}><small>{doc}: {String(val)}</small></div>)}</div>) : <div className="inline-notice">{language==='ta'?'ஒப்பிடக்கூடிய முரண்பாடு கண்டறியப்படவில்லை.':'No cross-document inconsistency was detected in the extracted fields.'}</div>}</div>}
      </div>}

      <div className="docs-two-col-layout">
        {/* Left Column: Personalized Document Checklist */}
        <div className="docs-left-col">
          <div className="card">
            <div className="card-header">
              <span className="card-tag tag-primary">CHECKLIST</span>
              <span className="checklist-ratio">
                {uploadedDocs.length} of {checklist.length} Available
              </span>
            </div>
            <h3 className="card-title">Personalized Document Checklist</h3>
            <p className="card-desc">
              Determined by your case intent: <strong>{caseData?.intent_title}</strong>.
            </p>

            <div className="checklist-items">
              {checklist.map((item) => {
                const isAvailable = item.status === 'AVAILABLE';
                return (
                  <div
                    key={item.id}
                    className={`checklist-item-card ${isAvailable ? 'item-available' : 'item-missing'}`}
                  >
                    <div className="item-status-icon">
                      {isAvailable ? (
                        <CheckCircle2 size={18} className="text-green" />
                      ) : (
                        <AlertCircle size={18} className="text-amber" />
                      )}
                    </div>
                    <div className="item-body">
                      <div className="item-title-row">
                        <strong className="item-name">
                          {localizedDocName(item)}
                        </strong>
                        <span className={`status-pill pill-${item.status.toLowerCase().replace(' ', '-')}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="item-purpose">{localizedPurpose(item)}</p>
                      <div className="item-footer-meta">
                        <span>{language === 'ta' ? 'வழங்கும் அதிகாரம்:' : language === 'kn' ? 'ನೀಡುವ ಪ್ರಾಧಿಕಾರ:' : 'Issuing authority:'} {item.issuing_authority}</span>
                        {item.alternative && <span className="alt-text">{language === 'ta' ? 'மாற்று:' : language === 'kn' ? 'ಪರ್ಯಾಯ:' : 'Alternative:'} {item.alternative}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Evidence Request Generator */}
          <div className="card letter-generator-card">
            <div className="card-header">
              <span className="card-tag tag-secondary">INNOVATION TOOL</span>
              <Sparkles size={16} />
            </div>
            <h3 className="card-title">Evidence Request Generator</h3>
            <p className="card-desc">
              Missing documents? Automatically generate formal legal request letters for sellers or Taluk offices.
            </p>

            <div className="generator-controls">
              <div className="input-group">
                <label>Missing Document:</label>
                <select value={requestDocType} onChange={(e) => setRequestDocType(e.target.value)} className="gen-select">
                  <option value="">{language === 'ta' ? 'முதலில் ஒரு உண்மையான missing document தேர்வு செய்யவும்' : language === 'kn' ? 'ಮೊದಲು ನಿಜವಾದ missing document ಆಯ್ಕೆಮಾಡಿ' : 'Select a real missing document first'}</option>
                  {missingChecklist.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Recipient:</label>
                <select
                  value={recipientType}
                  onChange={(e) => setRecipientType(e.target.value)}
                  className="gen-select"
                >
                  <option value="SELLER">{language === 'ta' ? 'நில விற்பவர்' : language === 'kn' ? 'ಜಮೀನು ಮಾರಾಟಗಾರ' : 'Land seller'}</option>
                  <option value="AUTHORITY">{language === 'ta' ? 'தொடர்புடைய அதிகாரி' : language === 'kn' ? 'ಸಂಬಂಧಿತ ಅಧಿಕಾರಿ' : 'Relevant authority'}</option>
                </select>
              </div>

              <button className="btn btn-primary" onClick={handleGenerateLetter} disabled={!requestDocType || !caseData?.citizen_name}>
                <span>Generate Request Letter</span>
                <Send size={14} />
              </button>
            </div>

            {generatedLetter && (
              <div className="generated-letter-box">
                <div className="letter-header">
                  <strong>Generated Formal Letter</strong>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLetter);
                      alert('Letter copied to clipboard!');
                    }}
                  >
                    <Copy size={13} /> Copy Text
                  </button>
                </div>
                <pre className="letter-pre">{generatedLetter}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upload Vault & OCR Intelligence Extraction */}
        <div className="docs-right-col">
          {/* Upload Dropzone */}
          <div className="card upload-dropzone-card">
            <h3 className="card-title">Upload Land Documents</h3>
            <p className="card-desc">
              Supports PDF, JPG, PNG. Extracted with OCR and deterministic Indian land terminology parsers.
            </p>

            <div className="dropzone-box">
              <Upload size={32} className="dropzone-icon" />
              <p>Drag and drop documents here, or click to browse</p>
              <label className="upload-browse-btn">
                <span>Select Files (PDF/Images)</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept=".pdf,image/*"
                />
              </label>
              {uploading && <div className="upload-status-text">Processing OCR extraction...</div>}
            </div>

            <div className="demo-upload-shortcuts" style={{ display: caseData?.is_demo_mode ? 'block' : 'none' }}>
              <span className="shortcut-label">Instant Demo Document Simulators:</span>
              <div className="shortcut-buttons">
                <button
                  type="button"
                  className="demo-doc-btn"
                  onClick={() => handleSimulateUpload('Ramanathan_Registered_Sale_Deed_1998.pdf')}
                >
                  📄 1998 Sale Deed (2.50 Acres)
                </button>
                <button
                  type="button"
                  className="demo-doc-btn"
                  onClick={() => handleSimulateUpload('TamilNilam_Computer_Patta_1842.pdf')}
                >
                  📜 Tamil Nilam Patta (2.10 Acres)
                </button>
                <button
                  type="button"
                  className="demo-doc-btn"
                  onClick={() => handleSimulateUpload('Legal_Heir_Certificate_TN_2024.pdf')}
                >
                  👨‍👩‍👧 Legal Heir Certificate
                </button>
                <button
                  type="button"
                  className="demo-doc-btn"
                  onClick={() => handleSimulateUpload('Death_Certificate_K_Ramanathan.pdf')}
                >
                  ✝️ Death Certificate
                </button>
                <button
                  type="button"
                  className="demo-doc-btn demo-doc-highlight"
                  onClick={() => handleSimulateUpload('FMB_Field_Measurement_Rectification_Report.pdf')}
                >
                  📐 FMB Re-measurement Report (Resolves Gap)
                </button>
              </div>
            </div>
          </div>

          {/* Uploaded Documents List */}
          <div className="card uploaded-vault-card">
            <h3 className="card-title">Uploaded Documents ({uploadedDocs.length})</h3>

            <div className="uploaded-list">
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`uploaded-item-card ${selectedDoc?.id === doc.id ? 'uploaded-item-selected' : ''}`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="doc-icon-box">
                    <FileText size={20} />
                  </div>
                  <div className="doc-item-info">
                    <strong className="doc-item-title">{doc.title}</strong>
                    <div className="doc-item-meta">
                      <span className="doc-tag">{doc.doc_type}</span>
                      <span>Uploaded {doc.uploaded_at}</span>
                      <span className="confidence-tag">OCR {Math.round(doc.ocr_confidence * 100)}%</span>
                    </div>
                  </div>
                  <button
                    className="doc-explain-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExplainerDoc(doc);
                    }}
                    title="Explain this document in simple citizen language"
                  >
                    <HelpCircle size={14} /> Explain
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Document Intelligence / OCR Inspector */}
          {selectedDoc && (
            <div className="card ocr-inspector-card">
              <div className="card-header">
                <span className="card-tag tag-primary">DOCUMENT INTELLIGENCE</span>
                <span className="ai-label-pill">AI-assisted extraction</span>
              </div>
              <h3 className="card-title">{selectedDoc.title}</h3>
              <p className="ocr-disclaimer">
                Extracted via deterministic regex & layout intelligence. Not legally certified.
              </p>

              {Array.isArray(selectedDoc.extracted_fields?.missing_fields) && (
                <div className="card" style={{margin:'12px 0', padding:14}}>
                  <strong>{language === 'ta' ? 'ஆவண ஆய்வு — கிடைத்த / கண்டறியப்படாத விவரங்கள்' : language === 'kn' ? 'ದಾಖಲೆ ಪರಿಶೀಲನೆ — ದೊರೆತ / ಪತ್ತೆಯಾಗದ ವಿವರಗಳು' : 'Document completeness — detected / not reliably extracted'}</strong>
                  <p className="card-desc" style={{marginTop:6}}>
                    {language === 'ta' ? 'காணப்படவில்லை என்பதன் பொருள் இந்த upload-ல் நம்பகமாக extract ஆகவில்லை என்பதே; ஆவணத்தில் உண்மையாக இல்லை என்று அர்த்தமல்ல.' : language === 'kn' ? 'ಪತ್ತೆಯಾಗಿಲ್ಲ ಎಂದರೆ ಈ upload ನಿಂದ ವಿಶ್ವಾಸಾರ್ಹವಾಗಿ extract ಆಗಿಲ್ಲ ಎಂದಷ್ಟೇ; ಮೂಲ ದಾಖಲೆದಲ್ಲೇ ಇಲ್ಲ ಎಂದು ಅರ್ಥವಲ್ಲ.' : 'Missing means the field was not reliably extracted from this upload; it does not prove the field is absent from the original document.'}
                  </p>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {(selectedDoc.extracted_fields.present_fields || []).map(f => <span key={f} className="status-pill pill-available">✓ {f.replace(/_/g,' ')}</span>)}
                    {(selectedDoc.extracted_fields.missing_fields || []).map(f => <span key={f} className="status-pill pill-missing">⚠ {f.replace(/_/g,' ')}</span>)}
                  </div>
                </div>
              )}
              <div className="extracted-fields-grid">
                {Object.entries(selectedDoc.extracted_fields || {}).filter(([key]) => !['missing_fields','present_fields'].includes(key)).map(([key, val]) => (
                  <div key={key} className="field-cell">
                    <span className="field-name">{key.replace(/_/g, ' ').toUpperCase()}:</span>
                    <strong className="field-val">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Explainer Card */}
          {explainerDoc && (
            <div className="card explainer-card">
              <div className="card-header">
                <span className="card-tag tag-secondary">DOCUMENT EXPLAINER</span>
                <button className="close-btn" onClick={() => setExplainerDoc(null)}>✕</button>
              </div>
              <h3 className="card-title">Simple Explanation: {explainerDoc.title}</h3>
              <p className="explainer-text">{explainerDoc.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
