import React from 'react';
import {
  CheckCircle2, Clock, CircleDot, ArrowRight, Building, MapPin,
  Calendar, FileText, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { t } from '../i18n';

export default function CasesPlanView({
  caseData,
  onUpdateCase,
  onNavigate,
  language = 'en'
}) {
  const planSteps = caseData?.case_plan || [];
  const readiness = caseData?.readiness_score ?? 0;

  const handleStepToggle = async (stepNumber, currentStatus) => {
    const completedLabel = language === 'ta' ? 'முடிந்தது' : language === 'kn' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Completed';
    const nextStatus = currentStatus === completedLabel ? 'IN_PROGRESS' : completedLabel;
    try {
      await api.updateCaseStep(stepNumber, nextStatus);
      if (onUpdateCase) onUpdateCase();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container cases-plan-view">
      {/* Living Case Header Banner */}
      <div className="card living-case-banner">
        <div className="case-banner-top">
          <div>
            <div className="case-badge">{language === 'ta' ? 'நில கேஸ் • செயல்முறை கண்காணிப்பு' : language === 'kn' ? 'ಲಿವಿಂಗ್ ಲ್ಯಾಂಡ್ ಕೇಸ್ • ಜೀವನಚಕ್ರ ಟ್ರ್ಯಾಕರ್' : 'Living Land Case • lifecycle tracker'}</div>
            <h2 className="case-title">{caseData?.intent_title}</h2>
            <div className="case-meta-line">
              <span><strong>{language === 'ta' ? 'ID:' : 'ID:'}</strong> {caseData?.case_id}</span>
              <span><strong>{language === 'ta' ? 'குடிமகன்:' : language === 'kn' ? 'ನಾಗರಿಕ:' : 'Citizen:'}</strong> {caseData?.citizen_name}</span>
              <span><MapPin size={13} /> {caseData?.village}, {caseData?.taluk}, {caseData?.district}</span>
              <span><strong>{language === 'ta' ? 'நிலை:' : language === 'kn' ? 'ಹಂತ:' : 'Stage:'}</strong> <span className="stage-pill">{caseData?.stage}</span></span>
            </div>
          </div>
          <div className="banner-readiness-box">
            <div className="readiness-big-circle">{readiness}%</div>
            <span className="readiness-sub">{language === 'ta' ? 'கேஸ் தயார்நிலை' : language === 'kn' ? 'ಕೇಸ್ ಸಿದ್ಧತೆ' : 'Case readiness'}</span>
          </div>
        </div>
      </div>

      {/* Main Workflow Layout */}
      <div className="plan-layout-grid">
        {/* Left: Step-by-Step Adaptive Case Plan */}
        <div className="plan-steps-column">
          <div className="section-title-bar">
            <h3>{language === 'ta' ? 'தழுவக்கூடிய கேஸ் திட்டம்' : language === 'kn' ? 'ಅನುಗುಣ ಕೇಸ್ ಯೋಜನೆ' : 'Adaptive case plan'}</h3>
            <span className="section-subtext">{language === 'ta' ? 'குடிமகன் பதில்கள் மற்றும் உண்மையான ஆதாரத்தின் அடிப்படையில் மாற்றப்படும்.' : language === 'kn' ? 'ನಾಗರಿಕರ ಉತ್ತರಗಳು ಮತ್ತು ನಿಜವಾದ ಸಾಕ್ಷ್ಯದ ಆಧಾರದ ಮೇಲೆ ಬದಲಾಗುತ್ತದೆ.' : 'Changes based on citizen answers and real evidence.'}</span>
          </div>

          <div className="steps-timeline-list">
            {planSteps.map((step) => {
              const isCompleted = step.status === 'COMPLETED';
              const isInProgress = step.status === 'IN_PROGRESS';

              return (
                <div
                  key={step.step_number}
                  className={`plan-step-card ${isCompleted ? 'step-done' : isInProgress ? 'step-active' : 'step-waiting'}`}
                >
                  <div className="step-card-header">
                    <div className="step-num-badge">{language === 'ta' ? `படி ${step.step_number}` : language === 'kn' ? `ಹಂತ ${step.step_number}` : `Step ${step.step_number}`}</div>
                    <button
                      className={`step-status-tag status-${step.status.toLowerCase()}`}
                      onClick={() => handleStepToggle(step.step_number, step.status)}
                      title="Click to toggle status"
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 size={13} /> {language === 'ta' ? 'முடிந்தது' : language === 'kn' ? 'ಪೂರ್ಣಗೊಂಡಿದೆ' : 'Completed'}
                        </>
                      ) : isInProgress ? (
                        <>
                          <Clock size={13} /> {language === 'ta' ? 'நடைபெறுகிறது' : language === 'kn' ? 'ನಡೆಯುತ್ತಿದೆ' : 'In progress'}
                        </>
                      ) : (
                        <>
                          <CircleDot size={13} /> {language === 'ta' ? 'நிலுவையில்' : language === 'kn' ? 'ಬಾಕಿ' : 'Pending'}
                        </>
                      )}
                    </button>
                  </div>

                  <h4 className="step-heading">{step.title}</h4>
                  <p className="step-desc">{step.description}</p>

                  <div className="step-card-footer">
                    {step.target_office && (
                      <span className="step-office">
                        <Building size={13} /> {step.target_office}
                      </span>
                    )}
                    <button
                      className="btn-text-link"
                      onClick={() => onNavigate('evidence')}
                    >
                      <span>{language === 'ta' ? 'ஆதாரத்தை பார்க்க' : language === 'kn' ? 'ಸಾಕ್ಷ್ಯ ನೋಡಿ' : 'View evidence'}</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Location-specific guidance without seeded offices */}
        <div className="plan-guidance-column">
          <div className="sidebar-card">
            <div className="sidebar-card-header"><Building size={16} /><h4>{language === 'ta' ? 'இடம் சார்ந்த அலுவலக வழிகாட்டி' : language === 'kn' ? 'ಸ್ಥಳ ಆಧಾರಿತ ಕಚೇರಿ ಮಾರ್ಗದರ್ಶನ' : 'Location-based office guidance'}</h4></div>
            <p className="sidebar-subtext">{language === 'ta' ? 'உண்மையான நில இடம் உறுதி செய்யப்பட்ட பிறகு தொடர்புடைய அலுவலகம் கண்டறியப்படும்.' : language === 'kn' ? 'ನಿಜವಾದ ಜಮೀನು ಸ್ಥಳ ಖಚಿತವಾದ ನಂತರ ಸಂಬಂಧಿತ ಕಚೇರಿಯನ್ನು ಗುರುತಿಸಲಾಗುತ್ತದೆ.' : 'The relevant office is identified after the real land location is confirmed.'}</p>
            <div className="office-info-item">
              <strong>{caseData?.land_location?.display_name || caseData?.land_location?.query || (language === 'ta' ? 'நில இடம் இன்னும் வழங்கப்படவில்லை' : language === 'kn' ? 'ಜಮೀನು ಸ್ಥಳ ಇನ್ನೂ ನೀಡಲಾಗಿಲ್ಲ' : 'Land location not provided yet')}</strong>
              <p>{caseData?.state || (language === 'ta' ? 'மாநிலம் இன்னும் உறுதி செய்யப்படவில்லை' : language === 'kn' ? 'ರಾಜ್ಯ ಇನ್ನೂ ಖಚಿತವಾಗಿಲ್ಲ' : 'State not confirmed yet')}</p>
              {caseData?.location_verified ? <span className="role-tag">{language === 'ta' ? 'வரைபட இடம் சரிபார்க்கப்பட்டது' : language === 'kn' ? 'ನಕ್ಷೆ ಸ್ಥಳ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'Map location verified'}</span> : <span className="role-tag">{language === 'ta' ? 'இடத்தை முதலில் உறுதி செய்யவும்' : language === 'kn' ? 'ಮೊದಲು ಸ್ಥಳವನ್ನು ಖಚಿತಪಡಿಸಿ' : 'Confirm the location first'}</span>}
            </div>
            <button className="btn btn-outline" onClick={() => onNavigate('registry')}><MapPin size={14}/> {language === 'ta' ? 'அலுவலகம் & அருகிலுள்ள சேவைகள்' : language === 'kn' ? 'ಕಚೇರಿ ಮತ್ತು ಸಮೀಪದ ಸೇವೆಗಳು' : 'Office & nearby services'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
