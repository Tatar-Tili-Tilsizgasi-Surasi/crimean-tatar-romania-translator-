
import React from 'react';
import { LanguageOption } from '../types';

interface LanguageSelectorProps {
  id: string;
  label: string;
  languages: LanguageOption[];
  selectedLanguage: string;
  onChange: (langCode: string) => void;
  className?: string;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  id,
  label,
  languages,
  selectedLanguage,
  onChange,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor={id} className="mb-1.5 text-sm font-medium text-sky-300">
        {label}
      </label>
      <select
        id={id}
        value={selectedLanguage}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white placeholder-slate-400 transition duration-150 ease-in-out"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-800 text-white">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
