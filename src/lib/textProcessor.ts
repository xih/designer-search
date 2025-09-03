// Text preprocessing using phonemizer for KittenTTS
// Based on working demo implementation

// Lazy load phonemizer to prevent issues on unsupported browsers
type PhonemizerFunc = (text: string, lang: string) => Promise<string | string[]>;
let phonemizeFunc: PhonemizerFunc | null = null;

async function getPhonemizerFunc() {
  if (!phonemizeFunc) {
    try {
      const { phonemize } = await import('phonemizer');
      phonemizeFunc = phonemize;
    } catch (error) {
      console.error('Failed to load phonemizer:', error);
    }
  }
  return phonemizeFunc;
}

// Load tokenizer vocabulary
let tokenizerVocab: Record<string, number> | null = null;

async function loadTokenizer(): Promise<Record<string, number>> {
  if (tokenizerVocab) return tokenizerVocab;
  
  console.log('📝 Loading tokenizer.json...');
  const response = await fetch('/models/tokenizer.json');
  if (!response.ok) {
    throw new Error(`Failed to load models/tokenizer.json: ${response.status}`);
  }
  
  const tokenizerData = await response.json() as { model?: { vocab?: Record<string, number> } };
  tokenizerVocab = tokenizerData.model?.vocab ?? {};
  console.log('📝 Tokenizer loaded with', Object.keys(tokenizerVocab).length, 'tokens');
  
  return tokenizerVocab;
}

// Text cleaner function based on working demo
export function textCleaner(text: string): string {
  // Basic text normalization
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s']/g, '') // Keep apostrophes for contractions
    .trim();
}

// Check if we're on iOS to avoid phonemizer issues
function checkIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { MSStream?: unknown };
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !nav.MSStream;
}

// Convert text to phonemes using phonemizer
export async function textToPhonemes(text: string): Promise<string> {
  console.log('📝 [PHONEMIZER] Converting text to phonemes:', `"${text}"`);
  
  // Fallback for iOS devices where phonemizer might not work
  if (checkIsIOS()) {
    console.warn('📝 [PHONEMIZER] iOS detected, using fallback phoneme generation');
    // Simple fallback that returns the cleaned text
    // In a real app, you might want to use a simpler phoneme library or API
    return textCleaner(text);
  }
  
  try {
    const phonemize = await getPhonemizerFunc();
    if (!phonemize) {
      console.warn('📝 [PHONEMIZER] Phonemizer not available, using fallback');
      return textCleaner(text);
    }
    
    const phonemesArray = await phonemize(text, 'en-us');
    const phonemes = Array.isArray(phonemesArray) ? phonemesArray.join(' ') : phonemesArray;
    console.log('📝 [PHONEMIZER] Generated phonemes:', `"${phonemes}"`);
    return phonemes;
  } catch (error) {
    console.error('❌ [PHONEMIZER] Failed to generate phonemes:', error);
    // Return cleaned text as fallback
    console.warn('📝 [PHONEMIZER] Using fallback due to error');
    return textCleaner(text);
  }
}

// Tokenize phonemes based on working demo approach
export async function tokenizePhonemes(phonemes: string): Promise<number[]> {
  console.log('📝 [TOKENIZER] Tokenizing phonemes:', `"${phonemes}"`);
  
  const vocab = await loadTokenizer();
  
  // Add boundary markers like in the working demo
  const tokensWithBoundaries = `${phonemes}`;
  console.log('📝 [TOKENIZER] Text with boundaries:', `"${tokensWithBoundaries}"`);
  
  const tokens: number[] = [];
  
  // Tokenize character by character with fallback to unknown token
  for (const char of tokensWithBoundaries) {
    const tokenId = vocab[char];
    if (tokenId !== undefined) {
      tokens.push(tokenId);
    } else {
      // Fallback to <unk> token or 0 if not found
      const unkToken = vocab['<unk>'] ?? vocab['[UNK]'] ?? 0;
      tokens.push(unkToken);
      console.log(`📝 [TOKENIZER] Unknown character '${char}' → ${unkToken}`);
    }
  }
  
  console.log('📝 [TOKENIZER] Generated token sequence:', tokens.slice(0, 20), tokens.length > 20 ? `... (${tokens.length} total)` : '');
  return tokens;
}

// Main function to prepare text for TTS (replaces the old prepareTextForTTS)
export async function prepareTextForTTS(text: string): Promise<number[]> {
  console.log('📝 [PREPROCESSING] Starting text preparation for:', `"${text}"`);
  
  try {
    // Step 1: Clean the text
    const cleanedText = textCleaner(text);
    console.log('📝 [PREPROCESSING] Cleaned text:', `"${cleanedText}"`);
    
    // Step 2: Convert to phonemes using phonemizer
    const phonemes = await textToPhonemes(cleanedText);
    
    // Step 3: Tokenize the phonemes
    const tokens = await tokenizePhonemes(phonemes);
    
    console.log('📝 [PREPROCESSING] Final preparation complete');
    console.log('📝 [PREPROCESSING] Input text length:', text.length, 'chars');
    console.log('📝 [PREPROCESSING] Output token count:', tokens.length);
    
    return tokens;
  } catch (error) {
    console.error('❌ [PREPROCESSING] Text preparation failed:', error);
    throw new Error(`Text preparation failed: ${String(error)}`);
  }
}