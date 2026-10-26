import React, { useEffect, useMemo, useState } from 'react';
import { Map, MapPin, LocateFixed, Search, Building2, Scale, Landmark, RefreshCw, ExternalLink } from 'lucide-react';
import MapLibreLandMap from '../components/MapLibreLandMap';
import { api } from '../services/api';

function mapEmbedUrl(lat, lon) {
  const d = 0.045;
  const bbox = `${lon-d},${lat-d},${lon+d},${lat+d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`;
}

export default function LandMapView({ caseData, onUpdateCase, language = 'en' }) {
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [searching, setSearching] = useState(false);
  const [nearby, setNearby] = useState(null);
  const [lawyerDirectory, setLawyerDirectory] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [message, setMessage] = useState('');

  const ta = language === 'ta';
  const kn = language === 'kn';
  const en = language === 'en';
  const text = (enText, taText, knText) => en ? enText : ta ? taText : knText;
  const land = caseData?.land_location || {};
  const current = caseData?.user_current_location || {};
  const coords = useMemo(() => {
    if (land.latitude != null && land.longitude != null) return { lat: land.latitude, lon: land.longitude, source: 'land' };
    if (current.latitude != null && current.longitude != null) return { lat: current.latitude, lon: current.longitude, source: 'current' };
    return null;
  }, [land, current]);

  useEffect(() => {
    if (coords) loadNearby(coords.lat, coords.lon);
    if (caseData?.state) api.getLawyerDirectory(caseData.state, caseData?.district || '').then(setLawyerDirectory).catch(() => setLawyerDirectory(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.lat, coords?.lon, caseData?.state, caseData?.district]);

  async function searchLand(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setMessage('');
    try {
      const data = await api.geocodeLocation(query.trim(), caseData?.state || '');
      setCandidates(data || []);
      if (!data?.length) setMessage(text('Location not found. Try a more specific place.', 'இடம் கிடைக்கவில்லை. மேலும் குறிப்பாக தேடவும்.', 'ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ. ಇನ್ನಷ್ಟು ನಿರ್ದಿಷ್ಟವಾಗಿ ಹುಡುಕಿ.'));
    } catch { setMessage(text('Could not search for the location.', 'இடத்தை தேட முடியவில்லை.', 'ಸ್ಥಳ ಹುಡುಕಲಾಗಲಿಲ್ಲ.')); }
    finally { setSearching(false); }
  }

  async function chooseLand(loc) {
    setMessage('');
    const result = await api.setLandLocation({ latitude: loc.latitude, longitude: loc.longitude });
    if (result?.verified) {
      setCandidates([]); setQuery('');
      await onUpdateCase();
      setMessage(text(`${result.location?.state || 'State'} workflow activated.`, `${result.location?.state || 'மாநிலம்'} workflow செயல்படுத்தப்பட்டது.`, `${result.location?.state || 'ರಾಜ್ಯ'} workflow ಸಕ್ರಿಯವಾಗಿದೆ.`));
    } else setMessage(result?.message || 'Could not confirm land location.');
  }

  async function useCurrentAsLand() {
    if (!current.latitude || !current.longitude) {
      setMessage(text('Allow phone location first.', 'முதலில் phone location அனுமதிக்கவும்.', 'ಮೊದಲು phone location ಅನುಮತಿಸಿ.'));
      return;
    }
    await chooseLand(current);
  }

  async function loadNearby(lat, lon) {
    setNearbyLoading(true);
    try { setNearby(await api.getNearbySupport(lat, lon)); }
    catch { setNearby(null); }
    finally { setNearbyLoading(false); }
  }

  const officialCaseUrl = 'https://services.ecourts.gov.in/ecourtindia_v6/';
  const state = caseData?.state || '';

  return (
    <div className="page-container map-page">
      <div className="page-hero">
        <div>
          <div className="eyebrow"><Map size={15}/> LAND LOCATION INTELLIGENCE</div>
          <h1>{text('Land location & service map','நில இடம் & சேவை வரைபடம்','ಭೂಮಿ ಸ್ಥಳ ಮತ್ತು ಸೇವಾ ನಕ್ಷೆ')}</h1>
          <p>{text('Your phone location and land location are kept separate. Land location determines the state workflow.','உங்கள் phone location மற்றும் நிலத்தின் location தனித்தனியாக வைக்கப்படும். நிலத்தின் location தான் மாநில workflow-ஐ தீர்மானிக்கும்.','ನಿಮ್ಮ phone location ಮತ್ತು ಭೂಮಿ location ಪ್ರತ್ಯೇಕವಾಗಿರುತ್ತವೆ. ಭೂಮಿ location ರಾಜ್ಯ workflow ಅನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ.')}</p>
        </div>
        <div className={`state-badge ${state === 'Karnataka' ? 'state-ka' : state === 'Tamil Nadu' ? 'state-tn' : ''}`}>
          {state || text('No state selected','மாநிலம் தேர்வு செய்யப்படவில்லை','ರಾಜ್ಯ ಆಯ್ಕೆ ಆಗಿಲ್ಲ')}
        </div>
      </div>

      <div className="map-layout">
        <section className="card map-control-card">
          <h3><Search size={18}/> {text('Search land location','நில location தேடவும்','ಭೂಮಿ location ಹುಡುಕಿ')}</h3>
          <form onSubmit={searchLand} className="map-search-row">
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={text('e.g. Bengaluru, Yelahanka','உதா: Bengaluru, Yelahanka','ಉದಾ: Bengaluru, Yelahanka')} />
            <button className="btn btn-primary" disabled={searching}><Search size={15}/>{searching ? '...' : text('Search','தேடு','ಹುಡುಕು')}</button>
          </form>
          {candidates.length > 0 && <div className="candidate-list">
            {candidates.map((c, i)=><button className="candidate-item" key={`${c.latitude}-${c.longitude}-${i}`} onClick={()=>chooseLand(c)}>
              <MapPin size={15}/><span>{c.display_name}</span><small>{c.state || ''}</small>
            </button>)}
          </div>}
          <button className="btn btn-outline full-btn" onClick={useCurrentAsLand}><LocateFixed size={15}/>{text('Use current location as land location','Current location-ஐ land location ஆக பயன்படுத்து','Current location ಅನ್ನು land location ಆಗಿ ಬಳಸಿ')}</button>
          {message && <div className="inline-notice">{message}</div>}

          <div className="location-summary">
            <div><strong><LocateFixed size={15}/> {text('Current phone location','Current phone location','ಪ್ರಸ್ತುತ ಫೋನ್ ಸ್ಥಳ')}</strong><span>{current.display_name || 'Not available'}</span></div>
            <div><strong><MapPin size={15}/> {text('Land location','Land location','ಜಮೀನು ಸ್ಥಳ')}</strong><span>{land.display_name || land.query || 'Not selected'}</span></div>
            <div><strong>{text('State workflow','State workflow','ರಾಜ್ಯ workflow')}</strong><span>{state || text('Waiting for land location','நில இடத்திற்காக காத்திருக்கிறது','ಜಮೀನು ಸ್ಥಳಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ')}</span></div>
          </div>
        </section>

        <section className="card map-frame-card">
          {coords ? <>
            <MapLibreLandMap
              center={{lat: coords.lat, lon: coords.lon}}
              places={[
                ...(nearby?.bank?.results || []),
                ...(nearby?.lawyer?.results || []),
                ...(nearby?.government?.results || [])
              ]}
              onSelectPlace={() => {}}
              language={language}
            />
            <div className="map-caption"><MapPin size={14}/> {coords.source === 'land' ? 'Land location' : 'Current location'} • {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} • MapLibre + OpenFreeMap / OpenStreetMap</div>
            <a className="map-open-link" href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=17/${coords.lat}/${coords.lon}`} target="_blank" rel="noreferrer">Open this location in OpenStreetMap ↗</a>
          </> : <div className="map-empty"><Map size={44}/><h3>{ta ? 'முதலில் location தேர்வு செய்யவும்' : language === 'kn' ? 'ಮೊದಲು location ಆಯ್ಕೆಮಾಡಿ' : 'Select a location first'}</h3><p>{text('Allow phone location or search for the land above.','Phone location அனுமதிக்கவும் அல்லது மேலே land location தேடவும்.','Phone location ಅನುಮತಿಸಿ ಅಥವಾ ಮೇಲಿನ land location ಹುಡುಕಾಟ ಬಳಸಿ.')}</p></div>}
        </section>
      </div>

      <div className="map-lower-grid">
        <section className="card">
          <div className="section-title-row"><h3><Landmark size={18}/> {text('Area services','அருகிலுள்ள சேவைகள்','ಹತ್ತಿರದ ಸೇವೆಗಳು')}</h3><button className="icon-btn" onClick={()=>coords && loadNearby(coords.lat, coords.lon)}><RefreshCw size={15}/></button></div>
          {nearbyLoading && <p>Loading real map-listed places...</p>}
          {!nearbyLoading && !nearby && <p>{text('Nearby places will appear after a location is selected.','Location கிடைத்த பிறகு nearby places காட்டப்படும்.','Location ದೊರೆತ ನಂತರ nearby places ತೋರಿಸಲಾಗುತ್ತದೆ.')}</p>}
          {nearby && <div className="nearby-columns">
            {[['bank', Building2, ta ? 'வங்கிகள்' : language === 'kn' ? 'ಬ್ಯಾಂಕ್‌ಗಳು' : 'Banks'], ['lawyer', Scale, ta ? 'வழக்கறிஞர்கள்' : language === 'kn' ? 'ವಕೀಲರು' : 'Legal professionals'], ['government', Landmark, ta ? 'அரசு / அலுவலகங்கள்' : language === 'kn' ? 'ಸರ್ಕಾರಿ / ಕಚೇರಿಗಳು' : 'Government offices']].map(([key, Icon, title])=><div key={key} className="nearby-group"><h4><Icon size={15}/> {title}</h4>{(nearby[key]?.results || []).slice(0,5).map((p,i)=><div className="place-row" key={`${key}-${i}`}><div><strong>{p.name}</strong><small>{p.address || (ta ? 'முகவரி இல்லை' : language === 'kn' ? 'ವಿಳಾಸ ಲಭ್ಯವಿಲ್ಲ' : 'Address not listed')}{p.phone ? ` • ${p.phone}` : ''}</small><small>{p.source || 'Real map data'}</small><a href={p.maps_url || `https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=18/${p.latitude}/${p.longitude}`} target="_blank" rel="noreferrer">{text('Open place / directions','இடம் / வழித்தடம் திறக்க','ಸ್ಥಳ / ಮಾರ್ಗ ತೆರೆಯಿರಿ')}</a></div><span>{p.distance_km} km</span></div>)}{!(nearby[key]?.results || []).length && <small>{text('No matching real place was returned by the searched source.','தேடப்பட்ட ஆதாரத்தில் அருகிலுள்ள பொருத்தமான இடம் கிடைக்கவில்லை.','ಹುಡುಕಿದ ಮೂಲದಲ್ಲಿ ಹೊಂದಾಣಿಕೆಯ ಸ್ಥಳ ಸಿಗಲಿಲ್ಲ.')}</small>}</div>)}
          </div>}
          {lawyerDirectory?.results?.length > 0 && (
            <div className="directory-panel">
              <div className="section-title-row"><h3><Scale size={18}/> {text('Verified-context lawyer directory','வழக்கறிஞர் அடைவு','ವಕೀಲರ ಡೈರೆಕ್ಟರಿ')}</h3></div>
              {lawyerDirectory.results.map((lawyer) => (
                <div className="place-row" key={lawyer.id}>
                  <div>
                    <strong>{lawyer.name} — {lawyer.role}</strong>
                    <small>{lawyer.qualification} • {lawyer.office}</small>
                    <small>{lawyer.phone}{lawyer.email ? ` • ${lawyer.email}` : ''}</small>
                    {lawyer.website && <a href={lawyer.website} target="_blank" rel="noreferrer">{text('Open professional profile','தொழில்முறை சுயவிவரத்தை திறக்க','ವೃತ್ತಿಪರ ಪ್ರೊಫೈಲ್ ತೆರೆಯಿರಿ')}</a>}
                    <small>{lawyer.verification_status === 'USER_PROVIDED' ? text('User-provided business-card record; not an official bar-directory verification.','பயனர் வழங்கிய business-card பதிவு; அதிகாரப்பூர்வ bar-directory verification அல்ல.','ಬಳಕೆದಾರರು ನೀಡಿದ business-card ದಾಖಲೆ; ಅಧಿಕೃತ bar-directory verification ಅಲ್ಲ.') : text('Public professional profile; not a LandStack referral or endorsement.','பொது தொழில்முறை சுயவிவரம்; LandStack பரிந்துரை அல்லது அங்கீகாரம் அல்ல.','ಸಾರ್ವಜನಿಕ ವೃತ್ತಿಪರ ಪ್ರೊಫೈಲ್; LandStack ಶಿಫಾರಸು ಅಥವಾ ಅನುಮೋದನೆ ಅಲ್ಲ.')}</small>
                    {lawyer.district_relevance && <small>{lawyer.district_relevance}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <small className="source-note">
            {text('Source: ','ஆதாரம்: ','ಮೂಲ: ')}
            {nearby?.bank?.source || nearby?.lawyer?.source || nearby?.government?.source || 'Real map data'}
            {' • '}
            {text('Distance is calculated from the selected land location. Verify with the institution before relying on it.','தூரம் நில இடத்திலிருந்து கணக்கிடப்படுகிறது. நிறுவனத்துடன் உறுதி செய்யவும்.','ದೂರವನ್ನು ಜಮೀನು ಸ್ಥಳದಿಂದ ಲೆಕ್ಕಿಸಲಾಗಿದೆ. ಸಂಸ್ಥೆಯೊಂದಿಗೆ ದೃಢೀಕರಿಸಿ.')}
          </small>
        </section>

        <section className="card case-check-card">
          <div className="section-title-row"><h3><Scale size={18}/> {text('Public case / dispute check','பொது வழக்கு / தகராறு சரிபார்ப்பு','ಸಾರ್ವಜನಿಕ ಪ್ರಕರಣ / ವಿವಾದ ಪರಿಶೀಲನೆ')}</h3></div>
          <p>{ta ? 'LandStack case search result-ஐ fabricate செய்யாது. Official eCourts-ல் party name, case number, advocate அல்லது CNR மூலம் public case status-ஐ சரிபார்க்கலாம்.' : 'LandStack does not fabricate court results. Use the official eCourts search to check public case status using party name, case number, advocate name or CNR.'}</p>
          <a className="btn btn-outline" href={officialCaseUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Open official eCourts</a>
          <div className="warning-box">{ta ? '“No result” கிடைத்தாலும் எந்த வழக்கும் இல்லை என்று guarantee செய்ய முடியாது. Searched source-ன் வரம்புக்குள் மட்டுமே முடிவு.' : 'A search result cannot guarantee that no dispute exists. It only reflects the public source and search criteria used.'}</div>
        </section>
      </div>
    </div>
  );
}
