"use client";
import { useTranslation } from '@/lib/useTranslation';

export default function LanguageSwitcher() {
  const { locale, changeLocale } = useTranslation();
  
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => changeLocale('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
          locale === 'en'
            ? 'bg-pink-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        🇺🇸 EN
      </button>
      <button
        onClick={() => changeLocale('hi')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
          locale === 'hi'
            ? 'bg-pink-500 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        🇮🇳 हिं
      </button>
    </div>
  );
}
