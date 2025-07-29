import { WordEntry } from '../types.ts';

// You can now add new dictionary entries by simply adding lines to this rawData string.
// Main entries follow the format: `tatar_word grammar. romanian_definition.`
// Example lines (for the same word) should start with `●`.
const rawData: string = `
a interj. a!; ah!; ay!;
aba s. 1. soră mai mare. 2. mătușă (după mamă). 3. mamă. 4. (text.) aba; dimie; pănură.
abadan adj. 1. înfloritor; prosper. 2. locuit; populat.
abadanlîk s. 1. centru populat; așezare; localitate prosperă. 2. înflorire; prosperitate.
abağî s. abagiu.
abajur s. abajur.
abakay s. (ent.) tarantulă (lat., Lycosa tarentula).
abalamak v.i. a lătra.
abalaw s. lătrat.
abat I. adj. II. s. 1. înfloritor; prosper. 2. locuit; populat. 3. centru populat; așezare; localitate prosperă.
●abat bolmak a se popula; a fi locuit; a înflori; a prospera; a se popula; a se construi; a se renova; a se moderniza.
●abat etmek a popula; a construi; a renova; a moderniza.
●abat kasaba localitate prosperă.
abay s. (dim., fam.) mămică; mătușică maternală; surioară mai mare.
●abay maraz mama e bolnavă.
abaylamak v.t. a observa; a sesiza; a simți; a percepe; a băga de seamă.
abaylanmak v.i. a fi perceput; a fi observat; a fi simțit.
abaylanmadan adv. neobservat; pe neobservate; tiptil; fără a fi sesizat; fără a fi perceput.
●abaylanmadan barmak a se furişa; a se strecura; a se fofila.
abdest s. (relig., la musulmani) spălare rituală a corpului pentru purificare; abluțiune.
●abdest almak (relig., la musulmani) a face abluțiune.
●abdestín bermek a muștrului; a trage cuiva o papară.
●abdestín bîzmak a merge la toaletă; a-și face nevoile.
abdestkana s. toaletă; closet.
abiy s. (dim., fam.) frățior mai mare; nene.
abla s. soră mai mare.
abruy s. stimă; onoare; considerație; respect.
abruylî adj. stimat; onorat; respectat.
ada s. (geogr.) insulă; ostrov.
●takîm adalar arhipelag.
adak s. 1. promisiune; făgăduială; angajament. 2. logodnă.
adalet s. 1. justiție. 2. dreptate; echitate; justețe; imparțialitate; nepărtinire.
●adalet bakanlîgî / nazirlîgí (pol.) ministerul justiției.
adam s. bărbat; om.
`;

/**
 * Parses a raw multiline string of dictionary data into an array of WordEntry objects.
 * This parser is designed to handle complex grammar notations, including parenthesized text.
 * @param {string} data The raw dictionary string.
 * @returns {WordEntry[]} An array of structured word entries.
 */
function parseRawDictionary(data: string): WordEntry[] {
    const entries: WordEntry[] = [];
    const lines = data.trim().split('\n');

    const grammarPartRegex = /^(?:[IVXLCDM]+\.|[a-z.,]+\.|\(.*\))$/;
    // This regex tokenizes a string by spaces, but keeps parenthesized content as a single token.
    const tokenizerRegex = /\(.*?\)|[^\s]+/g;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Handle example lines, which are associated with the previous entry
        if (trimmedLine.startsWith('●')) {
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                if (!lastEntry.examples) {
                    lastEntry.examples = [];
                }
                lastEntry.examples.push(trimmedLine.substring(1).trim());
            }
            return;
        }
        
        // Match the Tatar word (first word) and the rest of the line
        const lineParts = trimmedLine.match(/^(\S+)(?:\s+(.*))?$/);
        if (!lineParts) {
            return; // Should not happen with non-empty lines, but good for safety
        }

        const tatar = lineParts[1];
        const restOfLine = lineParts[2] || '';
        
        // Tokenize the rest of the line to separate grammar from the definition
        const tokens = restOfLine.match(tokenizerRegex) || [];
        
        let grammarParts: string[] = [];
        let romanianStartIndex = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            // Heuristic to distinguish numbered lists in definitions (e.g., "1. some def")
            // from Roman numerals in grammar parts (e.g., "I. adj.").
            if (token.match(/^[0-9]+\.$/)) { 
                const nextToken = tokens[i + 1];
                // If the next token doesn't look like a grammar part, assume the current number
                // is the start of a numbered definition.
                if (!nextToken || !nextToken.match(grammarPartRegex)) {
                    break;
                }
            }
            
            if (token.match(grammarPartRegex)) {
                grammarParts.push(token);
                romanianStartIndex = i + 1;
            } else {
                // The first token that is not a grammar part marks the beginning of the definition.
                break;
            }
        }
        
        const grammar = grammarParts.join(' ');
        const romanian = tokens.slice(romanianStartIndex).join(' ');

        if (tatar) {
            entries.push({ tatar, grammar, romanian });
        }
    });

    return entries;
}


export const DICTIONARY_DATA: WordEntry[] = parseRawDictionary(rawData);