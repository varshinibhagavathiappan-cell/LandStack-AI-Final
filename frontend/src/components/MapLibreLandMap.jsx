import React, { useEffect, useRef } from 'react';
import { Map as MapLibreMap, Marker, Popup, NavigationControl, GeolocateControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function MapLibreLandMap({ center, places = [], onSelectPlace, language = 'en' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    setWorkerUrl(workerUrl);
    if (!containerRef.current || !center?.lat || !center?.lon) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lon, center.lat],
      zoom: 13,
      attributionControl: true,
    });
    map.addControl(new NavigationControl(), 'top-right');
    map.addControl(new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
    }), 'top-right');
    map.on('load', () => map.resize());
    mapRef.current = map;
    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [center?.lat, center?.lon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const labels = language === 'ta' ? { selected: 'தேர்ந்தெடுக்கப்பட்ட நில இடம்', context: 'புவியியல் சூழல் மட்டும்', nearby: 'அருகிலுள்ள இடம்', address: 'முகவரி இல்லை', real: 'உண்மை வரைபட தரவு' } : language === 'kn' ? { selected: 'ಆಯ್ಕೆ ಮಾಡಿದ ಜಮೀನು ಸ್ಥಳ', context: 'ಭೌಗೋಳಿಕ ಸಂದರ್ಭ ಮಾತ್ರ', nearby: 'ಹತ್ತಿರದ ಸ್ಥಳ', address: 'ವಿಳಾಸ ಲಭ್ಯವಿಲ್ಲ', real: 'ನೈಜ ನಕ್ಷೆ ಡೇಟಾ' } : { selected: 'Selected land location', context: 'Geographic context only', nearby: 'Nearby place', address: 'Address not listed', real: 'Real map data' };
    const landEl = document.createElement('div');
    landEl.className = 'maplibre-land-marker';
    landEl.title = labels.selected;
    const landMarker = new Marker({ element: landEl })
      .setLngLat([center.lon, center.lat])
      .setPopup(new Popup({ offset: 18 }).setHTML(`<strong>${labels.selected}</strong><br/>${labels.context}`))
      .addTo(map);
    markersRef.current.push(landMarker);

    places.filter(p => p?.latitude != null && p?.longitude != null).forEach(place => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `maplibre-place-marker ${place.category || ''}`;
      el.title = place.name || labels.nearby;
      el.innerText = place.category === 'bank' ? 'B' : place.category === 'lawyer' ? 'L' : 'G';
      const popup = new Popup({ offset: 18 }).setHTML(
        `<strong>${escapeHtml(place.name || 'Unnamed place')}</strong><br/>${escapeHtml(place.address || labels.address)}<br/><small>${escapeHtml(String(place.distance_km ?? ''))} km • ${escapeHtml(place.source || labels.real)}</small>`
      );
      const marker = new Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(popup)
        .addTo(map);
      el.addEventListener('click', () => onSelectPlace?.(place));
      markersRef.current.push(marker);
    });
  }, [center?.lat, center?.lon, places, onSelectPlace, language]);

  return <div ref={containerRef} className="maplibre-container" aria-label={language === 'ta' ? 'LandStack தொடர்பு வரைபடம்' : language === 'kn' ? 'LandStack ಸಂವಾದಾತ್ಮಕ ನಕ್ಷೆ' : 'Interactive LandStack map'} />;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
