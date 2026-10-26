import React, { useEffect, useState } from 'react';
import { Landmark, ShieldCheck, ExternalLink, Search, MapPin, HelpCircle, CheckCircle2, AlertTriangle, Building2, Banknote, Scale } from 'lucide-react';
import { api } from '../services/api';
import { t } from '../i18n';

export default function RegistryView({ caseData, language = 'en' }) {
  const [services, setServices] = useState([]);
  const [selectedState, setSelectedState] = useState(caseData?.state || '');
  const [checkUrl, setCheckUrl] = useState('');
  const [shieldResult, setShieldResult] = useState(null);
  const [support, setSupport] = useState(null);
  const [offices, setOffices] = useState(null);

  const coords = caseData?.land_location?.latitude && caseData?.land_location?.longitude
    ? caseData.land_location : caseData?.user_current_location;

  useEffect(() => {
    if (caseData?.state) {
      setSelectedState(caseData.state);
      loadRegistry(caseData.state);
    } else setServices([]);
    loadNearby();
  }, [caseData?.state, caseData?.land_location?.latitude, caseData?.land_location?.longitude, caseData?.user_current_location?.latitude, caseData?.user_current_location?.longitude]);

  const loadRegistry = async (state) => {
    if (!state) return;
    try { setServices(await api.getServiceRegistry(state)); } catch (e) { console.error(e); }
  };

  const loadNearby = async () => {
    if (!coords?.latitude || !coords?.longitude) { setSupport(null); setOffices(null); return; }
    try {
      const [nearby, officeData] = await Promise.all([
        api.getNearbySupport(coords.latitude, coords.longitude),
        api.getGisOffices({ state: caseData?.state || '', district: caseData?.district || '', taluk: caseData?.taluk || '', village: caseData?.village || '', latitude: coords.latitude, longitude: coords.longitude })
      ]);
      setSupport(nearby); setOffices(officeData);
    } catch (e) { console.error(e); }
  };

  const handleVerifyUrl = async (e) => {
    e.preventDefault();
    if (!checkUrl.trim()) return;
    try { setShieldResult(await api.verifyUrlScamShield(checkUrl)); } catch (err) { console.error(err); }
  };

  const L = language === 'ta';
  const K = language === 'kn';
  const E = language === 'en';
  return (
    <div className="page-container registry-view">
      <div className="section-title-bar">
        <div>
          <h2>{t(language,'registryTitle')}</h2>
          <span className="section-subtext">{L ? 'அதிகாரப்பூர்வ சேவைகள் மற்றும் உண்மையான வரைபடத் தரவின் அடிப்படையிலான அருகிலுள்ள ஆதரவு.' : 'ಅಧಿಕೃತ ಸೇವೆಗಳು ಮತ್ತು ನಿಜವಾದ ನಕ್ಷೆ ಡೇಟಾದ ಆಧಾರದ ಸಮೀಪದ ಸಹಾಯ.'}</span>
        </div>
      </div>

      <div className="registry-grid-layout">
        <div className="registry-left-col">
          <div className="card scam-shield-card">
            <div className="card-header"><span className="card-tag tag-primary">SCAM SHIELD</span><ShieldCheck size={18} /></div>
            <h3 className="card-title">{L ? 'அதிகாரப்பூர்வ இணைப்பு பாதுகாப்பு' : 'ಅಧಿಕೃತ ಲಿಂಕ್ ರಕ್ಷಣೆ'}</h3>
            <p className="card-desc">{L ? 'வழங்கப்பட்ட URL அரசு பதிவு செய்யப்பட்டதா என்பதை சரிபார்க்கவும்.' : 'ನೀಡಿದ URL ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಮೂಲದಲ್ಲಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.'}</p>
            <form onSubmit={handleVerifyUrl} className="scam-shield-form">
              <input value={checkUrl} onChange={(e) => setCheckUrl(e.target.value)} placeholder={L ? 'சரிபார்க்க URL உள்ளிடவும்...' : 'ಪರಿಶೀಲಿಸಲು URL ನಮೂದಿಸಿ...'} className="url-check-input" />
              <button type="submit" className="btn btn-primary"><span>{L ? 'சரிபார்' : 'ಪರಿಶೀಲಿಸಿ'}</span><Search size={14} /></button>
            </form>
            {shieldResult && <div className={`shield-result-box ${shieldResult.is_official ? 'result-verified' : 'result-warning'}`}><div className="shield-result-top">{shieldResult.is_official ? <CheckCircle2 size={20} className="text-green" /> : <AlertTriangle size={20} className="text-amber" />}<strong>{shieldResult.badge}</strong></div><p className="shield-result-msg">{shieldResult.message}</p></div>}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-tag tag-secondary">{E ? 'Verified official registry' : L ? 'சரிபார்க்கப்பட்ட பதிவு' : 'ಪರಿಶೀಲಿಸಿದ ನೋಂದಣಿ'}</span><div className="state-filter-select"><select value={selectedState} onChange={(e) => {setSelectedState(e.target.value); loadRegistry(e.target.value);}} className="state-dropdown"><option value="">{E ? 'Select state' : L ? 'மாநிலத்தை தேர்வு செய்க' : 'ರಾಜ್ಯ ಆಯ್ಕೆಮಾಡಿ'}</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Karnataka">Karnataka</option></select></div></div>
            <h3 className="card-title">{E ? `Official government portals (${services.length})` : L ? `அதிகாரப்பூர்வ அரசு தளங்கள் (${services.length})` : `ಅಧಿಕೃತ ಸರ್ಕಾರಿ ತಾಣಗಳು (${services.length})`}</h3>
            {!selectedState && <p className="card-desc">{L ? 'முதலில் நிலத்தின் மாநிலத்தை உறுதி செய்யவும்.' : 'ಮೊದಲು ಜಮೀನಿನ ರಾಜ್ಯವನ್ನು ಖಚಿತಪಡಿಸಿ.'}</p>}
            <div className="services-directory-list">
              {services.map((srv) => <div key={srv.id} className="service-registry-item"><div className="srv-top"><strong className="srv-name">{srv.service_name}</strong><span className="srv-badge">{srv.verification_status}</span></div><div className="srv-dept">{srv.department} • {srv.jurisdiction}</div><p className="srv-desc">{srv.description}</p><a href={srv.official_url} target="_blank" rel="noreferrer" className="srv-url-link"><span>{E ? 'Open official portal' : L ? 'அதிகாரப்பூர்வ தளம் திறக்க' : 'ಅಧಿಕೃತ ತಾಣ ತೆರೆಯಿರಿ'}</span><ExternalLink size={12} /></a>{srv.link_note && <small className="card-desc" style={{display:'block',marginTop:6}}>{srv.link_note}</small>}</div>)}
            </div>
          </div>
        </div>

        <div className="registry-right-col">
          <div className="card office-map-card">
            <div className="card-header"><span className="card-tag tag-primary">GIS / {L ? 'அருகிலுள்ள சேவைகள்' : 'ಸಮೀಪದ ಸೇವೆಗಳು'}</span><MapPin size={16} /></div>
            <h3 className="card-title">{L ? 'உண்மையான இடத்தின் அடிப்படையிலான அலுவலகங்கள்' : 'ನಿಜವಾದ ಸ್ಥಳದ ಆಧಾರದ ಕಚೇರಿಗಳು'}</h3>
            {!coords && <p className="card-desc">{L ? 'நில இடம் அல்லது தற்போதைய இடம் உறுதி செய்யப்பட்ட பிறகு அருகிலுள்ள அலுவலகங்கள் காட்டப்படும்.' : 'ಜಮೀನು ಅಥವಾ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಖಚಿತವಾದ ನಂತರ ಸಮೀಪದ ಕಚೇರಿಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತದೆ.'}</p>}
            {offices?.results?.map((o, i) => <div className="office-card-box" key={i}><div className="office-box-title"><Building2 size={16}/><strong>{o.name}</strong></div><p className="office-box-address">{o.address || (L ? 'முகவரி கிடைக்கவில்லை' : 'ವಿಳಾಸ ಲಭ್ಯವಿಲ್ಲ')}</p><div className="office-box-meta"><span>{o.distance_km} km{ o.opening_hours ? ` • ${o.opening_hours}` : ""}{ o.phone ? ` • ${o.phone}` : ""}</span></div></div>)}
            {offices?.results?.length === 0 && coords && <p className="card-desc">{L ? 'வரைபட சேவையில் அருகிலுள்ள அரசு இடம் கிடைக்கவில்லை. அதிகாரப்பூர்வ சேவை தளத்தில் பொறுப்பான அலுவலகத்தை உறுதி செய்யவும்.' : 'ನಕ್ಷೆ ಸೇವೆಯಲ್ಲಿ ಸಮೀಪದ ಸರ್ಕಾರಿ ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ಅಧಿಕೃತ ಸೇವಾ ತಾಣದಲ್ಲಿ ಜವಾಬ್ದಾರಿ ಕಚೇರಿಯನ್ನು ಖಚಿತಪಡಿಸಿ.'}</p>}
            {coords && <small>{L ? 'இது OpenStreetMap வரைபடத் தரவு; அதிகாரப்பூர்வ jurisdiction உறுதி அல்ல.' : 'ಇದು OpenStreetMap ನಕ್ಷೆ ಡೇಟಾ; ಅಧಿಕೃತ jurisdiction ದೃಢೀಕರಣವಲ್ಲ.'}</small>}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-tag tag-secondary">{L ? 'அருகிலுள்ள வங்கி' : 'ಸಮೀಪದ ಬ್ಯಾಂಕ್'}</span><Banknote size={16}/></div>
            {support?.bank?.results?.slice(0,3).map((b,i)=><div className="office-card-box" key={i}><strong>{b.name}</strong><p>{b.address || (L ? 'முகவரி இல்லை' : 'ವಿಳಾಸ ಇಲ್ಲ')}</p><span>{b.distance_km} km{b.phone ? ` • ${b.phone}` : ""} • {b.verification_note}</span>{b.website && <a href={b.website} target="_blank" rel="noreferrer" className="srv-url-link"><span>{L ? 'வலைத்தளம்' : 'ವೆಬ್‌ಸೈಟ್'}</span></a>}</div>)}
            {!support?.bank?.results?.length && <p className="card-desc">{L ? 'இந்த இடத்திற்கு வங்கி தரவு கிடைக்கவில்லை.' : 'ಈ ಸ್ಥಳಕ್ಕೆ ಬ್ಯಾಂಕ್ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ.'}</p>}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-tag tag-secondary">{L ? 'அருகிலுள்ள வழக்கறிஞர் தகவல்' : 'ಸಮೀಪದ ವಕೀಲ ಮಾಹಿತಿ'}</span><Scale size={16}/></div>
            {support?.lawyer?.results?.slice(0,3).map((a,i)=><div className="office-card-box" key={i}><strong>{a.name}</strong><p>{a.address || (L ? 'முகவரி இல்லை' : 'ವಿಳಾಸ ಇಲ್ಲ')}</p><span>{a.distance_km} km{a.phone ? ` • ${a.phone}` : ""} • {a.verification_note}</span>{a.website && <a href={a.website} target="_blank" rel="noreferrer" className="srv-url-link"><span>{L ? 'பொது தகவல் / வலைத்தளம்' : 'ಸಾರ್ವಜನಿಕ ಮಾಹಿತಿ / ವೆಬ್‌ಸೈಟ್'}</span></a>}</div>)}
            {!support?.lawyer?.results?.length && <p className="card-desc">{L ? 'அருகிலுள்ள வழக்கறிஞர் தகவல் கிடைக்கவில்லை. தனிப்பட்ட சட்ட ஆலோசனை தேவைப்பட்டால் சட்ட நிபுணரை அணுகவும்.' : 'ಸಮೀಪದ ವಕೀಲ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ. ವೈಯಕ್ತಿಕ ಕಾನೂನು ಸಲಹೆಗೆ ಕಾನೂನು ವೃತ್ತಿಪರರನ್ನು ಸಂಪರ್ಕಿಸಿ.'}</p>}
          </div>

          <div className="card seller-questions-card">
            <div className="card-header"><span className="card-tag tag-secondary">SMART GENERATOR</span><HelpCircle size={16}/></div>
            <h3 className="card-title">{L ? 'விற்பவரிடம் கேட்க வேண்டிய கேள்விகள்' : 'ಮಾರಾಟಗಾರರನ್ನು ಕೇಳಬೇಕಾದ ಪ್ರಶ್ನೆಗಳು'}</h3>
            <p className="card-desc">{L ? 'உங்கள் உண்மையான ஆவணங்கள் மற்றும் நில சூழலுக்கு ஏற்ப கேள்விகளை கேளுங்கள்.' : 'ನಿಮ್ಮ ನಿಜವಾದ ದಾಖಲೆಗಳು ಮತ್ತು ಜಮೀನು ಸಂದರ್ಭಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.'}</p>
            <div className="seller-q-list">
              {(caseData?.detected_intent === 'LAND_PURCHASE_VERIFICATION' ? [
                L ? 'பதிவு செய்யப்பட்ட உரிமை ஆவணத்தை வழங்க முடியுமா?' : 'ನೋಂದಾಯಿತ ಮಾಲೀಕತ್ವದ ದಾಖಲೆ ನೀಡಬಹುದೇ?',
                L ? 'தொடர்புடைய பழைய இணைப்பு ஆவணங்கள் உள்ளனவா?' : 'ಸಂಬಂಧಿತ ಹಿಂದಿನ ಲಿಂಕ್ ದಾಖಲೆಗಳಿವೆಯೇ?',
                L ? 'பொருந்தும் EC / பதிவு ஆதாரம் உள்ளதா?' : 'ಅನ್ವಯಿಸುವ EC / ನೋಂದಣಿ ಸಾಕ್ಷ್ಯವಿದೆಯೇ?',
                L ? 'சர்வே/எல்லை ஆதாரத்தை பார்க்க முடியுமா?' : 'ಸರ್ವೇ/ಗಡಿ ಸಾಕ್ಷ್ಯ ತೋರಿಸಬಹುದೇ?'
              ] : []).map((q,i)=><div key={i} className="seller-q-item"><strong>{q}</strong></div>)}
              {caseData?.detected_intent !== 'LAND_PURCHASE_VERIFICATION' && <p>{L ? 'நிலம் வாங்கும் கேஸ் தொடங்கிய பிறகு விற்பவர் கேள்விகள் இங்கே வரும்.' : 'ಜಮೀನು ಖರೀದಿ ಕೇಸ್ ಆರಂಭಿಸಿದ ನಂತರ ಮಾರಾಟಗಾರ ಪ್ರಶ್ನೆಗಳು ಇಲ್ಲಿ ಬರುತ್ತವೆ.'}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
