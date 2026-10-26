import React, { useState, useEffect } from 'react';
import AuthPanel from './components/AuthPanel';
import { refreshSession } from './services/firebaseAuth';
import Header from './components/Header';
import DemoControlBar from './components/DemoControlBar';
import StatutoryDisclaimer from './components/StatutoryDisclaimer';

import HomeView from './pages/HomeView';
import ChatAssistantView from './pages/ChatAssistantView';
import CasesPlanView from './pages/CasesPlanView';
import DocumentsView from './pages/DocumentsView';
import PassportView from './pages/PassportView';
import EvidenceView from './pages/EvidenceView';
import FamilyRoomView from './pages/FamilyRoomView';
import RegistryView from './pages/RegistryView';
import NotificationsView from './pages/NotificationsView';
import LandMapView from './pages/LandMapView';
import WomensLandSupportView from './pages/WomensLandSupportView';

import { api } from './services/api';
import './App.css';
import { SUPPORTED_LANGUAGES } from './i18n';
import LanguageRuntime from './components/LanguageRuntime';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [pendingProtectedTab, setPendingProtectedTab] = useState('assistant');
  const [authChecking, setAuthChecking] = useState(true);
  const protectedTabs = new Set(['assistant', 'plan', 'documents', 'passport', 'evidence', 'family', 'women', 'notifications']);
  const [language, setLanguage] = useState('en');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCase = async (syncLanguage = false) => {
    try {
      const data = await api.getCase();
      setCaseData(data);
      if (syncLanguage && data?.language && ['en','ta','kn'].includes(data.language)) setLanguage(data.language);
    } catch (err) {
      console.warn('Backend unavailable; showing location-first shell.', err);
      setCaseData(prev => prev || { case_id:'LOCAL-LOCATION-ONLY', language, is_demo_mode:false, state:'', land_location:{}, user_current_location:{}, adaptive_questions:[], uploaded_documents:[], verification_gaps:[], readiness_score:0, stage:'NEW' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { document.documentElement.lang = language === 'ta' ? 'ta' : language === 'kn' ? 'kn' : 'en'; }, [language]);

  useEffect(() => { fetchCase(); }, []);

  useEffect(() => {
    let cancelled = false;
    async function restoreAuth() {
      try {
        const saved = localStorage.getItem('landstack_auth_session');
        if (saved) {
          const session = JSON.parse(saved);
          if (session?.refreshToken) {
            const refreshed = await refreshSession(session.refreshToken);
            if (!cancelled) {
              setAuthUser(refreshed);
              localStorage.setItem('landstack_auth_session', JSON.stringify(refreshed));
            }
          }
        }
      } catch (error) {
        localStorage.removeItem('landstack_auth_session');
        if (!cancelled) setAuthUser(null);
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    }
    restoreAuth();
    return () => { cancelled = true; };
  }, []);

  const handleTabChange = (tabId) => {
    if (protectedTabs.has(tabId) && !authUser) {
      setPendingProtectedTab(tabId);
      setActiveTab('auth');
      return;
    }
    setActiveTab(tabId);
  };

  const handleAuthenticated = (user) => {
    setAuthUser(user);
    localStorage.setItem('landstack_auth_session', JSON.stringify(user));
    setActiveTab(pendingProtectedTab || 'assistant');
  };

  const handleLogout = () => {
    localStorage.removeItem('landstack_auth_session');
    setAuthUser(null);
    setActiveTab('home');
  };

  const handleLanguageChange = async (nextLanguage) => {
    setLanguage(nextLanguage);
    try { await api.setCaseLanguage(nextLanguage); } catch (e) { console.warn('Could not sync case language:', e); }
  };

  const handleNewCase = async () => {
    if (!authUser) {
      setPendingProtectedTab('home');
      setActiveTab('auth');
      return;
    }
    try {
      setLoading(true);
      const data = await api.createNewCase(language);
      setCaseData(data);
      setLanguage(language);
      // Always return to the empty Home flow after creating a case.
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Error creating new case:', e);
      alert(language === 'ta' ? 'புதிய கேஸ் உருவாக்க முடியவில்லை. Backend இயங்குகிறதா என்பதை சரிபார்க்கவும்.' : language === 'kn' ? 'ಹೊಸ ಕೇಸ್ ರಚಿಸಲಾಗಲಿಲ್ಲ. Backend ಚಾಲನೆಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.' : 'Could not create a new case. Please check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendProblem = async (problemText, detectedLanguage) => {
    if (!authUser) {
      setPendingProtectedTab('assistant');
      setActiveTab('auth');
      return;
    }
    try {
      await api.sendChatMessage(problemText, detectedLanguage || language);
      await fetchCase();
      setActiveTab('assistant');
    } catch (e) {
      console.error(e);
      setActiveTab('assistant');
    }
  };

  return (
    <div className="app-root">
      <LanguageRuntime language={language} />
      {/* 1. Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        language={language}
        setLanguage={handleLanguageChange}
        readinessScore={caseData?.readiness_score ?? 0}
        caseId={caseData?.case_id || 'New case'}
        onNewCase={handleNewCase}
        authUser={authUser}
        onLogout={handleLogout}
      />

      {/* 2. Judging Demo Control Bar */}
      {caseData?.is_demo_mode && (
        <DemoControlBar
          onStateChange={fetchCase}
          currentReadiness={caseData?.readiness_score ?? 0}
          language={language}
        />
      )}

      {/* 3. Statutory Legal Notice Banner */}
      <StatutoryDisclaimer language={language} />

      {/* 4. Active Main Content Area */}
      <main className="main-viewport">
        {activeTab === 'auth' ? (
          authChecking ? <div className="loading-state"><div className="spinner"></div><p>Checking sign-in status…</p></div> :
          <AuthPanel language={language} onAuthenticated={handleAuthenticated} onBack={() => setActiveTab('home')} />
        ) : (loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{language === 'ta' ? 'LandStack கேஸ் ஏற்றப்படுகிறது...' : language === 'kn' ? 'LandStack ಕೇಸ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading LandStack case...'}</p>
          </div>
        ) : (
          <div key={caseData?.case_id || 'case-shell'}>
            {activeTab === 'home' && (
              <HomeView
                caseData={caseData}
                onNavigate={handleTabChange}
                onSendProblem={handleSendProblem}
                onUpdateCase={fetchCase}
                language={language}
                onLanguageDetected={setLanguage}
              />
            )}
            {activeTab === 'assistant' && (
              <ChatAssistantView
                caseData={caseData}
                onUpdateCase={fetchCase}
                language={language}
                onLanguageDetected={setLanguage}
                onNavigate={handleTabChange}
              />
            )}
            {activeTab === 'plan' && (
              <CasesPlanView
                caseData={caseData}
                onUpdateCase={fetchCase}
                onNavigate={handleTabChange}
                language={language}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentsView
                caseData={caseData}
                onUpdateCase={fetchCase}
                language={language}
                onNavigate={handleTabChange}
              />
            )}
            {activeTab === 'passport' && (
              <PassportView
                caseData={caseData}
                language={language}
              />
            )}
            {activeTab === 'evidence' && (
              <EvidenceView
                caseData={caseData}
                onUpdateCase={fetchCase}
                language={language}
              />
            )}
            {activeTab === 'family' && (
              <FamilyRoomView
                caseData={caseData}
                onUpdateCase={fetchCase}
                language={language}
              />
            )}
            {activeTab === 'women' && (
              <WomensLandSupportView
                caseData={caseData}
                language={language}
                onNavigate={handleTabChange}
              />
            )}
            {activeTab === 'registry' && (
              <RegistryView
                caseData={caseData}
                language={language}
              />
            )}
            {activeTab === 'map' && (
              <LandMapView
                caseData={caseData}
                onUpdateCase={fetchCase}
                language={language}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsView
                caseData={caseData}
                language={language}
              />
            )}
          </div>
        ))}
      </main>

      {/* 5. Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-left">
            <strong>LandStack AI</strong> • {language === 'ta' ? 'பல்மொழி நில முடிவு உதவியாளர்' : language === 'kn' ? 'ಬಹುಭಾಷಾ ಭೂಮಿ ನಿರ್ಧಾರ ಸಹಾಯಕ' : 'Multilingual Land Decision Copilot'}
            <p className="footer-sub">
              {language === 'ta' ? 'RAG நம்பகமான அறிவு அடுக்கு + Agentic AI Orchestrator.' : language === 'kn' ? 'RAG ವಿಶ್ವಾಸಾರ್ಹ ಜ್ಞಾನ ಪದರ + Agentic AI Orchestrator.' : 'RAG trusted knowledge layer + Agentic AI Orchestrator.'}
            </p>
          </div>
          <div className="footer-right">
            <span>{language === 'ta' ? 'அதிகாரப்பூர்வ அரசு பதிவுகளே இறுதி ஆதாரம்.' : language === 'kn' ? 'ಅಧಿಕೃತ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳೇ ಅಂತಿಮ ಪ್ರಾಧಿಕಾರ.' : 'Official government records remain the final authority.'}</span>
            <span className="footer-copy">© 2026 LandStack AI • Citizen Service Initiative</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
