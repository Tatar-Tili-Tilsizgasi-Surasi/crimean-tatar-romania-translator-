// dictionaryData.ts

export interface DictionaryLookupEntry {
  term: string;
  details: string;
}

export let PARSED_DICTIONARY_ENTRIES: DictionaryLookupEntry[] = [];

const DICTIONARY_URL = 'https://raw.githubusercontent.com/Tatar-Tili-Tilsizgasi-Surasi/crimean-tatar-romania-words/refs/heads/main/dictionary.txt';

let dictionaryPromise: Promise<DictionaryLookupEntry[]> | null = null;

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

export const getDictionary = (): Promise<DictionaryLookupEntry[]> => {
  if (!dictionaryPromise) {
    dictionaryPromise = fetch(DICTIONARY_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch dictionary: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(text => {
        PARSED_DICTIONARY_ENTRIES = parseDictionary(text);
        return PARSED_DICTIONARY_ENTRIES;
      })
      .catch(error => {
        console.error("Error fetching or parsing dictionary:", error);
        // Reset promise so it can be retried
        dictionaryPromise = null; 
        throw error; // Re-throw the error to be caught by the caller
      });
  }
  return dictionaryPromise;
};
