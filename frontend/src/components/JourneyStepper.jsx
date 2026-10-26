import React from 'react';
const STEPS = [
  {id:'SPEAK',en:'Speak',ta:'பேசு',kn:'ಮಾತನಾಡಿ'},{id:'UNDERSTAND',en:'Understand',ta:'புரிந்து கொள்',kn:'ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ'},
  {id:'IDENTIFY',en:'Identify',ta:'அறி',kn:'ಗುರುತಿಸಿ'},{id:'PLAN',en:'Plan',ta:'திட்டமிடு',kn:'ಯೋಜಿಸಿ'},
  {id:'COLLECT',en:'Collect',ta:'சேகரி',kn:'ಸಂಗ್ರಹಿಸಿ'},{id:'EXPLAIN',en:'Explain',ta:'விளக்கு',kn:'ವಿವರಿಸಿ'},
  {id:'ANALYZE',en:'Analyze',ta:'ஆய்வு செய்',kn:'ವಿಶ್ಲೇಷಿಸಿ'},{id:'VERIFY',en:'Verify',ta:'சரிபார்',kn:'ಪರಿಶೀಲಿಸಿ'},
  {id:'ACT',en:'Act',ta:'செயல்',kn:'ಕ್ರಮ ಕೈಗೊಳ್ಳಿ'},{id:'TRACK',en:'Track',ta:'கண்காணி',kn:'ಟ್ರ್ಯಾಕ್ ಮಾಡಿ'},
  {id:'COMPLETE',en:'Complete',ta:'நிறைவு',kn:'ಪೂರ್ಣಗೊಳಿಸಿ'}
];
export default function JourneyStepper({ currentStep='VERIFY', language='en' }) {
  const currentIndex=STEPS.findIndex(s=>s.id===currentStep);
  return <div className="journey-stepper-container">
    <div className="journey-title"><span className="journey-label">{language==='ta'?'நில கேஸ் செயல்முறை':language==='kn'?'ಭೂಮಿ ಕೇಸ್ ಪ್ರಕ್ರಿಯೆ':'Land case journey'}</span><span className="journey-active-badge">{language==='ta'?'தற்போது':language==='kn'?'ಪ್ರಸ್ತುತ':'Current'}: {currentStep}</span></div>
    <div className="stepper-scroll"><div className="stepper-track">{STEPS.map((step,idx)=>{const done=idx<currentIndex, cur=idx===currentIndex; return <React.Fragment key={step.id}><div className={`step-node ${done?'step-completed':cur?'step-current':'step-pending'}`}><div className="step-circle">{idx+1}</div><div className="step-info"><span className="step-text">{language==='ta'?step.ta:language==='kn'?step.kn:step.en}</span></div></div>{idx<STEPS.length-1&&<div className={`step-connector ${idx<currentIndex?'connector-active':''}`}/>}</React.Fragment>})}</div></div>
  </div>;
}
