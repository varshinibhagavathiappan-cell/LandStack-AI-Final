import React, { useState } from 'react';
import { HeartHandshake, ShieldCheck, FileText, Scale, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function WomensLandSupportView({ caseData, language='en', onNavigate }) {
  const [message, setMessage] = useState('');
  const isTa=language==='ta', isKn=language==='kn';
  const txt=(en,ta,kn)=>isTa?ta:isKn?kn:en;
  const situations=[
    ['spouse_deceased',txt('Husband has passed away','கணவர் இறந்துவிட்டார்','ಗಂಡ ನಿಧನರಾಗಿದ್ದಾರೆ')],
    ['parent_deceased',txt('Parent has passed away','பெற்றோர் இறந்துவிட்டார்','ಪೋಷಕರು ನಿಧನರಾಗಿದ್ದಾರೆ')],
    ['heir',txt('I may be a legal heir','நான் சட்ட வாரிசாக இருக்கலாம்','ನಾನು ಕಾನೂನು ವಾರಸುದಾರರಾಗಿರಬಹುದು')],
    ['document_signing',txt('I am being asked to sign a property document','சொத்து ஆவணத்தில் கையெழுத்திடச் சொல்கிறார்கள்','ಆಸ್ತಿ ದಾಖಲೆಗಳಿಗೆ ಸಹಿ ಮಾಡಲು ಕೇಳುತ್ತಿದ್ದಾರೆ')],
    ['dispute',txt('I have a family/property dispute','குடும்ப / சொத்து தகராறு உள்ளது','ಕುಟುಂಬ / ಆಸ್ತಿ ವಿವಾದವಿದೆ')]
  ];
  async function start(situation) {
    const prompts={
      spouse_deceased:'I am using Women’s Land Support. My husband has passed away and land is still recorded in his name. Help me organize the documents, identify missing evidence, and explain the official/legal next steps without assuming ownership.',
      parent_deceased:'I am using Women’s Land Support. A parent has passed away and I may have a land inheritance issue. Help me organize the evidence and next steps.',
      heir:'I am using Women’s Land Support. I may be a legal heir to land. Help me identify what evidence and documents I should verify.',
      document_signing:'I am using Women’s Land Support. I am being asked to sign a property document. Explain the uploaded document and what questions I should ask a qualified lawyer before signing.',
      dispute:'I am using Women’s Land Support. I have a family/property dispute. Help me organize the documents, evidence gaps and questions for a lawyer or revenue office.'
    };
    try { await api.sendChatMessage(prompts[situation], language); setMessage(txt('Women’s support context added to the existing AI case. Continue in Land Assistant.','பெண்கள் ஆதரவு சூழல் தற்போதைய AI case-க்கு சேர்க்கப்பட்டது. Land Assistant-ல் தொடரவும்.','ಮಹಿಳಾ ಬೆಂಬಲ ಸಂದರ್ಭವನ್ನು ಈಗಿರುವ AI ಕೇಸ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ. Land Assistant ನಲ್ಲಿ ಮುಂದುವರಿಸಿ.')); onNavigate?.('assistant'); }
    catch { setMessage(txt('Start the backend, then continue in Land Assistant.','Backend-ஐ தொடங்கி Land Assistant-ல் தொடரவும்.','Backend ಪ್ರಾರಂಭಿಸಿ Land Assistant ನಲ್ಲಿ ಮುಂದುವರಿಸಿ.')); }
  }
  const docs=caseData?.uploaded_documents||[];
  return <div className="page-container">
    <div className="page-hero"><div><div className="eyebrow"><HeartHandshake size={15}/> WOMEN'S LAND SUPPORT</div><h1>{txt('Dedicated support for women facing land and property issues','நிலம் மற்றும் சொத்து பிரச்சனைகளை எதிர்கொள்ளும் பெண்களுக்கான தனிப்பட்ட உதவி','ಭೂಮಿ ಮತ್ತು ಆಸ್ತಿ ಸಮಸ್ಯೆಗಳನ್ನು ಎದುರಿಸುವ ಮಹಿಳೆಯರಿಗಾಗಿ ವಿಶೇಷ ಸಹಾಯ')}</h1><p>{txt('This is an extension of the existing LandStack AI, not a separate chatbot. It organizes evidence and next actions without making a legal ownership decision.','இது தனி chatbot அல்ல; தற்போதைய LandStack AI-யின் extension. சட்ட உரிமை முடிவை தானாக எடுக்காது.','ಇದು ಪ್ರತ್ಯೇಕ chatbot ಅಲ್ಲ; ಈಗಿರುವ LandStack AI ಯ ವಿಸ್ತರಣೆ. ಕಾನೂನು ಮಾಲೀಕತ್ವದ ತೀರ್ಮಾನವನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮಾಡುವುದಿಲ್ಲ.')}</p></div></div>
    <div className="card" style={{marginBottom:16}}><div className="section-title-row"><h3><ShieldCheck size={18}/>{txt('Private, evidence-first support','தனியுரிமை, ஆதாரம் முதலில்','ಖಾಸಗಿ, ಸಾಕ್ಷ್ಯ ಆಧಾರಿತ ಸಹಾಯ')}</h3></div><p>{txt('Upload only documents you are comfortable sharing. LandStack can identify extracted fields, gaps and inconsistencies; missing extraction does not prove the original document lacks a field.','நீங்கள் பகிர விரும்பும் ஆவணங்களை மட்டும் பதிவேற்றவும். LandStack கிடைத்த தகவல், இடைவெளி, முரண்பாடுகளை காட்டும்.','ನೀವು ಹಂಚಿಕೊಳ್ಳಲು ಸಿದ್ಧವಾಗಿರುವ ದಾಖಲೆಗಳನ್ನು ಮಾತ್ರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. LandStack ದೊರೆತ ಮಾಹಿತಿಯನ್ನು, ಅಂತರಗಳನ್ನು ಮತ್ತು ವ್ಯತ್ಯಾಸಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.')}</p></div>
    <div className="grid-2-col">{situations.map(([id,label])=><button key={id} className="card" style={{textAlign:'left',cursor:'pointer'}} onClick={()=>start(id)}><strong>{label}</strong><p>{txt('Use the existing AI case context for guided next steps.','தற்போதைய AI case context-ஐ பயன்படுத்தி அடுத்த படிகளை பெறுங்கள்.','ಈಗಿರುವ AI ಕೇಸ್ ಸಂದರ್ಭವನ್ನು ಬಳಸಿ ಮುಂದಿನ ಹಂತಗಳನ್ನು ಪಡೆಯಿರಿ.')}</p><ArrowRight size={16}/></button>)}</div>
    <div className="card" style={{marginTop:16}}><div className="section-title-row"><h3><FileText size={18}/>{txt('Current case evidence','தற்போதைய கேஸ் ஆதாரம்','ಪ್ರಸ್ತುತ ಕೇಸ್ ಸಾಕ್ಷ್ಯ')}</h3></div><p>{docs.length} {txt('document(s) uploaded','ஆவணம்(கள்) பதிவேற்றப்பட்டுள்ளன','ದಾಖಲೆ(ಗಳು) ಅಪ್‌ಲೋಡ್ ಆಗಿವೆ')}.</p><button className="btn btn-primary" onClick={()=>onNavigate?.('documents')}><FileText size={15}/>{txt('Review documents','ஆவணங்களை பார்க்க','ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ')}</button> <button className="btn btn-outline" onClick={()=>onNavigate?.('evidence')}><Scale size={15}/>{txt('Open evidence graph','ஆதார கிராப் திறக்க','ಸಾಕ್ಷ್ಯ ಗ್ರಾಫ್ ತೆರೆಯಿರಿ')}</button></div>
    {message && <div className="inline-notice">{message}</div>}
  </div>;
}
