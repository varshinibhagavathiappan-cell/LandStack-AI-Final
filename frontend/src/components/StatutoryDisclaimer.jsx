import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function StatutoryDisclaimer({ language = 'en' }) {
  return (
    <div className="disclaimer-banner">
      <ShieldAlert className="disclaimer-icon" size={18} />
      <span>
        <strong>{language === 'ta' ? 'சட்ட அறிவிப்பு:' : language === 'kn' ? 'ಕಾನೂನು ಸೂಚನೆ:' : 'Legal notice:'}</strong> {language === 'ta' ? 'LandStack AI ஒரு AI உதவி குடிமகன் முடிவு உதவியாளர். இது சட்ட சான்றிதழ், உரிமை உத்தரவாதம் வழங்காது; அதிகாரப்பூர்வ அரசு பதிவுகளுக்கு மாற்றாகாது.' : language === 'kn' ? 'LandStack AI ಒಂದು AI ಸಹಾಯಕ ನಾಗರಿಕ ನಿರ್ಧಾರ ಸಹಾಯಕ. ಇದು ಕಾನೂನು ಪ್ರಮಾಣಪತ್ರ ಅಥವಾ ಹಕ್ಕು ಖಾತರಿ ನೀಡುವುದಿಲ್ಲ ಮತ್ತು ಅಧಿಕೃತ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳಿಗೆ ಪರ್ಯಾಯವಲ್ಲ.' : 'LandStack AI is an AI-assisted citizen decision copilot. It does not provide legal certification or title guarantees and is not a substitute for official government records.'}
      </span>
    </div>
  );
}
