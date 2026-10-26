import React, { useEffect, useRef, useState } from 'react';

function loadGoogleMaps(key) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  const existing = document.getElementById('landstack-google-maps');
  if (existing) return new Promise((resolve, reject) => {
    const timer = setInterval(() => { if (window.google?.maps) { clearInterval(timer); resolve(window.google.maps); } }, 100);
    setTimeout(() => { clearInterval(timer); reject(new Error('Google Maps timed out')); }, 10000);
  });
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'landstack-google-maps';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error('Google Maps unavailable'));
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  });
}

export default function GoogleLandMap({ latitude, longitude, label = 'Selected land location' }) {
  const ref = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key || latitude == null || longitude == null) return;
    loadGoogleMaps(key).then((maps) => {
      const map = new maps.Map(ref.current, { center: { lat: Number(latitude), lng: Number(longitude) }, zoom: 16, mapTypeControl: true, streetViewControl: false, fullscreenControl: true });
      new maps.Marker({ position: { lat: Number(latitude), lng: Number(longitude) }, map, title: label });
    }).catch((e) => setError(e.message));
  }, [latitude, longitude, label]);
  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) return null;
  if (error) return <div className="map-empty"><strong>Google Maps unavailable.</strong><p>{error}</p><small>Check the browser Maps key and API restrictions.</small></div>;
  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 360, borderRadius: 16 }} aria-label="Land location map" />;
}
