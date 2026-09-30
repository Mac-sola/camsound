import React from 'react';
import { useLanguage, type Language } from '../context/LanguageContext';

interface LanguageToggleProps {
  variant?: 'pill' | 'compact';
  style?: React.CSSProperties;
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ variant = 'pill', style, className }) => {
  const { language, setLanguage } = useLanguage();
  const isCompact = variant === 'compact';

  const handleSelect = (lang: Language) => {
    if (language !== lang) {
      setLanguage(lang);
    }
  };

  const btnPadding = isCompact ? '2px 8px' : '4px 10px';
  const btnFontSize = isCompact ? '0.7rem' : '0.75rem';

  return (
    <div
      className={`language-toggle ${className || ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 20,
        padding: isCompact ? '2px' : '3px 4px',
        userSelect: 'none',
        ...style,
      }}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => handleSelect('en')}
        style={{
          padding: btnPadding,
          borderRadius: 16,
          border: 'none',
          fontSize: btnFontSize,
          fontWeight: language === 'en' ? 700 : 500,
          background: language === 'en' ? 'var(--accent-color)' : 'transparent',
          color: language === 'en' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: language === 'en' ? '0 2px 8px var(--glow-subtle)' : 'none',
        }}
        aria-pressed={language === 'en'}
        title="Switch to English"
      >
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('fr')}
        style={{
          padding: btnPadding,
          borderRadius: 16,
          border: 'none',
          fontSize: btnFontSize,
          fontWeight: language === 'fr' ? 700 : 500,
          background: language === 'fr' ? 'var(--accent-color)' : 'transparent',
          color: language === 'fr' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: language === 'fr' ? '0 2px 8px var(--glow-subtle)' : 'none',
        }}
        aria-pressed={language === 'fr'}
        title="Passer au Français"
      >
        <span>FR</span>
      </button>
    </div>
  );
};

export default LanguageToggle;
