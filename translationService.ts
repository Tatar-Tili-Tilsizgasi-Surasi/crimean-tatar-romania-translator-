
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';
import { PARSED_DICTIONARY_ENTRIES } from '../dictionaryData';
import { DICTIONARY1_ENTRIES } from '../dictionary1.txt';
import { DICTIONARY2_ENTRIES } from '../dictionary2.txt';
import { TRANSLATIONS1_ENTRIES } from '../translations1.txt';
import { TRANSLATIONS2_ENTRIES } from '../translations2.txt';
import { 
    CRIMEAN_TATAR_RO_ALPHABET_PRONUNCIATION_GUIDE, 
    CRIMEAN_TATAR_RO_ORTHOGRAPHY_INFO, 
    CRIMEAN_TATAR_RO_SCT_DT_SUMMARY_INFO, 
    CRIMEAN_TATAR_RO_EXAMPLES, 
    CRIMEAN_TATAR_RO_VOWEL_HARMONY_INFO, 
    CRIMEAN_TATAR_RO_PHONETIC_CHANGES_INFO, 
    CRIMEAN_TATAR_RO_SYLLABLE_STRUCTURE_INFO,
    CRIMEAN_TATAR_RO_BIRD_NAMES_TABLE,
    CRIMEAN_TATAR_RO_COMPREHENSIVE_GRAMMAR_DETAILS,
    POS_PREFIXES_FOR_CLEANING
} from "./promptData";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not found. Translation service will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Fallback to prevent crash if API_KEY is undefined

