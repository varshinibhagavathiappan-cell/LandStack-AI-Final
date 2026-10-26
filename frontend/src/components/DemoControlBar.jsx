import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, RefreshCw, FileText, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function DemoControlBar({ onStateChange, currentReadiness = 40, language = 'en' }) {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const handleStep1 = async () => {
    setLoading(true);
    try {
      await api.resetDemo();
      setActiveStep(1);
      if (onStateChange) onStateChange();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    setLoading(true);
    try {
      await api.loadDemoInconsistency();
      setActiveStep(2);
      if (onStateChange) onStateChange();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    setLoading(true);
    try {
      await api.resolveDemoRecheck();
      setActiveStep(3);
      if (onStateChange) onStateChange();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCaseFile = () => {
    window.open(api.getCaseFileUrl(), '_blank');
  };

  return (
    <div className="demo-bar-container">
      <div className="demo-bar-left">
        <div className="demo-badge">
          <Sparkles size={14} /> {language === 'ta' ? 'டெமோ கட்டுப்பாடுகள்' : language === 'kn' ? 'ಡೆಮೋ ನಿಯಂತ್ರಣಗಳು' : 'Demo controls'}
        </div>
        <span className="demo-desc">{language === 'ta' ? 'தீர்ப்பு நடைமுறை: தமிழ் தந்தை நில மாற்றம் & 0.40 ஏக்கர் ஒப்பீடு' : language === 'kn' ? 'ಜಡ್ಜಿಂಗ್ நடைಮுறை: ತಂದೆಯ ಜಮೀನು ವರ್ಗಾವಣೆ & 0.40 ಎಕರೆ ಪರಿಶೀಲನೆ' : 'Judging flow: inherited land transfer & 0.40-acre comparison'}</span>
      </div>

      <div className="demo-bar-actions">
        <button
          className={`demo-btn ${activeStep === 1 ? 'demo-btn-active' : ''}`}
          onClick={handleStep1}
          disabled={loading}
          title="Citizen asks question in Tamil and initializes living case"
        >
          <Play size={14} /> {language === 'ta' ? '1. பிரச்சனை' : language === 'kn' ? '1. ಸಮಸ್ಯೆ' : '1. Problem'}
        </button>

        <button
          className={`demo-btn demo-btn-warning ${activeStep === 2 ? 'demo-btn-active' : ''}`}
          onClick={handleStep2}
          disabled={loading}
          title="Ingests documents with intentional 2.50 vs 2.10 acre mismatch"
        >
          <AlertTriangle size={14} /> {language === 'ta' ? '2. முரண்பாடு டெமோ' : language === 'kn' ? '2. ವ್ಯತ್ಯಾಸ ಡೆಮೋ' : '2. Conflict demo'}
        </button>

        <button
          className={`demo-btn demo-btn-success ${activeStep === 3 ? 'demo-btn-active' : ''}`}
          onClick={handleStep3}
          disabled={loading}
          title="Uploads FMB re-survey report and executes Conflict → Resolution → Re-check"
        >
          <CheckCircle2 size={14} /> {language === 'ta' ? '3. தீர்வு & மீள் சரிபார்ப்பு' : language === 'kn' ? '3. ಪರಿಹಾರ ಮತ್ತು ಮರುಪರಿಶೀಲನೆ' : '3. Resolve & re-check'}
        </button>

        <button
          className="demo-btn demo-btn-primary"
          onClick={handleOpenCaseFile}
          title="Print or view AI-assisted Living Land Case File"
        >
          <FileText size={14} /> {language === 'ta' ? 'கேஸ் PDF' : language === 'kn' ? 'ಕೇಸ್ PDF' : 'Case PDF'}
        </button>

        <button
          className="demo-btn demo-btn-ghost"
          onClick={handleStep1}
          disabled={loading}
          title={language === 'ta' ? 'மீட்டமை' : language === 'kn' ? 'ಮರುಹೊಂದಿಸಿ' : 'Reset back to step 1'}
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> {language === 'ta' ? 'மீட்டமை' : 'மರುಹೊಂದಿಸಿ'}
        </button>
      </div>
    </div>
  );
}
