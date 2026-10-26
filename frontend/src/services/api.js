const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
export const LANDSTACK_API_BASE = API_BASE;


export const api = {
  async health() {
    const base = API_BASE.replace(/\/api$/, '');
    const res = await fetch(`${base}/`);
    if (!res.ok) throw new Error(`Backend health failed: ${res.status}`);
    return res.json();
  },
  // Case & Living Land Case
  async getCase() {
    const res = await fetch(`${API_BASE}/case`, { cache: 'no-store' });
    return res.json();
  },
  async resetCase() {
    const res = await fetch(`${API_BASE}/case/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
    return res.json();
  },
  async createNewCase(language = 'en') {
    const res = await fetch(`${API_BASE}/case/new`, {
      cache: 'no-store',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language })
    });
    if (!res.ok) throw new Error(`New case failed: ${res.status}`);
    return res.json();
  },
  async setCaseLanguage(language = 'en') {
    const res = await fetch(`${API_BASE}/case/language`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language })
    });
    if (!res.ok) throw new Error(`Language update failed: ${res.status}`);
    return res.json();
  },
  async answerAdaptiveQuestion(questionId, answer, language = 'en') {
    const res = await fetch(`${API_BASE}/chat/answer-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, answer, language })
    });
    if (!res.ok) throw new Error(`Question answer failed: ${res.status}`);
    return res.json();
  },
  async getCasePlan() {
    const res = await fetch(`${API_BASE}/case/plan`);
    return res.json();
  },
  async updateCaseStep(step_number, status) {
    const res = await fetch(`${API_BASE}/case/plan/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_number, status })
    });
    return res.json();
  },

  // Conversational Assistant / Chat
  async sendChatMessage(message, language = 'en') {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language })
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    return res.json();
  },

  // Documents
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
  },
  async getChecklist() {
    const res = await fetch(`${API_BASE}/documents/checklist`);
    return res.json();
  },
  async uploadDocument(file, filenameOverride, language = 'ta') {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (filenameOverride) formData.append('filename_override', filenameOverride);
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  async explainDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}/explain`);
    return res.json();
  },

  // Evidence & Innovation Layer
  async getEvidenceGraph() {
    const res = await fetch(`${API_BASE}/evidence/graph`);
    return res.json();
  },
  async getMissingLinks() {
    const res = await fetch(`${API_BASE}/evidence/missing-links`);
    return res.json();
  },
  async getVerificationGaps() {
    const res = await fetch(`${API_BASE}/evidence/verification-gaps`);
    return res.json();
  },
  async getDependencies() {
    const res = await fetch(`${API_BASE}/evidence/dependencies`);
    return res.json();
  },
  async getProvenance() {
    const res = await fetch(`${API_BASE}/evidence/provenance`);
    return res.json();
  },
  async getTimeline() {
    const res = await fetch(`${API_BASE}/evidence/timeline`);
    return res.json();
  },
  async simulateEvidenceImpact(documentName) {
    const res = await fetch(`${API_BASE}/evidence/simulate-impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_name: documentName })
    });
    return res.json();
  },
  async getSellerStory() {
    const res = await fetch(`${API_BASE}/evidence/seller-story`);
    return res.json();
  },

  // Recommendations & Next-Best Action
  async getNextBestAction() {
    const res = await fetch(`${API_BASE}/recommendation`);
    return res.json();
  },
  async resolveInconsistencyRecheck() {
    const res = await fetch(`${API_BASE}/recommendation/resolve-recheck`, { method: 'POST' });
    return res.json();
  },
  async getReadiness() {
    const res = await fetch(`${API_BASE}/recommendation/readiness`);
    return res.json();
  },

  // Property Passport / Land DNA
  async getPropertyPassport() {
    const res = await fetch(`${API_BASE}/property-passport`);
    return res.json();
  },
  getCaseFileUrl() {
    return `${API_BASE}/case-file`;
  },

  // Family Room & LandGuard
  async getFamilyRoom() {
    const res = await fetch(`${API_BASE}/family-room`);
    return res.json();
  },
  async addFamilyMember(name, relationship) {
    const res = await fetch(`${API_BASE}/family-room/member`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, relationship })
    });
    if (!res.ok) throw new Error(`Family member failed: ${res.status}`);
    return res.json();
  },
  async addFamilyComment(author, text) {
    const res = await fetch(`${API_BASE}/family-room/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });
    return res.json();
  },
  async getLandGuardAlerts() {
    const res = await fetch(`${API_BASE}/landguard`);
    return res.json();
  },
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`);
    return res.json();
  },

  // Service Registry, Scam Shield & GIS
  async getStateContext(state) {
    const res = await fetch(`${API_BASE}/state-context?state=${encodeURIComponent(state || '')}`);
    return res.json();
  },
  async getPublicCaseCheck() {
    const res = await fetch(`${API_BASE}/public-case-check`);
    return res.json();
  },
  async getServiceRegistry(state = 'Tamil Nadu') {
    const res = await fetch(`${API_BASE}/service-registry?state=${encodeURIComponent(state)}`);
    return res.json();
  },
  async getLawyerDirectory(state = '', district = '') {
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    if (district) params.set('district', district);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/lawyer-directory${suffix}`);
    return res.json();
  },
  async verifyUrlScamShield(url) {
    const res = await fetch(`${API_BASE}/scam-shield/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },
  async getGisOffices({state='', district='', taluk='', village='', latitude, longitude} = {}) {
    const params = new URLSearchParams({state, district, taluk, village});
    if (latitude != null) params.set('latitude', latitude);
    if (longitude != null) params.set('longitude', longitude);
    const res = await fetch(`${API_BASE}/gis/offices?${params.toString()}`);
    return res.json();
  },
  async setLandLocation({query, latitude, longitude} = {}) {
    const res = await fetch(`${API_BASE}/case/land-location`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({query,latitude,longitude})});
    return res.json();
  },
  async setCurrentLocation(latitude, longitude, accuracy = null) {
    const res = await fetch(`${API_BASE}/case/location`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({latitude, longitude, accuracy, source:'browser_geolocation'})
    });
    return res.json();
  },
  async reverseLocation(latitude, longitude) {
    const res = await fetch(`${API_BASE}/location/reverse`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({latitude,longitude})
    });
    return res.json();
  },
  async geocodeLocation(query, state='') {
    const res = await fetch(`${API_BASE}/location/geocode`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({query,state})
    });
    return res.json();
  },
  async getNearbyLandAreas(latitude, longitude) {
    const res = await fetch(`${API_BASE}/nearby-land-areas`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({latitude,longitude})
    });
    if (!res.ok) throw new Error(`Nearby land lookup failed: ${res.status}`);
    return res.json();
  },
  async getPublicIncidentScan(latitude, longitude, address='') {
    const res = await fetch(`${API_BASE}/public-incident-scan`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({latitude,longitude,address})
    });
    if (!res.ok) throw new Error(`Public incident scan failed: ${res.status}`);
    return res.json();
  },
  async getNearbySupport(latitude, longitude) {
    const res = await fetch(`${API_BASE}/nearby`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({latitude,longitude})
    });
    return res.json();
  },

  // Tools & Generators
  async generateEvidenceRequest(missingDocName, recipientType, citizenName, surveyNo, district) {
    const res = await fetch(`${API_BASE}/tools/evidence-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missing_doc_name: missingDocName,
        recipient_type: recipientType,
        citizen_name: citizenName,
        survey_no: surveyNo,
        district: district
      })
    });
    return res.json();
  },
  async compareDocuments() {
    const res = await fetch(`${API_BASE}/evidence/document-comparison`);
    if (!res.ok) throw new Error(`Document comparison failed: ${res.status}`);
    return res.json();
  },
  async getSellerQuestions(surveyNo = '', district = '') {
    const res = await fetch(`${API_BASE}/tools/seller-questions?survey_no=${surveyNo}&district=${district}`);
    return res.json();
  },
  async searchKnowledge(query, state = 'Tamil Nadu') {
    const res = await fetch(`${API_BASE}/tools/search-knowledge?q=${encodeURIComponent(query)}&state=${encodeURIComponent(state)}`);
    return res.json();
  },

  // Land Intelligence
  async getIntelligenceSources() {
    const res = await fetch(`${API_BASE}/intelligence/sources`);
    return res.json();
  },
  async investigateLand() {
    const res = await fetch(`${API_BASE}/intelligence/investigate`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({})});
    if (!res.ok) throw new Error(`Land investigation failed: ${res.status}`);
    return res.json();
  },
  async getAIStatus() {
    const res = await fetch(`${API_BASE}/intelligence/ai-status`);
    return res.json();
  },

  // Demo Controls
  async loadDemoInconsistency() {
    const res = await fetch(`${API_BASE}/demo/load-inconsistency`, { method: 'POST' });
    return res.json();
  },
  async resolveDemoRecheck() {
    const res = await fetch(`${API_BASE}/demo/resolve-recheck`, { method: 'POST' });
    return res.json();
  },
  async resetDemo() {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return res.json();
  }
};
