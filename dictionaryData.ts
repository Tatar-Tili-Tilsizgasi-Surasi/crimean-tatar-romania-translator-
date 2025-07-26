// dictionaryData.ts
import { CRIMEAN_TATAR_RO_EXAMPLES } from './services/promptData';

export interface DictionaryLookupEntry {
  term: string;
  details: string;
}

export let PARSED_DICTIONARY_ENTRIES: DictionaryLookupEntry[] = [];
export let ENGLISH_TO_CT_LOOKUP: Map<string, string> = new Map();
export let ROMANIAN_TO_CT_LOOKUP: Map<string, string> = new Map();

const DICTIONARY_URLS = [
  'https://raw.githubusercontent.com/Tatar-Tili-Tilsizgasi-Surasi/crimean-tatar-romania-words/main/dictionary1.txt',
  'https://raw.githubusercontent.com/Tatar-Tili-Tilsizgasi-Surasi/crimean-tatar-romania-words/main/dictionary2.txt'
];

let dataInitializationPromise: Promise<void> | null = null;

function parseDictionary(text: string): DictionaryLookupEntry[] {
  const lines = text.split('\n');
  return lines.map(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      return null;
    }
    const firstSpaceIndex = trimmedLine.indexOf(' ');

    if (firstSpaceIndex === -1) {
      return { term: trimmedLine, details: '' };
    }
    return {
      term: trimmedLine.substring(0, firstSpaceIndex),
      details: trimmedLine.substring(firstSpaceIndex + 1).trim(),
    };
  }).filter((entry): entry is DictionaryLookupEntry => entry !== null && !!entry.term);
}

function parseMultilingualExamples(text: string): { enMap: Map<string, string>, roMap: Map<string, string> } {
  const enMap = new Map<string, string>();
  const roMap = new Map<string, string>();
  const lines = text.split('\n');

  lines.forEach(line => {
    // Type 1: Multi-language definitions on one line
    // e.g., - Romanian: ...; English: ...; Crimean Tatar (RO): ...
    const romanianMatch = /Romanian:\s*([^;]+)/.exec(line);
    const englishMatch = /English:\s*([^;]+)/.exec(line);
    const crimeanTatarMatch = /Crimean Tatar \(RO\):\s*([^;]+)/.exec(line);

    if (crimeanTatarMatch && crimeanTatarMatch[1]) {
        const crimeanTerm = crimeanTatarMatch[1].trim();
        if (!crimeanTerm) return;

        if (englishMatch && englishMatch[1]) {
            const englishTerms = englishMatch[1].trim().split(/[,/]/).map(t => t.trim().toLowerCase()).filter(Boolean);
            englishTerms.forEach(term => enMap.set(term, crimeanTerm));
        }
        if (romanianMatch && romanianMatch[1]) {
            const romanianTerms = romanianMatch[1].trim().split(/[,/]/).map(t => t.trim().toLowerCase()).filter(Boolean);
            romanianTerms.forEach(term => roMap.set(term, crimeanTerm));
        }
    } else {
       // Type 2: Simple English-only title-like definitions
       // e.g., - English: The Western Front - Kúnbatar ğephesí
       const titleMatch = line.match(/^- English:\s*([^-]+)\s*-\s*(.*)/);
       if(titleMatch && titleMatch[1] && titleMatch[2]) {
           const englishTerm = titleMatch[1].trim().toLowerCase();
           const crimeanTerm = titleMatch[2].split(';')[0].trim();
            if (englishTerm && crimeanTerm) {
               enMap.set(englishTerm, crimeanTerm);
           }
       }
    }
  });

  return { enMap, roMap };
}

export const initializeAppData = (): Promise<void> => {
  if (!dataInitializationPromise) {
    const dictionaryFetchPromises = DICTIONARY_URLS.map(url =>
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch dictionary from ${url}: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
    );

    const dictionaryPromise = Promise.all(dictionaryFetchPromises)
      .then(texts => {
        const combinedText = texts.join('\n');
        PARSED_DICTIONARY_ENTRIES = parseDictionary(combinedText);
      });


    const examplesPromise = new Promise<void>((resolve) => {
        const { enMap, roMap } = parseMultilingualExamples(CRIMEAN_TATAR_RO_EXAMPLES);
        ENGLISH_TO_CT_LOOKUP = enMap;
        ROMANIAN_TO_CT_LOOKUP = roMap;
        resolve();
    });

    dataInitializationPromise = Promise.all([dictionaryPromise, examplesPromise]).then(() => {
        // This promise resolves to void, its purpose is to populate the data arrays.
        return;
    }).catch(error => {
        console.error("Error initializing app data:", error);
        dataInitializationPromise = null; 
        throw error; // Re-throw the error to be caught by the caller in App.tsx
    });
  }
  return dataInitializationPromise;
};