import React, { useState, useCallback, useEffect } from 'react';
import LanguageSelector from './components/LanguageSelector';
import TextAreaInput from './components/TextAreaInput';
import IconButton from './components/IconButton';
import { SwapIcon, TranslateIcon, ClearIcon, LoadingSpinner } from './components/Icons';
import { LanguageOption } from './types';
import { LANGUAGES, DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG } from './constants';
import { translateText } from './services/translationService';
import { initializeAppData } from './dictionaryData';

const App: React.FC = () => {
  const [sourceLang, setSourceLang] = useState<string>(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState<string>(DEFAULT_TARGET_LANG);
  const [sourceText, setSourceText] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  useEffect(() => {
    initializeAppData()
      .then(() => {
        setIsDictionaryLoading(false);
      })
      .catch((err) => {
        setDictionaryError(err.message || 'Dictionary could not be loaded. Lookup is disabled.');
        setIsDictionaryLoading(false);
      });
  }, []);

  const getLangName = useCallback((code: string): string => {
    return LANGUAGES.find(lang => lang.code === code)?.name || code;
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      setTranslatedText('');
      setError(null);
      return;
    }
    if (sourceLang === targetLang) {
      setTranslatedText(sourceText);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranslatedText('');

    try {
      const result = await translateText(sourceText, getLangName(sourceLang), getLangName(targetLang));
      setTranslatedText(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during translation.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, sourceLang, targetLang, getLangName]);

  const handleSwapLanguages = useCallback(() => {
    const currentSourceLang = sourceLang;
    const currentSourceText = sourceText;
    setSourceLang(targetLang);
    setTargetLang(currentSourceLang);
    setSourceText(translatedText);
    setTranslatedText(currentSourceText);
    setError(null);
  }, [sourceLang, targetLang, sourceText, translatedText]);

  const handleClearAll = useCallback(() => {
    setSourceText('');
    setTranslatedText('');
    setError(null);
  }, []);

  const [sourcePlaceholder, setSourcePlaceholder] = useState<string>(`Enter text in ${getLangName(DEFAULT_SOURCE_LANG)}`);
  
  useEffect(() => {
    setSourcePlaceholder(`Enter text in ${getLangName(sourceLang)}...`);
  }, [sourceLang, getLangName]);

  const isAppBusy = isLoading || isDictionaryLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-slate-200 p-4 sm:p-8 flex flex-col items-center font-['Inter'] relative">
      {isDictionaryLoading && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center text-sky-300">
            <LoadingSpinner className="w-6 h-6 mr-3" />
            <span className="text-lg">Loading dictionary...</span>
          </div>
        </div>
      )}
      <main className="container mx-auto max-w-3xl w-full bg-slate-800/70 backdrop-blur-lg shadow-2xl rounded-xl p-6 sm:p-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-sky-400 tracking-tight">
            Crimean Tatar (RO) Translator
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Translate between Crimean Tatar (Romania), English, and Romanian.
          </p>
        </header>

        <div className="flex flex-col space-y-6">
          <div className="p-5 bg-slate-700/40 rounded-lg shadow-lg ring-1 ring-slate-700">
            <LanguageSelector
              id="source-language"
              label="Translate From:"
              languages={LANGUAGES}
              selectedLanguage={sourceLang}
              onChange={(lang) => setSourceLang(lang)}
              className="mb-3"
              disabled={isAppBusy}
            />
            <TextAreaInput
              id="source-text"
              value={sourceText}
              onChange={(text) => setSourceText(text)}
              placeholder={sourcePlaceholder}
              rows={5}
              readOnly={isAppBusy}
            />
          </div>

          <div className="flex items-center justify-center space-x-3 sm:space-x-4 my-1 sm:my-2">
            <IconButton
              onClick={handleSwapLanguages}
              icon={<SwapIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              ariaLabel="Swap languages"
              title="Swap Languages"
              className="bg-sky-600 hover:bg-sky-700 active:bg-sky-800"
              disabled={isAppBusy}
            />
            <button
              onClick={handleTranslate}
              disabled={isAppBusy || !sourceText.trim()}
              className="flex-grow sm:flex-grow-0 flex items-center justify-center px-6 py-3 sm:px-8 sm:py-3.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500"
            >
              {isLoading ? (
                <LoadingSpinner className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              ) : (
                <TranslateIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              )}
              <span className="text-sm sm:text-base">{isLoading ? 'Translating...' : 'Translate'}</span>
            </button>
            <IconButton
              onClick={handleClearAll}
              icon={<ClearIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
              ariaLabel="Clear all text"
              title="Clear Text"
              className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
              disabled={isAppBusy && !sourceText && !translatedText}
            />
          </div>

          <div className="p-5 bg-slate-700/40 rounded-lg shadow-lg ring-1 ring-slate-700">
            <LanguageSelector
              id="target-language"
              label="Translate To:"
              languages={LANGUAGES}
              selectedLanguage={targetLang}
              onChange={(lang) => setTargetLang(lang)}
              className="mb-3"
              disabled={isAppBusy}
            />
            <TextAreaInput
              id="translated-text"
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              rows={5}
            />
          </div>

          {dictionaryError && (
             <div className="mt-4 p-3.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-md text-sm text-center shadow">
              <strong>Warning:</strong> {dictionaryError}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-md text-sm text-center shadow">
              <strong>Error:</strong> {error}
            </div>
          )}
          {!process.env.API_KEY && (
             <div className="mt-4 p-3.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-md text-sm text-center shadow">
              <strong>Warning:</strong> API_KEY is not configured. Translations will not work.
            </div>
          )}
        </div>
      </main>
      <footer className="text-center text-slate-500 mt-10 text-xs sm:text-sm">
        Tatar Tílí Tílsîzgasî Şurasî Powered by Google Gemini API. UI by AI.
      </footer>
    </div>
  );
};

export default App;
