import React from 'react';
import {
  ShieldCheck, FileText, Download, AlertTriangle, CheckCircle2,
  MapPin, Scale, Landmark, User, Hash, Info, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { t } from '../i18n';

export default function PassportView({ caseData, language = 'en' }) {
  const passport = caseData?.property_passport || {};
  const isClean = passport.dispute_flag === 'CLEAN';
  const hasEvidence = Boolean(caseData?.uploaded_documents?.length);
  const statusLabel = hasEvidence ? (passport.dispute_flag || 'UNDER_VERIFICATION') : 'INSUFFICIENT EVIDENCE';

  const handleOpenCaseFile = () => {
    window.open(api.getCaseFileUrl(), '_blank');
  };

  return (
    <div className="page-container passport-view">
      <div className="passport-header-row">
        <div>
          <h2>{t(language,'passportTitle')}</h2>
          <span className="section-subtext">
            {language === 'ta' ? 'உண்மையான ஆதாரத்தின் அடிப்படையிலான சொத்து அடையாள சுருக்கம்.' : language === 'kn' ? 'ನಿಜವಾದ ಸಾಕ್ಷ್ಯದ ಆಧಾರದ ಆಸ್ತಿ ಗುರುತು ಸಾರಾಂಶ.' : 'Property identity summary based on real evidence.'}
          </span>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCaseFile}>
          <FileText size={16} />
          <span>{language === 'ta' ? 'கேஸ் PDF பார்க்க / அச்சிட' : language === 'kn' ? 'ಕೇಸ್ PDF ನೋಡಿ / ಮುದ್ರಿಸಿ' : 'View / print Case PDF'}</span>
        </button>
      </div>

      <div className="passport-card-container">
        {/* Passport Identity Header */}
        <div className="passport-top-card">
          <div className="passport-id-badge">
            <ShieldCheck size={20} />
            <span>{language === 'ta' ? 'சொத்து அடையாளம்:' : language === 'kn' ? 'ಆಸ್ತಿ ಗುರುತು:' : 'Property ID:'} {passport.property_id || 'NOT YET ASSIGNED'}</span>
          </div>

          <div className="passport-score-ring">
            <div className="score-ring-val">{hasEvidence ? (passport.evidence_score ?? 0) : 0}%</div>
            <span className="score-ring-label">{language === 'ta' ? 'ஆதார நிலை' : language === 'kn' ? 'ಸಾಕ್ಷ್ಯ ಸ್ಥಿತಿ' : 'Evidence status'}</span>
          </div>
        </div>

        {/* Core Property Attributes */}
        <div className="passport-grid">
          <div className="passport-cell">
            <span className="cell-label"><Hash size={14} /> Survey & Sub-division</span>
            <strong className="cell-val text-primary">{passport.survey_number || 'Not provided'}</strong>
          </div>

          <div className="passport-cell">
            <span className="cell-label"><User size={14} /> {language === 'ta' ? 'பதிவுசெய்யப்பட்ட உரிமையாளர்' : language === 'kn' ? 'ದಾಖಲಾದ ಮಾಲೀಕರು' : 'Recorded owner'}</span>
            <strong className="cell-val">{passport.recorded_owner || 'Not provided'}</strong>
          </div>

          <div className="passport-cell">
            <span className="cell-label"><Scale size={14} /> {language === 'ta' ? 'நிலப் பரப்பளவு' : language === 'kn' ? 'ಭೂ ವಿಸ್ತೀರ್ಣ' : 'Land area'}</span>
            <strong className="cell-val">
              {passport.extent_acres ? `${passport.extent_acres} Acres (${passport.extent_hectares || 0} Hectares)` : 'Not provided'}
            </strong>
          </div>

          <div className="passport-cell">
            <span className="cell-label"><MapPin size={14} /> {language === 'ta' ? 'இட நிர்வாகம்' : language === 'kn' ? 'ಆಡಳಿತ ಸ್ಥಳ' : 'Administrative location'}</span>
            <strong className="cell-val">
              {passport.village || 'Not provided'}, {passport.taluk || 'Not provided'}, {passport.district || 'Not provided'}
            </strong>
          </div>

          <div className="passport-cell">
            <span className="cell-label"><Landmark size={14} /> {language === 'ta' ? 'வகைப்பாடு' : language === 'kn' ? 'ವರ್ಗೀಕರಣ' : 'Classification'}</span>
            <strong className="cell-val">{passport.classification || 'Not provided'}</strong>
          </div>

          <div className="passport-cell">
            <span className="cell-label">{language === 'ta' ? 'வழிகாட்டி மதிப்பு' : language === 'kn' ? 'ಮಾರ್ಗಸೂಚಿ ಮೌಲ್ಯ' : 'Guideline value'}</span>
            <strong className="cell-val">{passport.guideline_value_approx || 'Not available'}</strong>
          </div>

          <div className="passport-cell">
            <span className="cell-label">{language === 'ta' ? 'பதிவு செய்யப்பட்ட உரிமை ஆவணம்' : language === 'kn' ? 'ನೋಂದಾಯಿತ ಹಕ್ಕುಪತ್ರ' : 'Registered title document'}</span>
            <strong className="cell-val">{passport.registered_deeds?.[0] || 'Not provided'}</strong>
          </div>

          <div className="passport-cell">
            <span className="cell-label">{language === 'ta' ? 'வருவாய் பதிவு எண்' : language === 'kn' ? 'ಭೂ ದಾಖಲೆ ಸಂಖ್ಯೆ' : 'Revenue record number'}</span>
            <strong className="cell-val">{passport.revenue_patta_no || (language === 'ta' ? 'வழங்கப்படவில்லை' : language === 'kn' ? 'ನೀಡಲಾಗಿಲ್ಲ' : 'Not provided')}</strong>
          </div>
        </div>

        {/* Dispute & Consistency Status Bar */}
        <div className={`dispute-status-bar ${isClean ? 'status-bar-clean' : 'status-bar-flagged'}`}>
          <div className="status-bar-left">
            {isClean ? <CheckCircle2 size={24} className="text-green" /> : <AlertTriangle size={24} className="text-amber" />}
            <div>
              <strong className="status-bar-title">
                STATUS: {statusLabel.replace(/_/g, ' ')}
              </strong>
              <p className="status-bar-desc">
                {!hasEvidence
                  ? 'No case evidence has been uploaded yet. Add documents to build the Property Passport.'
                  : isClean
                    ? 'Available evidence has been reconciled for this case. Further official verification may still be required.'
                    : 'Available evidence contains a potential inconsistency or requires additional verification.'}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="passport-disclaimer-box">
          <Info size={16} />
          <span>{passport.disclaimer || 'AI-assisted structured summary — not a legal certificate.'}</span>
        </div>
      </div>
    </div>
  );
}
