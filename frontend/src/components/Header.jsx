import React from 'react';
import { t } from '../i18n';
import {
  Compass, MessageSquare, FolderKanban, FileCheck,
  ShieldCheck, Network, Users, Globe2, Bell, Landmark, Map, HeartHandshake, LogOut
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  readinessScore = 40,
  caseId = 'TN-CASE-2026-0924',
  onNewCase,
  authUser = null,
  onLogout
}) {
  const tabs = [
    { id: 'home', label: t(language,'home'), icon: Compass },
    { id: 'assistant', label: t(language,'assistant'), icon: MessageSquare },
    { id: 'plan', label: t(language,'plan'), icon: FolderKanban },
    { id: 'documents', label: t(language,'documents'), icon: FileCheck },
    { id: 'passport', label: t(language,'passport'), icon: ShieldCheck },
    { id: 'evidence', label: t(language,'evidence'), icon: Network },
    { id: 'family', label: t(language,'family'), icon: Users },
    { id: 'women', label: t(language,'womenSupport'), icon: HeartHandshake },
    { id: 'registry', label: t(language,'registry'), icon: Landmark },
    { id: 'map', label: t(language,'map'), icon: Map },
    { id: 'notifications', label: t(language,'alerts'), icon: Bell }
  ];

  return (
    <header className="site-header">
      <div className="header-top">
        <div className="brand-group">
          <div className="brand-icon">
            <Compass size={24} color="#fff" />
          </div>
          <div>
            <div className="brand-title">LandStack AI</div>
            <div className="brand-tagline">{language === 'ta' ? 'பல்மொழி நில முடிவு உதவியாளர்' : language === 'kn' ? 'ಬಹುಭಾಷಾ ಭೂಮಿ ನಿರ್ಧಾರ ಸಹಾಯಕ' : 'Multilingual Land Decision Copilot'}</div>
          </div>
        </div>

        <div className="header-meta">
          <button className="case-id-pill" onClick={onNewCase} title={t(language,'newCase')}>+ {t(language,'newCase')}</button>

          <div className="case-id-pill">
            <span className="case-label">{t(language,'activeCase')}</span>
            <span className="case-val">{caseId}</span>
          </div>

          <div className="readiness-meter-header">
            <span className="readiness-title">{t(language,'readiness')}</span>
            <div className="readiness-bar-outer">
              <div
                className="readiness-bar-inner"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
            <span className="readiness-percentage">{readinessScore}%</span>
          </div>

          {authUser ? (
            <div className="auth-header-session">
              <span title={authUser.email}>{authUser.displayName || authUser.email}</span>
              <button type="button" onClick={onLogout} className="auth-header-logout"><LogOut size={15} /> {language === 'ta' ? 'வெளியேறு' : language === 'kn' ? 'ಲಾಗ್ ಔಟ್' : 'Log out'}</button>
            </div>
          ) : (
            <button type="button" className="auth-header-login" onClick={() => setActiveTab('auth')}>
              {language === 'ta' ? 'உள்நுழை' : language === 'kn' ? 'ಲಾಗಿನ್' : 'Sign in'}
            </button>
          )}

          <div className="lang-switcher">
            <Globe2 size={16} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="lang-select"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>
        </div>
      </div>

      <nav className="header-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab-btn ${isActive ? 'nav-tab-active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