export const translateText = async (
  sourceText: string,
  sourceLangName: string,
  targetLangName: string
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is not configured. Please set the API_KEY environment variable.");
  }
  if (!sourceText.trim()) {
    return ""; // Return empty if source text is empty
  }

  const searchTextLower = sourceText.trim().toLowerCase();

  // --- START OF DICTIONARY LOOKUPS ---

  // Lookup 1: English -> Crimean Tatar (RO) from examples
  if (sourceLangName === 'English' && targetLangName === 'Crimean Tatar (Romania)') {
    if (ENGLISH_TO_CT_LOOKUP.has(searchTextLower)) {
      return `(Din exemple) ${ENGLISH_TO_CT_LOOKUP.get(searchTextLower)}`;
    }
  }
  
  // Lookup 2: Romanian -> Crimean Tatar (RO) from examples (for phrases)
  if (sourceLangName === 'Romanian' && targetLangName === 'Crimean Tatar (Romania)') {
    if (ROMANIAN_TO_CT_LOOKUP.has(searchTextLower)) {
        return `(Din exemple) ${ROMANIAN_TO_CT_LOOKUP.get(searchTextLower)}`;
    }
  }

  // Lookup 3: Romanian -> Crimean Tatar (RO) from dictionary (for single words)
  if (sourceLangName === 'Romanian' && targetLangName === 'Crimean Tatar (Romania)') {
      for (const entry of PARSED_DICTIONARY_ENTRIES) {
        const definitionPart = entry.details.split('//')[0].trim();
        const definitionsFromEntry = definitionPart.split(';').map(d => d.trim());

        for (const defWithPossibleAnnotations of definitionsFromEntry) {
          if (!defWithPossibleAnnotations) continue;
          let currentDef = defWithPossibleAnnotations.toLowerCase();
          if (currentDef.endsWith('.')) {
            currentDef = currentDef.slice(0, -1);
          }
          for (const prefix of POS_PREFIXES_FOR_CLEANING) {
            if (currentDef.startsWith(prefix)) {
              currentDef = currentDef.substring(prefix.length).trim();
              break; 
            }
          }
          const annotationRegexStart = /^\s*\([a-zçşğıöüâîA-ZÇŞĞİÖÜÂÎ0-9.,\s-]+\)\s*/;
          currentDef = currentDef.replace(annotationRegexStart, '').trim();
          
          const finalCleanedDef = currentDef;
          if (finalCleanedDef === searchTextLower && finalCleanedDef !== "") {
            return `(Din dicționar) ${entry.term}`;
          }
        }
      }
  }

  // Lookup 4: Crimean Tatar (RO) -> Romanian from dictionary
  if (sourceLangName === 'Crimean Tatar (Romania)' && targetLangName === 'Romanian') {
      const dictionaryMatch = PARSED_DICTIONARY_ENTRIES.find(
        entry => entry.term.toLowerCase() === searchTextLower
      );
      if (dictionaryMatch) {
        return `(Din dicționar) ${dictionaryMatch.details}`;
      }
  }
  // --- END OF DICTIONARY LOOKUPS ---


  let initialSystemInstruction = `You are an expert multilingual translator. Your primary task is to translate text accurately between languages.
Provide ONLY the translated text as your response, without any additional commentary, explanations, disclaimers, or surrounding quotes unless they are part of the translated text itself.
`;

  if (sourceLangName === 'Crimean Tatar (Romania)' || targetLangName === 'Crimean Tatar (Romania)') {
    initialSystemInstruction += CRIMEAN_TATAR_RO_ORTHOGRAPHY_INFO;
    initialSystemInstruction += CRIMEAN_TATAR_RO_ALPHABET_PRONUNCIATION_GUIDE;
    initialSystemInstruction += CRIMEAN_TATAR_RO_SCT_DT_SUMMARY_INFO;
    initialSystemInstruction += CRIMEAN_TATAR_RO_VOWEL_HARMONY_INFO;
    initialSystemInstruction += CRIMEAN_TATAR_RO_PHONETIC_CHANGES_INFO;
    initialSystemInstruction += CRIMEAN_TATAR_RO_SYLLABLE_STRUCTURE_INFO;
    initialSystemInstruction += CRIMEAN_TATAR_RO_EXAMPLES;
    initialSystemInstruction += CRIMEAN_TATAR_RO_COMPREHENSIVE_GRAMMAR_DETAILS;
    initialSystemInstruction += CRIMEAN_TATAR_RO_BIRD_NAMES_TABLE;
    initialSystemInstruction += `
Before Transliteration from SCT it's better to look up in the sources, may there is the correct DT translation found. Also after Transliteration from SCT it's important to stay in the rules of writing, some letter don't exist in DT or are written differently!
`;
    if (targetLangName === 'Crimean Tatar (Romania)') {
        initialSystemInstruction += `
When "Crimean Tatar (Romania)" is the target language, it is CRUCIAL that your translation STRICTLY adheres to its specific orthography, grammar, and lexical choices as detailed in the provided documents (Elifbe, Orthography, SCT-DT Summary, Grammar, Examples).
Authentic Crimean Tatar (Romania) as spoken in Dobruja DOES NOT USE the letters 'ü', 'ö', 'c' (for the /dʒ/ sound). The character 'â' is also NOT part of the Dobrujan Tatar alphabet (though 'á' is).
Instead, use their correct equivalents: 'ü' -> 'ú', 'ö' -> 'ó', 'c' -> 'ğ', 'ç' -> 'ş'. Correct any instances of 'â' based on context, likely to 'a' or 'á', or re-evaluate word choice if it's an incorrect borrowing. The letters b, d, g, ğ, i, ó, u, ú, v can't occur at the end, as a last letter of the word (exception: ald and dad). Also the letter ñ can't occur as an initial letter of a word.
AVOID Standard Crimean Tatar forms unless they are explicitly identical to Crimean Tatar (Romania) forms. The goal is literary Crimean Tatar (Romania). ONLY use the literary words and translations that are given in examples and dictionaries as possible, AVOID to generate translations. 
Don't use Russian or Ukrainian loanwords.
`;
    }
  }
  
  const initialUserPrompt = `Translate the following text from "${sourceLangName}" to "${targetLangName}":

"${sourceText}"
`;

  let initialTranslation = "";

  try {
    const initialResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: initialUserPrompt,
        config: {
            systemInstruction: initialSystemInstruction,
        }
    });
    
    initialTranslation = initialResponse.text;
    if (typeof initialTranslation !== 'string') {
      console.error("Received unexpected response format from Gemini API (Initial Pass):", initialResponse);
      throw new Error("Translation (Initial Pass) failed: Unexpected response format.");
    }
    initialTranslation = initialTranslation.trim();

  } catch (error) {
    console.error("Error translating text with Gemini API (Initial Pass):", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("Translation failed (Initial Pass): Invalid API Key. Please check your configuration.");
        }
         throw new Error(`Translation failed (Initial Pass): ${error.message}`);
    }
    throw new Error("Translation failed (Initial Pass) due to an unknown error.");
  }

  // Refinement Translation Step
  let reviewSystemInstruction = "";
  let reviewUserPrompt = "";

  if (targetLangName === 'Crimean Tatar (Romania)') {
    reviewSystemInstruction = `You are an expert linguist specializing *exclusively* in Dobrujan Crimean Tatar (Crimean Tatar - Romania). 
Your SOLE purpose is to ensure the provided text is 100% compliant with the specific orthography, grammar, and lexicon of this dialect as spoken in Dobruja, Romania.
ANY deviation from the provided linguistic guides (Elifbe, Orthography, SCT-DT Summary, Grammar, Examples) is an error. ONLY use the literary words and translations that are given in examples and dictionaries as possible, AVOID to generate translations.
Don't generate every time new alternatives, just use one literary translation. Provide ONLY the final, perfectly corrected Crimean Tatar (Romania) text. NO commentary.

The following detailed linguistic information for Crimean Tatar (Romania) MUST be strictly adhered to:
${CRIMEAN_TATAR_RO_ORTHOGRAPHY_INFO}
${CRIMEAN_TATAR_RO_ALPHABET_PRONUNCIATION_GUIDE}
${CRIMEAN_TATAR_RO_SCT_DT_SUMMARY_INFO}
${CRIMEAN_TATAR_RO_VOWEL_HARMONY_INFO}
${CRIMEAN_TATAR_RO_PHONETIC_CHANGES_INFO}
${CRIMEAN_TATAR_RO_SYLLABLE_STRUCTURE_INFO}
${CRIMEAN_TATAR_RO_EXAMPLES}
${CRIMEAN_TATAR_RO_COMPREHENSIVE_GRAMMAR_DETAILS}
${CRIMEAN_TATAR_RO_BIRD_NAMES_TABLE}

The provided "Initial translation" may contain features closer to Standard Crimean Tatar or other Turkic languages. Your primary goal is to transform these into Crimean Tatar (Romania) forms.
Only use characters explicitly listed in the provided Elifbe (Alphabet and Pronunciation Guide).
`;
    reviewUserPrompt = `Original text in "${sourceLangName}":
"${sourceText}"

Initial (potentially SCT-like or containing incorrect characters) translation to "Crimean Tatar (Romania)":
"${initialTranslation}"

TASK:
Critically review the "Initial translation". It likely does not fully adhere to Crimean Tatar (Romania) [DT] specifics.
Your job is to:
1. Identify ANY features in the "Initial translation" that do not conform to Crimean Tatar (Romania) orthography, grammar, or lexicon, especially if they resemble Standard Crimean Tatar [SCT] or use incorrect characters.
2. **Crucial Orthographic Corrections - MANDATORY Search and Replace:** This is not optional. Perform these replacements rigorously if these incorrect characters/patterns are present:
    *   The Dobrujan Tatar alphabet provided in the Elifbe *does not* contain the character 'â'. If 'â' appears, it is an error. Correct it to 'a' or 'á' based on vowel harmony and context, or determine if the word itself is an incorrect borrowing and replace it with an authentic DT word from the provided materials if available.
    *   Replace ALL instances of 'ü' with 'ú'.
    *   Replace ALL instances of 'ö' with 'ó'.
    *   Replace ALL instances of 'c' (when representing the /dʒ/ sound, as in SCT 'can' or 'ocak') with 'ğ'. (e.g., 'ocak' MUST become 'oğak', 'cam' MUST become 'ğam').
    *   Replace ALL instances of 'ç' with 'ş', unless it is an extremely rare, explicitly justified academic term where 'ç' is intentionally preserved (this is highly uncommon in authentic DT). (e.g., 'için' MUST become 'úşún', 'çay' MUST become 'şay').
    *   Carefully check the usage of 'i', 'í', and 'î' according to the detailed "Orthography Info" and "Alphabet Guide". Ensure SCT 'ı' is consistently DT 'î', and SCT 'i' is often DT 'í' (especially in suffixes and unstressed positions).
    *   Apply naturalization rules (e.g., f > p, v > w/b, h-dropping/changes) where appropriate for authentic DT.
    *   The letters b, d, g, ğ, i, ó, u, ú, v can't occur at the end, as a last letter of the word (exception: "ald" and "dad"). Also the letter ñ can't occur as an initial letter of a word.
3. **Lexical Choice:** Scrutinize every word. If a word appears to be a Standard Crimean Tatar (SCT) form and a distinct Dobrujan Tatar (DT) equivalent is provided in the dictionary, examples, or SCT-DT summary, YOU MUST USE THE DT EQUIVALENT. Prefer authentic DT vocabulary over direct transliteration from SCT.
4. Meticulously transform all non-conformant features into their correct Crimean Tatar (Romania) equivalents, strictly following ALL the provided linguistic guides.
5. Ensure the final output is natural, grammatically correct, and orthographically precise for Crimean Tatar (Romania) as spoken in Dobruja.
6. **Final Verification:** Before outputting, meticulously scan the translation. Ensure NO 'ü', 'ö', 'c' (for /dʒ/ sound), 'ç' (unless extremely rare academic), or 'â' characters are present. Confirm all DT-specific phonetic transformations (e.g., initial SCT Y- to DT Ğ-) are correctly applied. The output must be *indistinguishable* from text written by a native speaker of Dobrujan Crimean Tatar, using *only* the characters from the provided Elifbe.
7. Stay in vowel harmony: back vowels and front vowels.

If, after careful review and applying all necessary corrections, the "Initial translation" is already perfectly in Crimean Tatar (Romania) and needs no changes, return it as is. Otherwise, provide the refined version.
ONLY output the final, corrected Crimean Tatar (Romania) text. Do not add any commentary.
`;
  } else {
    // Original generic refinement prompt for other languages
    reviewSystemInstruction = `You are an expert multilingual editor and refiner.
Your task is to review and improve a given translation.
Focus on accuracy, natural phrasing, grammatical correctness, and adherence to specific linguistic guidelines for the target language.
Provide ONLY the final, refined translated text as your response, without any additional commentary, explanations, or disclaimers.`;

    reviewUserPrompt = `Original text in "${sourceLangName}":
"${sourceText}"

Initial translation to "${targetLangName}":
"${initialTranslation}"

Please review this initial translation. If it's already perfect, return it as is.
Otherwise, refine and improve the translation to "${targetLangName}", ensuring accuracy, natural phrasing, and adherence to all relevant linguistic rules for "${targetLangName}".
Provide ONLY the final, refined translated text as your response, without any additional commentary or explanations.
`;
  }


  try {
    const refinedResponse: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: reviewUserPrompt,
        config: {
            systemInstruction: reviewSystemInstruction,
        }
    });

    const refinedTranslation = refinedResponse.text;
    if (typeof refinedTranslation === 'string') {
      return refinedTranslation.trim();
    } else {
      console.error("Received unexpected response format from Gemini API (Refinement Pass):", refinedResponse);
      // Fallback to initial translation if refinement fails in an unexpected way
      console.warn("Refinement pass failed, returning initial translation.");
      return initialTranslation; 
    }

  } catch (error) {
    console.error("Error refining text with Gemini API (Refinement Pass):", error);
     if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("Translation failed (Refinement Pass): Invalid API Key. Please check your configuration.");
        }
        // If refinement fails, it's better to return the initial translation than nothing.
        console.warn(`Refinement pass failed with error: ${error.message}. Returning initial translation.`);
        return initialTranslation; 
    }
    // Fallback for unknown errors during refinement
    console.warn("Refinement pass failed due to an unknown error. Returning initial translation.");
    return initialTranslation;
  }
};
