import React from 'react';
import { Bell, ShieldAlert, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';
import { t } from '../i18n';

export default function NotificationsView({ caseData, language = 'en' }) {
  const notifications = caseData?.notifications || [];
  const landguardAlerts = caseData?.landguard_alerts || [];

  return (
    <div className="page-container notifications-view">
      <div className="section-title-bar">
        <div>
          <h2>{t(language,'alertsTitle')}</h2>
          <span className="section-subtext">
            Proactive alerts, case lifecycle state transitions, and LandGuard event tracking.
          </span>
        </div>
      </div>

      <div className="notifications-grid-layout">
        {/* Left Column: Smart Notifications */}
        <div className="notif-left-col">
          <div className="card">
            <div className="card-header">
              <span className="card-tag tag-primary">CITIZEN NOTIFICATIONS</span>
              <Bell size={16} />
            </div>
            <h3 className="card-title">Case Alerts & Reminders ({notifications.length})</h3>

            <div className="notifications-list">
              {notifications.map((n) => (
                <div key={n.id} className="notification-item-card">
                  <div className="notif-top">
                    <strong className="notif-title">{n.title}</strong>
                    <span className="notif-time">{n.timestamp}</span>
                  </div>
                  <p className="notif-message">{n.message}</p>
                  <span className="notif-category-chip">{n.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: LandGuard AI Monitoring */}
        <div className="notif-right-col">
          <div className="card landguard-card">
            <div className="card-header">
              <span className="card-tag tag-secondary">LANDGUARD AI</span>
              <ShieldAlert size={16} />
            </div>
            <h3 className="card-title">LandGuard Change Monitoring</h3>
            <p className="card-desc">
              Tracks document revisions, boundary area updates, and verification status changes for this land case.
            </p>

            <div className="landguard-demo-notice">
              <Info size={14} />
              <span>
                <strong>Architecture Note:</strong> Currently tracking internal case events. External registry monitoring requires authorized state land record API integration.
              </span>
            </div>

            <div className="landguard-events-list">
              {landguardAlerts.map((evt) => {
                const isWarning = evt.severity === 'WARNING';
                const isSuccess = evt.severity === 'SUCCESS';
                return (
                  <div
                    key={evt.id}
                    className={`landguard-event-item ${isWarning ? 'event-warning' : isSuccess ? 'event-success' : 'event-info'}`}
                  >
                    <div className="event-icon">
                      {isSuccess ? (
                        <CheckCircle2 size={16} className="text-green" />
                      ) : isWarning ? (
                        <AlertTriangle size={16} className="text-amber" />
                      ) : (
                        <Clock size={16} className="text-blue" />
                      )}
                    </div>
                    <div className="event-body">
                      <div className="event-top">
                        <strong className="event-type">{evt.event_type.replace(/_/g, ' ')}</strong>
                        <span className="event-time">{evt.timestamp}</span>
                      </div>
                      <p className="event-text">{evt.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
