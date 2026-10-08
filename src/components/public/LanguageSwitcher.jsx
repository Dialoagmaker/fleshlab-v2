import { useState } from 'react';
import { useI18n } from '@/i18n/i18n.jsx';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'tl', label: 'Tagalog', native: 'Tagalog' },
  { code: 'zh-CN', label: 'Chinese (Simplified)', native: '简体中文' },
  { code: 'th', label: 'ไทย', native: 'ไทย' },
  { code: 'vi', label: 'Tiếng Việt', native: 'Tiếng Việt' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = languages.find(l => l.code === locale) || languages[0];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 bg-transparent border-white/20 hover:bg-white/10 hover:border-rose-600/60 text-white"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLang.native}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between group ${
                  locale === lang.code ? 'bg-rose-600/20' : ''
                }`}
              >
                <div>
                  <div className={`text-sm font-semibold ${
                    locale === lang.code ? 'text-rose-500' : 'text-white'
                  }`}>
                    {lang.native}
                  </div>
                  {lang.label !== lang.native && (
                    <div className="text-xs text-white/50">{lang.label}</div>
                  )}
                </div>
                {locale === lang.code && (
                  <Check className="w-4 h-4 text-rose-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}