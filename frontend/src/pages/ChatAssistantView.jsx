import React, { useEffect, useMemo, useState } from 'react';
import {
  Send, Mic, Bot, User, CheckCircle2,
  ExternalLink, Sparkles, BookOpen, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { t } from '../i18n';

export default function ChatAssistantView({ caseData, onUpdateCase, language = 'en', onLanguageDetected, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [questionAnswer, setQuestionAnswer] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [citations, setCitations] = useState([]);

  useEffect(() => {
    const history = caseData?.conversation_history || [];
    if (history.length) {
      setMessages(history.map((m) => ({
        sender: m.role === 'user' ? 'user' : 'assistant',
        text: m.text,
        timestamp: m.timestamp || ''
      })));
    } else {
      const welcome = language === 'ta'
        ? 'வணக்கம்! உங்கள் நிலத் தேவையை இயல்பாகச் சொல்லுங்கள். முதலில் உங்கள் கோரிக்கையைப் புரிந்துகொண்டு, அதற்கேற்ற கேள்விகளை மட்டும் கேட்பேன்.'
        : language === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಭೂಮಿ ಅಗತ್ಯವನ್ನು ಸಹಜವಾಗಿ ಹೇಳಿ. ಮೊದಲು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡು, ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳನ್ನು ಮಾತ್ರ ಕೇಳುತ್ತೇನೆ.'
          : 'Hello! Tell me your land-related need. I will understand the existing case and ask only the next relevant question.';
      setMessages([{ sender: 'assistant', text: welcome, timestamp: '' }]);
    }
    setQuestionAnswer('');
  }, [caseData?.case_id, caseData?.conversation_history, language]);

  const currentQuestion = useMemo(
    () => (caseData?.adaptive_questions || []).find((q) => !q.answered),
    [caseData?.adaptive_questions]
  );

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge, or type your message.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ta' ? 'ta-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => setInputMessage(event.results[0][0].transcript);
    recognition.onerror = (event) => console.warn('Speech recognition error:', event.error);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const detectMessageLanguage = (text) => {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    if (/\b(enaku|enakku|oru|venum|vendum|vang|vaang|vanganum|vangunum|irukku|irukura|sollunga|epdi|enna|enoda|peru|maathanum|vaanganum|land|nilam)\b/i.test(text)) return 'ta';
    if (/\b(nanage|nange|nanna|bhoomi|bhumi|beku|bekagide|khareedi|jameenu|hege|hesaru|dakhale|ellide)\b/i.test(text)) return 'kn';
    return language;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;
    const userText = inputMessage.trim();
    const messageLanguage = detectMessageLanguage(userText);
    if (messageLanguage !== language && onLanguageDetected) onLanguageDetected(messageLanguage);
    setInputMessage('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgList = [...messages, { sender: 'user', text: userText, timestamp: now }];
    setMessages(newMsgList);
    setLoading(true);
    try {
      const res = await api.sendChatMessage(userText, messageLanguage);
      setMessages([...newMsgList, { sender: 'assistant', text: res.reply, timestamp: now }]);
      setCitations(res.citations || []);
      if (onUpdateCase) await onUpdateCase();
    } catch (err) {
      setMessages([...newMsgList, { sender: 'assistant', text: language === 'ta' ? 'LandStack சேவையை அணுக முடியவில்லை. Backend இயங்குகிறதா என்று சரிபார்க்கவும்.' : language === 'kn' ? 'LandStack ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. Backend ಚಾಲನೆಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.' : 'LandStack service could not be reached. Check that the backend is running.', timestamp: now }]);
    } finally {
      setLoading(false);
    }
  };

  const submitQuestionAnswer = async (e) => {
    e.preventDefault();
    if (!currentQuestion || !questionAnswer.trim() || questionLoading) return;
    setQuestionLoading(true);
    try {
      await api.answerAdaptiveQuestion(currentQuestion.id, questionAnswer.trim(), language);
      setQuestionAnswer('');
      if (onUpdateCase) await onUpdateCase();
    } catch (err) {
      console.error(err);
    } finally {
      setQuestionLoading(false);
    }
  };

  return (
    <div className="page-container chat-assistant-layout">
      <div className="chat-main-column">
        <div className="intent-header-bar">
          <div className="intent-badge-left">
            <span className="intent-tag">{t(language,'detected')}</span>
            <strong className="intent-title">{caseData?.intent_title || 'Awaiting your problem'}</strong>
          </div>
          {caseData?.intent_confidence ? <div className="confidence-pill"><Sparkles size={14} /> {Math.round(caseData.intent_confidence * 100)}% {t(language,'confidence')}</div> : null}
        </div>

        <div className="messages-scroll-area">
          {messages.map((m, idx) => (
            <div key={idx} className={`message-bubble-wrapper ${m.sender === 'user' ? 'msg-user' : 'msg-assistant'}`}>
              <div className="msg-avatar">{m.sender === 'user' ? <User size={18} /> : <Bot size={18} />}</div>
              <div className="msg-content-box">
                <div className="msg-header">
                  <span className="msg-sender-name">{m.sender === 'user' ? (caseData?.citizen_name || 'Citizen') : 'LandStack Copilot'}</span>
                  <span className="msg-time">{m.timestamp}</span>
                </div>
                <div className="msg-text-body" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
              </div>
            </div>
          ))}
          {loading && <div className="message-bubble-wrapper msg-assistant"><div className="msg-avatar"><Bot size={18} /></div><div className="msg-content-box"><div className="typing-dots"><span></span><span></span><span></span></div></div></div>}
        </div>

        <form onSubmit={handleSend} className="chat-input-bar">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={language === 'ta' ? 'உங்கள் நிலத் தேவையைச் சொல்லுங்கள்...' : language === 'kn' ? 'ನಿಮ್ಮ ಭೂಮಿ ಅಗತ್ಯವನ್ನು ಹೇಳಿ...' : 'Describe your land need...'}
            className="chat-text-input"
          />
          <button type="button" className="chat-voice-btn" title={listening ? 'Listening…' : 'Speech Input'} onClick={startVoiceInput}>
            <Mic size={18} />
          </button>
          <button type="submit" disabled={loading} className="chat-send-btn"><Send size={18} /></button>
        </form>
      </div>

      <div className="chat-sidebar-column">
        <div className="sidebar-card">
          <div className="sidebar-card-header"><HelpCircle size={16} /><h4>{t(language,'adaptive')}</h4></div>
          <p className="sidebar-subtext">{t(language,'oneQuestion')}</p>
          <div className="adaptive-q-list">
            {(caseData?.adaptive_questions || []).filter(q => q.answered || q.id === currentQuestion?.id).map((q) => {
              const idx = (caseData?.adaptive_questions || []).findIndex(item => item.id === q.id);
              return (
                <div key={q.id} className="adaptive-q-item">
                  <div className="adaptive-q-text"><span className="q-num">Q{idx + 1}:</span> {language === 'ta' ? (q.question_ta || q.question) : (language === 'kn' ? (q.question_kn || q.question) : language === 'ta' ? (q.question_ta || q.question) : (q.question || q.question_en || q.question_kn || q.question_ta))}</div>
                  {q.answered ? (
                    <div className="adaptive-q-answer"><CheckCircle2 size={13} className="text-green" /><span><strong>{language === 'ta' ? 'உங்கள் பதில்:' : language === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರ:' : 'Your answer:'}</strong> {q.answer}</span></div>
                  ) : (
                    <form onSubmit={submitQuestionAnswer} className="adaptive-answer-form">
                      <input value={questionAnswer} onChange={(e) => setQuestionAnswer(e.target.value)} placeholder={language === 'ta' ? 'உங்கள் பதிலை உள்ளிடவும்...' : language === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರವನ್ನು ನಮೂದಿಸಿ...' : 'Enter your answer...'} />
                      <button type="submit" disabled={questionLoading || !questionAnswer.trim()}>{questionLoading ? 'Saving…' : t(language,'answer')}</button>
                    </form>
                  )}
                </div>
              );
            })}
            {currentQuestion && (caseData?.adaptive_questions || []).filter(q => !q.answered).length > 1 && (
              <div className="adaptive-q-answer">{language === 'ta' ? 'அடுத்த கேள்விகள் உங்கள் பதிலின் அடிப்படையில் பின்னர் தோன்றும்.' : language === 'kn' ? 'ನಿಮ್ಮ ಉತ್ತರದ ಆಧಾರದ ಮೇಲೆ ಮುಂದಿನ ಪ್ರಶ್ನೆಗಳು ನಂತರ ಕಾಣಿಸುತ್ತವೆ.' : 'Next questions will appear based on your answer.'}</div>
            )}
            {!currentQuestion && (caseData?.adaptive_questions?.length ? <div className="adaptive-q-answer"><CheckCircle2 size={13} className="text-green" /> {language === 'ta' ? 'தற்போதைய அனைத்து கேள்விகளுக்கும் பதில் அளிக்கப்பட்டது.' : language === 'kn' ? 'ಪ್ರಸ್ತುತ ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಲಾಗಿದೆ.' : 'All current questions have been answered.'}</div> : <div className="adaptive-q-answer">{t(language,'startProblem')}</div>)}
            {!currentQuestion && caseData?.intent_title && caseData?.adaptive_questions?.length > 0 && (
              <button type="button" className="btn btn-primary" style={{width:'100%',marginTop:10}} onClick={()=>onNavigate && onNavigate('documents')}>📄 {language === 'ta' ? 'அடுத்து — ஆவணங்களை பதிவேற்றவும்' : language === 'kn' ? 'ಮುಂದೆ — ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Next — Upload documents'}</button>
            )}
          </div>
        </div>

        <div className="sidebar-card rag-citations-card">
          <div className="sidebar-card-header"><BookOpen size={16} /><h4>{t(language,'rag')}</h4></div>
          <p className="sidebar-subtext">{language === 'ta' ? 'உள்ளமைக்கப்பட்ட அறிவுத் தளத்திலிருந்து பெறப்பட்ட ஆதாரங்கள்.' : language === 'kn' ? 'ಕಟ್ಟುನಿಟ್ಟಾದ ಜ್ಞಾನ ಮೂಲದಿಂದ ಪಡೆದ ಆಧಾರಗಳು.' : 'Sources retrieved from the configured knowledge base.'}</p>
          <div className="citations-list">
            {citations.map((c, idx) => (
              <div key={idx} className="citation-item">
                <div className="citation-top"><strong className="citation-title">{c.source_title}</strong><span className="citation-badge">{c.confidence_status}</span></div>
                <div className="citation-meta"><span>{c.source_type}</span> • <span>{c.jurisdiction}</span></div>
                <p className="citation-snippet">{c.content}</p>
                {c.source_url?.startsWith('http') ? <a href={c.source_url} target="_blank" rel="noreferrer" className="citation-link"><span>{language === 'ta' ? 'ஆதாரத்தை பார்க்க' : language === 'kn' ? 'ಮೂಲ ನೋಡಿ' : 'View source'}</span><ExternalLink size={12} /></a> : <span className="citation-unconfigured">{language === 'ta' ? 'அதிகாரப்பூர்வ இணைப்பு அமைக்கப்படவில்லை' : language === 'kn' ? 'ಅಧಿಕೃತ ಮೂಲ ಲಿಂಕ್ ಲಭ್ಯವಿಲ್ಲ' : 'Official source link not configured'}</span>}
                {c.last_verified_date && <div className="citation-meta">{language === 'ta' ? 'கடைசியாக சரிபார்த்தது:' : language === 'kn' ? 'ಕೊನೆಯ ಪರಿಶೀಲನೆ:' : 'Last verified:'} {c.last_verified_date}</div>}
              </div>
            ))}
            {!citations.length && <div className="adaptive-q-answer">{language === 'ta' ? 'LandStack தொடர்புடைய அறிவை பெற்ற பிறகு ஆதாரங்கள் தோன்றும்.' : language === 'kn' ? 'LandStack ಸಂಬಂಧಿತ ಜ್ಞಾನವನ್ನು ಪಡೆದ ನಂತರ ಮೂಲಗಳು ಕಾಣಿಸುತ್ತವೆ.' : 'Sources will appear after LandStack retrieves relevant knowledge.'}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
