import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { LANGUAGE_CONFIG } from '../constants';

interface LanguageSelectorProps {
  selected: string;
  onChange: (lang: string) => void;
  label?: string;
  includeAuto?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onChange, label, includeAuto = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
        setSearchQuery('');
    }
  }, [isOpen]);

  const filteredLanguages = LANGUAGE_CONFIG.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (lang: string) => {
    onChange(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <span className="text-xs text-slate-500 mb-1 block uppercase tracking-wider">{label}</span>}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:min-w-[200px] bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 hover:bg-slate-800 transition-colors group"
      >
        <span className="font-medium truncate">{selected}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full md:w-[300px] bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 border-b border-slate-700">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search languages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
            {includeAuto && "Auto Detect".toLowerCase().includes(searchQuery.toLowerCase()) && (
               <button
                  onClick={() => handleSelect('Auto Detect')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm flex items-center justify-between ${
                    selected === 'Auto Detect' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>Auto Detect</span>
                  {selected === 'Auto Detect' && <Check className="w-3 h-3" />}
                </button>
            )}

            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.name)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm flex items-center justify-between ${
                  selected === lang.name ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{lang.name}</span>
                {selected === lang.name && <Check className="w-3 h-3" />}
              </button>
            ))}

            {filteredLanguages.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    No languages found
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;