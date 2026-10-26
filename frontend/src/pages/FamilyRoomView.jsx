import React, { useEffect, useState } from 'react';
import { Users, Shield, MessageSquare, CheckCircle2, Clock, Send, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { t } from '../i18n';

export default function FamilyRoomView({ caseData, onUpdateCase, language = 'en' }) {
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState(caseData?.citizen_name || '');
  const [submitting, setSubmitting] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('Family member');

  const familyMembers = caseData?.family_members || [];

  useEffect(() => {
    if (caseData?.citizen_name) setAuthorName(caseData.citizen_name);
  }, [caseData?.citizen_name]);
  const comments = caseData?.family_comments || [];

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.addFamilyMember(memberName.trim(), memberRelation.trim() || 'Family member');
      setMemberName('');
      setMemberRelation('Family member');
      if (onUpdateCase) await onUpdateCase();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      await api.addFamilyComment(authorName, commentText);
      setCommentText('');
      if (onUpdateCase) onUpdateCase();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container family-room-view">
      <div className="section-title-bar">
        <div>
          <h2>{t(language,'familyTitle')}</h2>
          <span className="section-subtext">
            Role-aware collaboration environment for legal heirs, family members, and legal advisors to review evidence and align on decisions.
          </span>
        </div>
      </div>

      <div className="family-room-grid">
        {/* Left Column: Authorized Heirs & Consent Status */}
        <div className="family-left-col">
          <div className="card">
            <div className="card-header">
              <span className="card-tag tag-primary">COLLABORATORS</span>
              <Users size={16} />
            </div>
            <h3 className="card-title">Legal Heirs & Decision Consensus</h3>
            <p className="card-desc">
              All co-heirs listed in the Tahsildar Legal Heir Certificate have role-based view permissions.
            </p>

            <div className="family-members-list">
              {familyMembers.length === 0 && <div className="adaptive-q-answer">No family members have been added to this case yet.</div>}
              {familyMembers.map((member) => (
                <div key={member.id} className="family-member-card">
                  <div className="member-avatar">
                    <Users size={18} />
                  </div>
                  <div className="member-info">
                    <div className="member-top">
                      <strong className="member-name">{member.name}</strong>
                      <span className="member-role-badge">{member.role}</span>
                    </div>
                    <span className="member-relation">Relation: {member.relationship}</span>
                  </div>
                  <div className="member-consent-status">
                    {member.decision_approval ? (
                      <span className="consent-approved">
                        <CheckCircle2 size={14} /> Consent Granted
                      </span>
                    ) : (
                      <span className="consent-pending">
                        <Clock size={14} /> Pending NOC
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddMember} className="comment-input-form" style={{ marginTop: 12 }}>
              <div className="comment-input-row">
                <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder={language === 'ta' ? 'குடும்ப உறுப்பினர் பெயர்' : language === 'kn' ? 'ಕುಟುಂಬ ಸದಸ್ಯರ ಹೆಸರು' : 'Family member name'} className="comment-text-input" />
                <input value={memberRelation} onChange={(e) => setMemberRelation(e.target.value)} placeholder={language === 'ta' ? 'உறவு' : language === 'kn' ? 'ಸಂಬಂಧ' : 'Relationship'} className="comment-text-input" />
                <button type="submit" disabled={submitting} className="btn btn-primary"><Users size={14} /> Add</button>
              </div>
            </form>

            {familyMembers.length > 0 && (
              <div className="family-tree-card" style={{ marginTop: 16 }}>
                <strong>{language === 'ta' ? 'ஆவண/கேஸ் ஆதார அடிப்படையிலான குடும்ப மரம்' : language === 'kn' ? 'ಕೇಸ್ / ದಾಖಲೆ ಆಧಾರಿತ ಕುಟುಂಬ ವೃಕ್ಷ' : 'Case / document-based family tree'}</strong>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                  {familyMembers.map((member) => (
                    <div key={member.id} className="family-member-card" style={{ minWidth: 180 }}>
                      <strong>{member.name}</strong><br />
                      <span>{member.relationship}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="consensus-summary-box">
              <strong>Consensus Progress:</strong> {familyMembers.length ? `${familyMembers.filter(m => m.decision_approval).length} of ${familyMembers.length} members have recorded approval.` : 'No family consent data has been entered yet.'}
            </div>
          </div>
        </div>

        {/* Right Column: Family Discussion & Audit Log */}
        <div className="family-right-col">
          <div className="card discussion-card">
            <div className="card-header">
              <span className="card-tag tag-secondary">DECISION LOG & NOTES</span>
              <MessageSquare size={16} />
            </div>
            <h3 className="card-title">Family Notes & Consultation History</h3>

            <div className="family-comments-feed">
              {comments.map((c) => (
                <div key={c.id} className="family-comment-bubble">
                  <div className="comment-header">
                    <strong className="comment-author">{c.author}</strong>
                    <span className="comment-time">{c.timestamp}</span>
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="comment-input-form">
              <div className="comment-input-row">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add note, record verbal consent, or ask a question to co-heirs..."
                  className="comment-text-input"
                />
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
