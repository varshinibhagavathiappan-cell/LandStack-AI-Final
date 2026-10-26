import React, { useEffect, useState } from 'react';
import {
  Mic, Send, ArrowRight, ShieldCheck, FileText, CheckCircle,
  AlertCircle, Sparkles, Building, ChevronRight, Layers, HelpCircle, HeartHandshake
} from 'lucide-react';
import JourneyStepper from '../components/JourneyStepper';
import { t } from '../i18n';
import { api } from '../services/api';

export default function HomeView({
  caseData,
  onNavigate,
  onSendProblem,
  onUpdateCase,
  language = 'en',
  onLanguageDetected
}) {
  const ui = (en, ta, kn) => language === 'ta' ? ta : language === 'kn' ? kn : en;
  const [inputText, setInputText] = useState('');
  const [listening, setListening] = useState(false);
  const [landLocationText, setLandLocationText] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [locationCandidates, setLocationCandidates] = useState([]);
  const [nearbySupport, setNearbySupport] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [browserLocation, setBrowserLocation] = useState(null);
  const [backendError, setBackendError] = useState('');
  const [landAreas, setLandAreas] = useState([]);
  const [incidentScan, setIncidentScan] = useState(null);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [locationStep, setLocationStep] = useState('current');
  const [landAnalysisReady, setLandAnalysisReady] = useState(false);

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
    recognition.onresult = (event) => setInputText(event.results[0][0].transcript);
    recognition.onerror = (event) => console.warn('Speech recognition error:', event.error);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const detectLanguage = (text) => {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    if (/\b(enaku|enakku|oru|venum|vendum|vang|vaang|vanganum|vangunum|irukku|irukura|enna|peru|maathanum|land|nilam)\b/i.test(text)) return 'ta';
    if (/\b(nanage|nange|nanna|bhoomi|bhumi|beku|bekagide|khareedi|jameenu|hege|hesaru|dakhale|ellide)\b/i.test(text)) return 'kn';
    return language;
  };


  const refreshCase = async () => {
    if (onUpdateCase) await onUpdateCase();
  };

  const loadNearby = async (location) => {
    if (!location?.latitude || !location?.longitude) { setNearbySupport(null); return; }
    setNearbyLoading(true);
    try {
      const [support, areas] = await Promise.all([
        api.getNearbySupport(location.latitude, location.longitude),
        api.getNearbyLandAreas(location.latitude, location.longitude)
      ]);
      setNearbySupport(support);
      setLandAreas(areas?.results || []);
      setBackendError('');
    } catch (e) {
      console.warn('Nearby lookup failed', e);
      setNearbySupport(null);
      setLandAreas([]);
      setBackendError(ui('Backend is not connected. GPS can still work, but AI questions and real nearby data require the backend.','Backend இணைக்கப்படவில்லை. GPS மட்டும் இயங்கலாம்; AI கேள்விகள் மற்றும் உண்மையான nearby data-க்கு backend URL தேவை.','Backend ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ. GPS ಕೆಲಸ ಮಾಡಬಹುದು, ಆದರೆ AI ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ನೈಜ nearby data ಗೆ backend ಅಗತ್ಯವಿದೆ.'));
    } finally { setNearbyLoading(false); }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(ui('Location service is not available in this browser. Use the land-location search below.','இந்த உலாவியில் location service இல்லை. கீழே land location search பயன்படுத்தவும்.','ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಥಳ ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ. ಕೆಳಗಿನ ಜಮೀನು ಸ್ಥಳ ಹುಡುಕಾಟ ಬಳಸಿ.'));
      return;
    }

    const handlePosition = async (pos) => {
      const local = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: new Date().toISOString(),
        display_name: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
      };
      setBrowserLocation(local);
      try {
        const res = await api.setCurrentLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        const resolved = res.location || local;
        setBrowserLocation(resolved);
        setLocationStep('choose-land');
        setLocationMessage(language === 'ta'
          ? `உங்கள் தற்போதைய இடம்: ${resolved.display_name || local.display_name}`
          : language === 'kn'
            ? `ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ: ${resolved.display_name || local.display_name}`
            : `Your current location: ${resolved.display_name || local.display_name}`);
        await refreshCase();
      } catch (e) {
        setLocationStep('choose-land');
        setLocationMessage(ui('GPS coordinates were received, but the address could not be resolved. You can still search the land location manually.','GPS coordinates கிடைத்தன, ஆனால் address resolve செய்ய முடியவில்லை. நீங்கள் land location-ஐ manual search செய்யலாம்.','GPS coordinates கிடைத்தன, ஆனால் address resolve செய்ய முடியவில்லை. You can still search the land location manually.'));
      }
    };

    const handleError = (err) => {
      const reason = err?.code === 1 ? 'Location permission was denied. Allow location for localhost in the browser, or use manual land search.'
        : err?.code === 2 ? 'Your device could not determine a location. Use manual land search.'
        : 'Location request timed out. Retrying with normal accuracy...';
      if (err?.code === 3) {
        navigator.geolocation.getCurrentPosition(handlePosition, (err2) => {
          setLocationMessage(err2?.code === 1 ? 'Location permission was denied. You can use manual land search.' : 'GPS is unavailable right now. You can use manual land search.');
        }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 });
        return;
      }
      setLocationMessage(reason);
    };

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  };

  const useCurrentAsLand = async () => {
    const loc = browserLocation || caseData?.user_current_location;
    if (!loc?.latitude || !loc?.longitude) {
      setLocationMessage(ui('Get your phone location first.','முதலில் phone location பெறவும்.','ಮೊದಲು ನಿಮ್ಮ ಫೋನ್ ಸ್ಥಳ ಪಡೆಯಿರಿ.'));
      return;
    }
    try {
      const res = await api.setLandLocation({ latitude: loc.latitude, longitude: loc.longitude });
      if (!res.verified) throw new Error(res.message || 'Land location not verified');
      setLocationStep('land-selected');
      setLandAnalysisReady(false);
      setLocationMessage(ui(`This place is selected as the land location: ${res.location?.display_name || ''}`,`இந்த இடம் land location ஆக தேர்வு செய்யப்பட்டது: ${res.location?.display_name || ''}`,`ಈ ಸ್ಥಳವನ್ನು ಜಮೀನು ಸ್ಥಳವಾಗಿ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ: ${res.location?.display_name || ''}`));
      await refreshCase();
      await runLandAnalysis(res.location || loc);
    } catch (e) {
      setLocationMessage(ui('The backend is required to save the land location.','Land location சேமிக்க backend தேவை.','ಜಮೀನು ಸ್ಥಳವನ್ನು ಉಳಿಸಲು backend ಅಗತ್ಯವಿದೆ.'));
    }
  };

  const runLandAnalysis = async (location) => {
    if (!location?.latitude || !location?.longitude) return;
    setIncidentLoading(true);
    try {
      const scan = await api.getPublicIncidentScan(location.latitude, location.longitude, location.display_name || '');
      setIncidentScan(scan);
      setLandAnalysisReady(true);
    } catch (e) {
      setIncidentScan({ error: 'Backend not connected', limitation: 'The public scan could not run because the LandStack backend is not connected.' });
      setLandAnalysisReady(false);
    } finally { setIncidentLoading(false); }
  };

  const setLandFromText = async () => {
    if (!landLocationText.trim()) return;
    let res;
    try { res = await api.setLandLocation({ query: landLocationText.trim() }); } catch { setLocationMessage(ui('Backend is not connected. Start or deploy the backend first.','Backend இணைக்கப்படவில்லை. முதலில் backend deploy செய்ய வேண்டும்.','Backend ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ. ಮೊದಲು backend ಅನ್ನು ಪ್ರಾರಂಭಿಸಿ ಅಥವಾ deploy ಮಾಡಿ.')); return; }
    if (res.verified) {
      setLocationCandidates([]);
      setLocationStep('land-selected');
      setLandAnalysisReady(false);
      setLocationMessage(language === 'ta' ? `நில இடம் சரிபார்க்கப்பட்டது: ${res.location?.display_name || landLocationText}` : language === 'kn' ? `ಜಮೀನು ಸ್ಥಳ ಪರಿಶೀಲಿಸಲಾಗಿದೆ: ${res.location?.display_name || landLocationText}` : `Land location verified: ${res.location?.display_name || landLocationText}`);
      await refreshCase();
      await runLandAnalysis(res.location);
    } else {
      setLocationCandidates(res.candidates || []);
      setLocationMessage(res.message || (ui('Choose a more specific location.','மேலும் துல்லியமான இடத்தை தேர்வு செய்யவும்.','ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟ ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ.')));
    }
  };

  const chooseLocationCandidate = async (candidate) => {
    let res;
    try { res = await api.setLandLocation({ latitude: candidate.latitude, longitude: candidate.longitude }); } catch { setLocationMessage(language === 'ta' ? 'Backend இணைக்கப்படவில்லை.' : 'Backend is not connected.'); return; }
    if (res.verified) {
      setLocationCandidates([]);
      setLocationStep('land-selected');
      setLandAnalysisReady(false);
      setLocationMessage(language === 'ta' ? `நில இடம் தேர்வு செய்யப்பட்டது: ${candidate.display_name}` : language === 'kn' ? `ಜಮೀನು ಸ್ಥಳ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ: ${candidate.display_name}` : `Land location selected: ${candidate.display_name}`);
      await refreshCase();
      await runLandAnalysis(res.location || candidate);
    }
  };

  useEffect(() => {
    const land = caseData?.land_location?.latitude ? caseData.land_location : null;
    const current = caseData?.user_current_location?.latitude ? caseData.user_current_location : null;
    loadNearby(land || current);
  }, [caseData?.land_location?.latitude, caseData?.land_location?.longitude, caseData?.user_current_location?.latitude, caseData?.user_current_location?.longitude]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      const detected = detectLanguage(inputText.trim());
      if (detected !== language && onLanguageDetected) onLanguageDetected(detected);
      onSendProblem(inputText.trim(), detected);
    }
  };

  const nextAction = caseData?.next_best_action || {};
  const gapsCount = caseData?.verification_gaps?.filter(g => g.status === 'OPEN').length || 0;
  const docsCount = caseData?.uploaded_documents?.length || 0;
  const readiness = caseData?.readiness_score ?? 0;

  return (
    <div className="page-container home-view">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-badge">
          <Sparkles size={14} /> CITIZEN LAND DECISION COPILOT
        </div>
        <h1 className="hero-title">
          {ui('An AI assistant that understands your land needs in your language','உங்கள் நிலத் தேவையை உங்கள் மொழியிலேயே புரிந்து கொள்ளும் AI உதவியாளர்','ನಿಮ್ಮ ಭೂಮಿ ಅಗತ್ಯವನ್ನು ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವ AI ಸಹಾಯಕ')}
        </h1>
        <p className="hero-subtitle">
          {ui('You do not need to know the official service name. Describe your problem naturally. LandStack AI will guide you using verified information and your real documents.','அரசு சேவையின் பெயர் தெரியாவிட்டாலும் உங்கள் பிரச்சனையை இயல்பாகப் பேசுங்கள். LandStack AI வழிகாட்டும், உண்மையான ஆவணங்களை ஆய்வு செய்யும், சரிபார்ப்பு இடைவெளிகளை காட்டும்.','ಯಾವ ಅಧಿಕೃತ ಭೂ ಸೇವೆ ಬೇಕು ಎಂದು ತಿಳಿದಿರಬೇಕಾಗಿಲ್ಲ. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಸಹಜವಾಗಿ ಹೇಳಿ. LandStack AI ನಿಜವಾದ ಮಾಹಿತಿಯ ಆಧಾರದಲ್ಲಿ ಮುಂದಿನ ಕ್ರಮವನ್ನು ಮಾರ್ಗದರ್ಶಿಸುತ್ತದೆ.')}
        </p>

        <div className="card" style={{marginTop:16, marginBottom:16, border:'2px solid rgba(37,99,235,.22)'}}>
          <div className="card-header"><div className="card-tag tag-primary">📍 {ui('STEP 1 — Your current location','STEP 1 — உங்கள் தற்போதைய location','STEP 1 — ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ')}</div></div>
          <p className="card-desc">{ui('First get the phone GPS location. Then choose whether that is the land or a different land.','முதலில் phone GPS location பெறுங்கள். பிறகு அந்த இடமே land ஆ, வேறு land ஆ என்பதை தேர்வு செய்யுங்கள்.','ಮೊದಲು ಫೋನ್ GPS ಸ್ಥಳ ಪಡೆಯಿರಿ. ನಂತರ ಅದೇ ಸ್ಥಳವೇ ಜಮೀನು ಅಥವಾ ಬೇರೆ ಜಮೀನು ಎಂದು ಆಯ್ಕೆಮಾಡಿ.')}</p>
          <button type="button" className="btn btn-primary" onClick={getCurrentLocation}>📍 {ui('Get my phone location','என் phone location-ஐ பெறவும்','ನನ್ನ ಫೋನ್ ಸ್ಥಳ ಪಡೆಯಿರಿ')}</button>
          {browserLocation && <p className="card-desc" style={{marginTop:8}}>GPS: {browserLocation.display_name}</p>}
          {backendError && <div className="warning-box" style={{marginTop:10}}>{backendError}</div>}
        </div>

        <div className="card" style={{marginTop:16, marginBottom:16}}>
          <div className="card-header"><div className="card-tag tag-secondary">{ui('Land location — first','நில இடம் — முதலில்','ಜಮೀನು ಸ್ಥಳ — ಮೊದಲು')}</div></div>
          <p className="card-desc">{ui('Your current location and land location may be different. Confirm the land location separately.','உங்கள் தற்போதைய இடமும் நிலம் இருக்கும் இடமும் வேறுபடலாம். நிலம் இருக்கும் இடத்தை தனியாக உறுதி செய்யுங்கள்.','ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಮತ್ತು ಜಮೀನು ಇರುವ ಸ್ಥಳ ಬೇರೆ ಇರಬಹುದು. ಜಮೀನು ಇರುವ ಸ್ಥಳವನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ಖಚಿತಪಡಿಸಿ.')}</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <input value={landLocationText} onChange={(e)=>setLandLocationText(e.target.value)} placeholder={ui('District / taluk / village / area','மாவட்டம் / வட்டம் / கிராமம் / பகுதி','ಜಿಲ್ಲೆ / ತಾಲೂಕು / ಗ್ರಾಮ / ಪ್ರದೇಶ')} className="problem-text-input" style={{flex:1,minWidth:260}} />
            <button type="button" className="btn btn-outline" onClick={setLandFromText}>{ui('Set land location','நில இடத்தை அமைக்க','ಜಮೀನು ಸ್ಥಳ ಹೊಂದಿಸಿ')}</button>
            <button type="button" className="btn btn-primary" onClick={useCurrentAsLand}>{ui('Use my current location','என் தற்போதைய இடத்தை பயன்படுத்த','ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ')}</button>
          </div>
          {locationMessage && <p className="card-desc" style={{marginTop:8}}>{locationMessage}</p>}
          {locationCandidates.length > 0 && (
            <div style={{marginTop:12}}>
              <strong>{ui('Location choices:','இடத் தேர்வுகள்:','ಸ್ಥಳ ಆಯ್ಕೆಗಳು:')}</strong>
              <div style={{display:'grid',gap:8,marginTop:8}}>
                {locationCandidates.map((c, i) => (
                  <button key={`${c.latitude}-${c.longitude}-${i}`} type="button" className="btn btn-outline" style={{textAlign:'left'}} onClick={() => chooseLocationCandidate(c)}>
                    📍 {c.display_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {((caseData?.land_location?.latitude || caseData?.user_current_location?.latitude) || browserLocation?.latitude) && (
            <div className="landstack-location-grid" style={{marginTop:16}}>
              <div className="card" style={{padding:0,overflow:'hidden',minHeight:280}}>
                <div style={{padding:'10px 14px',fontWeight:700}}>
                  📍 {caseData?.land_location?.latitude ? ui('Land location map','நில இட வரைபடம்','ಜಮೀನು ಸ್ಥಳ ನಕ್ಷೆ') : ui('Current location map','தற்போதைய இட வரைபடம்','ಪ್ರಸ್ತುತ ಸ್ಥಳ ನಕ್ಷೆ')}
                </div>
                {(() => {
                  const lat = caseData?.land_location?.latitude || caseData?.user_current_location?.latitude || browserLocation?.latitude;
                  const lon = caseData?.land_location?.longitude || caseData?.user_current_location?.longitude || browserLocation?.longitude;
                  return <iframe
                    title="LandStack real OpenStreetMap location"
                    style={{width:'100%',height:240,border:0}}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${lat}%2C${lon}&bbox=${lon-0.025}%2C${lat-0.02}%2C${lon+0.025}%2C${lat+0.02}`}
                  />;
                })()}
                <div style={{padding:'8px 14px',fontSize:12}}>OpenStreetMap map data • {ui('Not a government ownership record','உரிமைப் பதிவு அல்ல','ಸರ್ಕಾರಿ ಮಾಲೀಕತ್ವ ದಾಖಲೆ ಅಲ್ಲ')}</div>
              </div>

              <div className="card" style={{margin:0}}>
                <div className="card-header">
                  <span className="card-tag tag-secondary">{ui('Banks in the selected area','அருகிலுள்ள வங்கிகள்','ಆಯ್ಕೆ ಮಾಡಿದ ಪ್ರದೇಶದ ಬ್ಯಾಂಕ್‌ಗಳು')}</span>
                  <Building size={16}/>
                </div>
                {nearbyLoading && <p className="card-desc">{ui('Searching real mapped places...','உண்மையான அருகிலுள்ள இடங்களை தேடுகிறது...','ನಿಜವಾದ ನಕ್ಷೆ ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...')}</p>}
                {!nearbyLoading && nearbySupport?.bank?.results?.length > 0 && nearbySupport.bank.results.slice(0,5).map((b,i)=>(
                  <div key={i} className="office-card-box">
                    <strong>{b.name}</strong>
                    <p>{b.address || (ui('Address not listed','முகவரி கிடைக்கவில்லை','ವಿಳಾಸ ಲಭ್ಯವಿಲ್ಲ'))}</p>
                    <span>{b.distance_km} km{b.phone ? ` • ${b.phone}` : ''}</span>
                    <small style={{display:'block',marginTop:4}}>{ui(`Source: ${nearbySupport.bank.source || 'real map data'}; verify with the bank.`,`ஆதாரம்: ${nearbySupport.bank.source || 'real map data'}; வங்கியிடம் உறுதி செய்யவும்.`,`ಮೂಲ: ${nearbySupport.bank.source || 'real map data'}; ಬ್ಯಾಂಕ್‌ನೊಂದಿಗೆ ದೃಢೀಕರಿಸಿ.`)}</small>
                  </div>
                ))}
                {!nearbyLoading && !nearbySupport?.bank?.results?.length && <p className="card-desc">{ui('No real bank data was returned in the searched area.','இந்த இடத்திற்கு அருகிலுள்ள வங்கி தரவு கிடைக்கவில்லை.','ಹುಡುಕಿದ ಪ್ರದೇಶದಲ್ಲಿ ನಿಜವಾದ ಬ್ಯಾಂಕ್ ಡೇಟಾ ಸಿಗಲಿಲ್ಲ.')}</p>}
              </div>
            </div>
          )}
        </div>

        {(caseData?.land_location?.latitude || browserLocation?.latitude) && (
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><div className="card-tag tag-secondary">🗺️ {ui('Nearby mapped land areas','அருகிலுள்ள mapped land areas','ಹತ್ತಿರದ ನಕ್ಷೆ ಮಾಡಿದ ಭೂ ಪ್ರದೇಶಗಳು')}</div></div>
            <p className="card-desc">{ui('These are OpenStreetMap land-use areas only. They are not cadastral parcels or ownership records.','இவை OpenStreetMap-ல் map செய்யப்பட்ட land-use பகுதிகள் மட்டுமே. இவை அரசு cadastral parcels அல்லது ownership records அல்ல.','ಇವು OpenStreetMap ನಲ್ಲಿ ನಕ್ಷೆ ಮಾಡಿದ land-use ಪ್ರದೇಶಗಳು ಮಾತ್ರ. ಇವು ಸರ್ಕಾರಿ cadastral parcels ಅಥವಾ ownership records ಅಲ್ಲ.')}</p>
            {landAreas.length ? <div style={{display:'grid',gap:8}}>{landAreas.slice(0,6).map((a,i)=><button key={i} type="button" className="btn btn-outline" style={{textAlign:'left'}} onClick={()=>setLandLocationText(`${a.latitude}, ${a.longitude}`)}>📍 {a.name} • {a.distance_km} km</button>)}</div> : <p className="card-desc">{ui('Nearby mapped land areas will appear after the backend is connected.','Backend இணைந்ததும் அருகிலுள்ள mapped land areas வரும்.','Backend ಸಂಪರ್ಕಗೊಂಡ ನಂತರ ಹತ್ತಿರದ ನಕ್ಷೆ ಮಾಡಿದ ಭೂ ಪ್ರದೇಶಗಳು ಕಾಣಿಸುತ್ತವೆ.')}</p>}
          </div>
        )}

        {caseData?.land_location?.latitude && (
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><div className="card-tag tag-secondary">🔎 {ui('Land public incident / dispute scan','Land public incident / dispute scan','ಭೂಮಿ ಸಾರ್ವಜನಿಕ ಘಟನೆ / ವಿವಾದ ಪರಿಶೀಲನೆ')}</div></div>
            <p className="card-desc">{ui('This scan is only a discovery aid using publicly indexed news and public court search. No result does not mean nothing happened.','இந்த scan பொதுவாக index செய்யப்பட்ட news reports மற்றும் public court search-ஐ discovery உதவியாக மட்டும் பயன்படுத்தும். “No result” என்பது “எதுவும் நடக்கவில்லை” என்று அர்த்தமல்ல.','ಈ scan ಸಾರ್ವಜನಿಕವಾಗಿ index ಆದ news reports ಮತ್ತು public court search ಅನ್ನು discovery ಸಹಾಯವಾಗಿ ಮಾತ್ರ ಬಳಸುತ್ತದೆ. “No result” ಎಂದರೆ ಏನೂ ಆಗಿಲ್ಲ ಎಂದಲ್ಲ.')}</p>
            <button type="button" className="btn btn-outline" disabled={incidentLoading} onClick={()=>runLandAnalysis(caseData.land_location)}>🔍 {incidentLoading ? 'Scanning…' : (ui('Public records / news scan','Public records / news scan','ಸಾರ್ವಜನಿಕ ದಾಖಲೆ / ಸುದ್ದಿ ಪರಿಶೀಲನೆ'))}</button>
            {incidentScan?.results?.length ? <div style={{marginTop:12,display:'grid',gap:8}}>{incidentScan.results.slice(0,8).map((r,i)=><a key={i} href={r.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{textAlign:'left'}}>{r.title}</a>)}</div> : incidentScan?.error ? <p className="card-desc">Backend not connected.</p> : null}
            {incidentScan?.limitation && <div className="warning-box" style={{marginTop:10}}>{incidentScan.limitation}</div>}
            <a href="https://services.ecourts.gov.in/ecourtindia_v6/" target="_blank" rel="noreferrer" className="btn btn-outline" style={{marginTop:8}}>Open official eCourts</a>
          </div>
        )}

        {caseData?.land_location?.latitude && landAnalysisReady && (
          <div className="card" style={{marginBottom:16,border:'2px solid rgba(16,185,129,.25)'}}>
            <div className="card-header"><div className="card-tag tag-primary">✅ {ui('LAND ANALYSIS COMPLETE — What do you want to do next?','LAND ANALYSIS முடிந்தது — அடுத்து என்ன செய்ய வேண்டும்?','LAND ANALYSIS ಪೂರ್ಣಗೊಂಡಿದೆ — ಮುಂದೆ ಏನು ಮಾಡಬೇಕು?')}</div></div>
            <p className="card-desc">{ui('The public information scan is complete. It is not an ownership or “no case” guarantee. Now choose your goal; the relevant questions will appear one at a time.','முதலில் இந்த land-க்கு public information scan முடிந்தது. இது ownership அல்லது “no case” guarantee அல்ல. இப்போது உங்கள் தேவையை தேர்வு செய்யுங்கள்; அதற்கேற்ற கேள்விகள் ஒன்றன்பின் ஒன்றாக வரும்.','ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ scan ಪೂರ್ಣಗೊಂಡಿದೆ. ಇದು ownership ಅಥವಾ “no case” guarantee ಅಲ್ಲ. ಈಗ ನಿಮ್ಮ ಗುರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ; ಸಂಬಂಧಿತ ಪ್ರಶ್ನೆಗಳು ಒಂದೊಂದಾಗಿ ಬರುತ್ತವೆ.')}</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10}}>
              {[
                ['LAND_PURCHASE_VERIFICATION', ui('🏠 I want to buy this land','🏠 இந்த land-ஐ வாங்க வேண்டும்','🏠 ನನಗೆ ಈ ಜಮೀನನ್ನು ಖರೀದಿಸಬೇಕು'), ui('Verify before buying','இந்த land-ஐ வாங்குவதற்கு முன் சரிபார்க்க','ಖರೀದಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ')],
                ['INHERITED_LAND_TRANSFER', ui('👨‍👩‍👧 Inherited / family land','👨‍👩‍👧 வாரிசு / குடும்ப land','👨‍👩‍👧 ವಾರಸುದಾರ / ಕುಟುಂಬ ಜಮೀನು'), ui('Inheritance / transfer','பெயர் மாற்றம் / வாரிசு','ವಾರಸುದಾರಿಕೆ / ವರ್ಗಾವಣೆ')],
                ['PATTA_TRANSFER', ui('📜 Patta / name change','📜 Patta / பெயர் மாற்றம்','📜 ಪಟ್ಟಾ / ಹೆಸರು ಬದಲಾವಣೆ'), ui('Record name change','பதிவு பெயர் மாற்றம்','ದಾಖಲೆ ಹೆಸರು ಬದಲಾವಣೆ')],
                ['BOUNDARY_DISPUTE', ui('📐 Boundary / survey issue','📐 Boundary / survey பிரச்சனை','📐 ಗಡಿ / ಸರ್ವೇ ಸಮಸ್ಯೆ'), ui('Boundary / area verification','எல்லை / பரப்பளவு சரிபார்ப்பு','ಗಡಿ / ವಿಸ್ತೀರ್ಣ ಪರಿಶೀಲನೆ')]
              ].map(([intent,label,sub]) => (
                <button key={intent} type="button" className="btn btn-outline" style={{textAlign:'left',padding:14}} onClick={() => {
                  const messages = {
                    LAND_PURCHASE_VERIFICATION: language === 'ta' ? 'இந்த land-ஐ வாங்குவதற்கு முன் முழுமையாக சரிபார்க்க வேண்டும்.' : 'I want to verify this land before buying it.',
                    INHERITED_LAND_TRANSFER: language === 'ta' ? 'இந்த land வாரிசு / குடும்ப land; ownership transfer பற்றி உதவி வேண்டும்.' : 'This is inherited or family land and I need transfer guidance.',
                    PATTA_TRANSFER: language === 'ta' ? 'இந்த land-க்கு patta அல்லது record name change வேண்டும்.' : 'I need patta or land-record name change guidance.',
                    BOUNDARY_DISPUTE: language === 'ta' ? 'இந்த land-ன் boundary அல்லது survey/extent-ஐ சரிபார்க்க வேண்டும்.' : 'I need to verify the land boundary, survey or extent.'
                  };
                  onSendProblem(messages[intent], language);
                  onNavigate('assistant');
                }}><strong>{label}</strong><small style={{display:'block',marginTop:4,opacity:.75}}>{sub}</small></button>
              ))}
            </div>
            <button type="button" className="btn btn-primary" style={{marginTop:12}} onClick={()=>onNavigate('assistant')}>💬 {ui('Describe another land problem','வேறு land problem-ஐ சொல்லுங்கள்','ಮತ್ತೊಂದು ಜಮೀನು ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ')}</button>
          </div>
        )}

        {/* Problem Input Box */}
        <form onSubmit={handleSubmit} className="problem-input-card">
          <div className="input-field-wrapper">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                ui('Type or speak your land need...','உங்கள் நிலத் தேவையை தட்டச்சு செய்யவும் அல்லது பேசவும்...','ನಿಮ್ಮ ಭೂಮಿ ಅಗತ್ಯವನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ...')
              }
              className="problem-text-input"
            />
            <button
              type="button"
              className="voice-input-btn"
              title={listening ? 'Listening…' : 'Voice Input (Speech Recognition)'}
              onClick={startVoiceInput}
            >
              <Mic size={18} />
            </button>
            <button type="submit" className="submit-problem-btn">
              <span>{t(language,'analyze')}</span>
              <Send size={16} />
            </button>
          </div>

          <div className="quick-prompts">
            <span className="quick-prompt-label">
              {t(language,'quickExamples')}
            </span>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => setInputText(ui('I want to buy land.','எனக்கு நிலம் வாங்க வேண்டும்.','ನನಗೆ ಜಮೀನು ಖರೀದಿಸಬೇಕು.'))}
            >
              🏠 {ui('Land purchase','நிலம் வாங்குதல்','ಜಮೀನು ಖರೀದಿ')}
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => setInputText(ui('I want to verify the documents before buying land.','நிலம் வாங்குவதற்கு முன் ஆவணங்களை சரிபார்க்க வேண்டும்.','ಜಮೀನು ಖರೀದಿಸುವ ಮೊದಲು ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಬೇಕು.'))}
            >
              🔍 {ui('Pre-purchase verification','வாங்குமுன் சரிபார்ப்பு','ಖರೀದಿಗೆ ಮೊದಲು ಪರಿಶೀಲನೆ')}
            </button>
            <button
              type="button"
              className="prompt-chip"
              onClick={() => setInputText(ui('The area in the document is different.','பத்திரத்தில் உள்ள பரப்பளவு வேறுபடுகிறது.','ದಾಖಲೆಯಲ್ಲಿರುವ ವಿಸ್ತೀರ್ಣದಲ್ಲಿ ವ್ಯತ್ಯಾಸ ಇದೆ.'))}
            >
              📐 {ui('Area mismatch','பரப்பளவு வேறுபாடு','ವಿಸ್ತೀರ್ಣ ವ್ಯತ್ಯಾಸ')}
            </button>
          </div>
        </form>
      </section>

      {/* 11-Step Connected Journey Stepper */}
      <JourneyStepper currentStep={caseData?.stage || 'VERIFICATION'} language={language} />

      {/* Case Dashboard Quick Overview */}
      <section className="dashboard-grid">
        {/* Next-Best Action Hero Card */}
        <div className="card next-action-card">
          <div className="card-header">
            <div className="card-tag tag-primary">{ui('Next action','அடுத்த செயல்','ಮುಂದಿನ ಕ್ರಮ')}</div>
            <span className="urgency-badge">{ui('Priority','முக்கியத்துவம்','ತುರ್ತು')}: {nextAction.urgency || 'HIGH'}</span>
          </div>
          <h3 className="next-action-title">
            {nextAction.title || (caseData?.is_demo_mode ? 'Start the judging workflow' : 'Describe your land problem to begin')}
          </h3>
          <p className="next-action-summary">
            {nextAction.summary || (caseData?.is_demo_mode ? 'Use the Demo Controls above for the synthetic judging walkthrough.' : 'Your case is empty. Describe the problem to create a personalized plan.')}
          </p>

          <div className="action-steps-mini">
            <span className="mini-steps-title">{ui('Recommended steps:','பரிந்துரைக்கப்பட்ட படிகள்:','ಶಿಫಾರಸು ಮಾಡಿದ ಹಂತಗಳು:')}</span>
            <ul>
              {(nextAction.step_by_step || []).slice(0, 3).map((s, idx) => (
                <li key={idx}>
                  <CheckCircle size={14} className="step-icon-check" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="next-action-footer">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('evidence')}
            >
              <span>{ui('Evidence & gaps','ஆதாரம் & இடைவெளிகள்','ಸಾಕ್ಷ್ಯ ಮತ್ತು ಅಂತರಗಳು')}</span>
              <ArrowRight size={16} />
            </button>
            {nextAction.official_service_url && (
              <a
                href={nextAction.official_service_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                <span>{t(language,'officialPortal')}</span>
                <ChevronRight size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Quick Stats & Living Case Snapshot */}
        <div className="card case-snapshot-card">
          <div className="card-header">
            <div className="card-tag tag-secondary">{t(language,'livingCase')}</div>
            <span className="case-id-text">{caseData?.case_id}</span>
          </div>

          <div className="stats-row">
            <div className="stat-tile">
              <div className="stat-num">{readiness}%</div>
              <div className="stat-label">{t(language,'readiness')}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-num">{docsCount}</div>
              <div className="stat-label">{t(language,'documentsCount')}</div>
            </div>
            <div className="stat-tile">
              <div className={`stat-num ${gapsCount > 0 ? 'text-amber' : 'text-green'}`}>
                {gapsCount}
              </div>
              <div className="stat-label">{t(language,'openGaps')}</div>
            </div>
          </div>

          <div className="snapshot-details">
            <div className="detail-item">
              <span className="detail-label">{t(language,'citizen')}:</span>
              <span className="detail-val">{caseData?.citizen_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t(language,'location')}:</span>
              <span className="detail-val">
                {caseData?.village}, {caseData?.taluk}, {caseData?.district}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t(language,'survey')}:</span>
              <span className="detail-val">{caseData?.property_passport?.survey_number || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">{t(language,'serviceIntent')}:</span>
              <span className="detail-val">{caseData?.intent_title}</span>
            </div>
          </div>

          <div className="quick-nav-links">
            <button className="nav-shortcut-btn" onClick={() => onNavigate('passport')}>
              <ShieldCheck size={16} /> {ui('Land DNA','Land DNA','Land DNA')}
            </button>
            <button className="nav-shortcut-btn" onClick={() => onNavigate('evidence')}>
              <Layers size={16} /> {ui('Evidence Graph','ஆதார கிராப்','ಸಾಕ್ಷ್ಯ ಗ್ರಾಫ್')}
            </button>
            <button className="nav-shortcut-btn" onClick={() => onNavigate('documents')}>
              <FileText size={16} /> {t(language,'documentsCount')}
            </button>
            <button className="nav-shortcut-btn" onClick={() => onNavigate('women')}>
              <HeartHandshake size={16} /> {ui('Women Support','பெண்கள் உதவி','ಮಹಿಳಾ ಸಹಾಯ')}
            </button>
          </div>
        </div>
      </section>

      {/* Innovation Layer Features Showcase */}
      <section className="features-strip">
        <h2 className="strip-title">{ui('LandStack AI Innovation Architecture','LandStack AI புதுமை கட்டமைப்பு','LandStack AI ನವೀನತಾ ವಿನ್ಯಾಸ')}</h2>
        <div className="features-grid">
          <div className="feature-item" onClick={() => onNavigate('evidence')}>
            <div className="feature-icon icon-cyan">
              <Layers size={20} />
            </div>
            <h4>{ui('Evidence Graph','ஆதார கிராப்','ಸಾಕ್ಷ್ಯ ಗ್ರಾಫ್')} & Missing Links</h4>
            <p>{ui('Interactive graph connecting Person → Document → Owner → Survey No with automated discrepancy alerts.','Person → Document → Owner → Survey No இணைப்புகளை தானாக முரண்பாடு எச்சரிக்கைகளுடன் காட்டும் கிராப்.','Person → Document → Owner → Survey No ಸಂಪರ್ಕಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತ ವ್ಯತ್ಯಾಸ ಎಚ್ಚರಿಕೆಗಳೊಂದಿಗೆ ತೋರಿಸುವ ಗ್ರಾಫ್.')}</p>
          </div>

          <div className="feature-item" onClick={() => onNavigate('evidence')}>
            <div className="feature-icon icon-purple">
              <AlertCircle size={20} />
            </div>
            <h4>{ui('Verification Dependency Map','சரிபார்ப்பு சார்பு வரைபடம்','ಪರಿಶೀಲನಾ ಅವಲಂಬನೆ ನಕ್ಷೆ')}</h4>
            <p>{ui('Prevents premature filings by gating downstream readiness on upstream boundary and title reconciliation.','எல்லை மற்றும் உரிமை சரிபார்ப்பு முடியும் வரை முன்கூட்டிய தாக்கல்களைத் தடுக்கிறது.','ಗಡಿ ಮತ್ತು ಹಕ್ಕು ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಳ್ಳುವವರೆಗೆ ಮುಂಚಿತ ಸಲ್ಲಿಕೆಗಳನ್ನು ತಡೆಯುತ್ತದೆ.')}</p>
          </div>

          <div className="feature-item" onClick={() => onNavigate('passport')}>
            <div className="feature-icon icon-emerald">
              <ShieldCheck size={20} />
            </div>
            <h4>{ui('Land DNA','Land DNA','Land DNA')} / Property Passport</h4>
            <p>{ui('Structured property profile tracking owner, extent, guideline value, and verification status across generations.','உரிமையாளர், பரப்பளவு, வழிகாட்டி மதிப்பு மற்றும் தலைமுறை வாரியான சரிபார்ப்பு நிலையை கண்காணிக்கும் சொத்து சுயவிவரம்.','ಮಾಲೀಕರು, ವಿಸ್ತೀರ್ಣ, ಮಾರ್ಗಸೂಚಿ ಮೌಲ್ಯ ಮತ್ತು ಪೀಳಿಗೆಯ ಪರಿಶೀಲನಾ ಸ್ಥಿತಿಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವ ಆಸ್ತಿ ಪ್ರೊಫೈಲ್.')}</p>
          </div>

          <div className="feature-item" onClick={() => onNavigate('family')}>
            <div className="feature-icon icon-amber">
              <Building size={20} />
            </div>
            <h4>{ui('Family Land Decision Room','குடும்ப நில முடிவு அறை','ಕುಟುಂಬ ಭೂಮಿ ನಿರ್ಧಾರ ಕೊಠಡಿ')}</h4>
            <p>{ui('Multi-stakeholder collaboration room where legal heirs can review evidence, give consent, and track milestones.','சட்ட வாரிசுகள் ஆதாரங்களை பார்த்து, ஒப்புதல் அளித்து, முன்னேற்றத்தை கண்காணிக்க உதவும் ஒத்துழைப்பு அறை.','ಕಾನೂನು ವಾರಸುದಾರರು ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲಿಸಿ, ಒಪ್ಪಿಗೆ ನೀಡಿ, ಮೈಲಿಗಲ್ಲುಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುವ ಸಹಯೋಗ ಕೊಠಡಿ.')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
