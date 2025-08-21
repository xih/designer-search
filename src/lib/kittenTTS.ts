"use client";

import * as ort from "onnxruntime-web";
import { phonemize } from 'phonemizer';
import { encodeWAV } from './wavEncoder';
import * as Sentry from '@sentry/nextjs';

export type VoiceName =
  | "expr-voice-2-m"
  | "expr-voice-2-f"
  | "expr-voice-3-m"
  | "expr-voice-3-f"
  | "expr-voice-4-m"
  | "expr-voice-4-f"
  | "expr-voice-5-m"
  | "expr-voice-5-f";

// Helper function to log based on environment
const isDev = process.env.NODE_ENV === 'development';

// Helper to safely serialize error objects
function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'number' || typeof error === 'boolean') {
    return String(error);
  }
  if (error == null) {
    return String(error);
  }
  // For objects, try JSON.stringify as fallback
  try {
    return JSON.stringify(error);
  } catch {
    return '[Unserializable Object]';
  }
}

function logDebug(message: string, data?: unknown) {
  if (isDev) {
    console.log(message, data ?? '');
  }
  Sentry.addBreadcrumb({
    message,
    level: 'debug',
    category: 'tts',
    data: data ? { details: JSON.stringify(data) } : undefined,
    timestamp: Date.now() / 1000,
  });
}

function logError(message: string, error?: unknown) {
  if (isDev) {
    console.error(message, error ?? '');
  }
  Sentry.addBreadcrumb({
    message,
    level: 'error',
    category: 'tts',
    data: error ? { error: serializeError(error) } : undefined,
    timestamp: Date.now() / 1000,
  });
}

function logWarn(message: string, data?: unknown) {
  if (isDev) {
    console.warn(message, data ?? '');
  }
  Sentry.addBreadcrumb({
    message,
    level: 'warning',
    category: 'tts',
    data: data ? { details: JSON.stringify(data) } : undefined,
    timestamp: Date.now() / 1000,
  });
}

export class KittenTTSWeb {
  private session: ort.InferenceSession | null = null;
  private wasmSession: ort.InferenceSession | null = null;
  private voices: Record<string, number[] | number[][]> = {};
  private tokenizer: { model: { vocab: Record<string, number> } } | null = null;
  private vocab: Record<string, number> = {};
  private vocabArray: string[] = [];
  private isInitialized = false;
  private lastUsedSampleRate = 24000;

  async init(): Promise<void> {
    if (this.isInitialized) {
      logDebug("🐱 KittenTTS already initialized, skipping...");
      return;
    }

    const startTime = performance.now();
    
    // Add device info to Sentry context
    Sentry.setContext("device", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      devicePixelRatio: window.devicePixelRatio,
    });
    
    try {
      logDebug("🐱 [STEP 1/3] Starting KittenTTS initialization...");
      logDebug("🐱 [STEP 1/3] Loading ONNX model from /models/kitten_tts_nano_v0_1.onnx");

      // Load the ONNX model - FORCE WASM for debugging (WebGPU might be causing issues)
      const modelLoadStart = performance.now();
      logDebug("🔧 [DEBUG] Forcing WASM execution to debug gibberish issue");
      
      // Fetch the model as a buffer first
      const modelResponse = await fetch("/models/kitten_tts_nano_v0_1.onnx");
      const modelBuffer = await modelResponse.arrayBuffer();
      const modelUint8Array = new Uint8Array(modelBuffer);
      
      this.session = await ort.InferenceSession.create(
        modelUint8Array,
        {
          executionProviders: ['wasm'],
        },
      );
      logDebug("🎯 Using WASM execution provider (forced for debugging)");
      const modelLoadTime = performance.now() - modelLoadStart;
      logDebug(`✅ [STEP 1/3] ONNX model loaded successfully in ${modelLoadTime.toFixed(2)}ms`);
      logDebug("🐱 [STEP 1/3] Model inputs:", this.session.inputNames);
      logDebug("🐱 [STEP 1/3] Model outputs:", this.session.outputNames);

      logDebug("🐱 [STEP 2/3] Loading voice embeddings from /models/voices.json");
      const voicesLoadStart = performance.now();
      // Load voice embeddings
      const response = await fetch("/models/voices.json");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch models/voices.json: ${response.status} ${response.statusText}`,
        );
      }
      this.voices = (await response.json()) as Record<
        string,
        number[] | number[][]
      >;
      const voicesLoadTime = performance.now() - voicesLoadStart;
      logDebug(`✅ [STEP 2/3] Voice embeddings loaded in ${voicesLoadTime.toFixed(2)}ms`);

      logDebug("🐱 [STEP 3/3] Loading tokenizer...");
      await this.loadTokenizer();
      
      logDebug("🐱 [STEP 4/4] Finalizing initialization...");
      logDebug("✅ [STEP 4/4] Available voices:", Object.keys(this.voices));
      const firstVoice = Object.values(this.voices)[0];
      const dimensions = firstVoice
        ? Array.isArray(firstVoice[0])
          ? firstVoice[0].length
          : firstVoice.length
        : "unknown";
      logDebug("✅ [STEP 4/4] Voice embedding dimensions:", dimensions);
      logDebug("✅ [STEP 4/4] Tokenizer vocab size:", Object.keys(this.vocab).length);
      this.isInitialized = true;

      const totalTime = performance.now() - startTime;
      logDebug(`🎉 KittenTTS initialization completed in ${totalTime.toFixed(2)}ms`);
      
      // Report successful initialization to Sentry
      Sentry.setTag("tts.initialized", "true");
      Sentry.setContext("tts_init", {
        initTime: totalTime.toFixed(2),
        modelLoadTime: modelLoadTime.toFixed(2),
        voicesLoadTime: voicesLoadTime.toFixed(2),
        vocabSize: Object.keys(this.vocab).length,
        voiceCount: Object.keys(this.voices).length,
      });
    } catch (error) {
      const totalTime = performance.now() - startTime;
      logError(`❌ KittenTTS initialization failed after ${totalTime.toFixed(2)}ms:`, error);
      
      // Capture the error in Sentry with additional context
      Sentry.captureException(error, {
        tags: {
          'tts.phase': 'initialization',
          'tts.initialized': 'false',
        },
        contexts: {
          tts_error: {
            failureTime: totalTime.toFixed(2),
            errorMessage: String(error),
          },
        },
      });
      
      throw new Error(`KittenTTS initialization failed: ${String(error)}`);
    }
  }

  // Load the tokenizer (copied from working demo)
  async loadTokenizer(): Promise<void> {
    if (!this.tokenizer) {
      try {
        logDebug('📝 Loading tokenizer.json...');
        const response = await fetch('/models/tokenizer.json');
        if (!response.ok) {
          throw new Error(`Failed to load models/tokenizer.json: ${response.status}`);
        }
        const tokenizerData = await response.json() as { model: { vocab: Record<string, number> } };
        
        // Extract the actual vocabulary from the tokenizer
        this.vocab = tokenizerData.model.vocab;
        this.vocabArray = [];
        
        // Create reverse mapping
        for (const [char, id] of Object.entries(this.vocab)) {
          this.vocabArray[id] = char;
        }
        
        this.tokenizer = tokenizerData;
        logDebug(`✅ Tokenizer loaded with ${Object.keys(this.vocab).length} tokens`);
      } catch (error) {
        logError('❌ Error loading tokenizer:', error);
        this.vocab = {};
        this.vocabArray = [];
        
        // Capture tokenizer loading error
        Sentry.captureException(error, {
          tags: { 'tts.phase': 'tokenizer_load' },
        });
      }
    }
  }

  // Convert text to phonemes using phonemizer (copied from working demo)  
  async textToPhonemes(text: string): Promise<string> {
    logDebug('🔤 [PHONEMIZER] Converting text to phonemes:', `"${text}"`);
    logDebug('🔤 [PHONEMIZER] Original text length:', text.length);
    
    try {
      // Clean text first (basic normalization)
      const cleanedText = text
        .toLowerCase()
        .replace(/[^\w\s'.,!?-]/g, '') // Keep basic punctuation
        .replace(/\s+/g, ' ')
        .trim();
      logDebug('🔤 [PHONEMIZER] Cleaned text:', `"${cleanedText}"`);
      
      const phonemesArray = await phonemize(cleanedText, 'en-us');
      const phonemes = Array.isArray(phonemesArray) ? phonemesArray.join(' ') : phonemesArray;
      logDebug('🔤 [PHONEMIZER] Generated phonemes:', `"${phonemes}"`);
      logDebug('🔤 [PHONEMIZER] Phonemes length:', phonemes.length.toString());
      return phonemes;
    } catch (error) {
      logError('❌ [PHONEMIZER] Failed to generate phonemes:', error);
      
      // Capture phonemization error
      Sentry.captureException(error, {
        tags: { 'tts.phase': 'phonemization' },
        contexts: {
          phonemizer: {
            inputText: text,
            textLength: text.length,
          },
        },
      });
      
      throw new Error(`Phonemization failed: ${String(error)}`);
    }
  }

  // Tokenize text using the loaded tokenizer (copied from working demo)
  async tokenizeText(text: string): Promise<number[]> {
    await this.loadTokenizer();

    const phonemes = await this.textToPhonemes(text);
    // Add boundary markers like the tokenizer expects ($ markers)
    const tokensWithBoundaries = `$${phonemes}$`;
    logDebug('🔤 [TOKENIZER] Text with boundaries:', `"${tokensWithBoundaries}"`);
    
    // Convert to token IDs
    const tokens = tokensWithBoundaries.split('').map(char => {
      const tokenId = this.vocab[char];
      if (tokenId === undefined) {
        logWarn(`Unknown character: "${char}", using 0 token`);
        return 0; // Use 0 token for unknown chars
      }
      return tokenId;
    });
    
    logDebug(`🔤 [TOKENIZER] Generated tokens: ${JSON.stringify(tokens.slice(0, 20))}${tokens.length > 20 ? ` ... (${tokens.length} total)` : ''}`);
    return tokens;
  }

  private async prepareInputs(
    text: string,
    voice: VoiceName = "expr-voice-5-m",
    speed = 1.0,
  ) {
    logDebug("🔧 [PREP 1/4] Starting input preparation...");
    logDebug(`🔧 [PREP 1/4] Input text: "${text}"`);
    logDebug(`🔧 [PREP 1/4] Voice: ${voice}, Speed: ${speed}`);

    if (!this.session) {
      throw new Error("KittenTTS not initialized");
    }

    logDebug("🔧 [PREP 2/4] Converting text to tokens...");
    // Use the working demo's tokenization approach  
    const tokenIds = await this.tokenizeText(text);
    logDebug("🔍 [DEBUG] Raw token IDs before BigInt conversion:", tokenIds);
    
    // CRITICAL: Working demo uses regular numbers, let's try that
    const inputIds = new BigInt64Array(tokenIds.map(id => BigInt(id)));
    logDebug("🔍 [DEBUG] After BigInt conversion:", Array.from(inputIds));

    logDebug("🔧 [PREP 3/4] Loading voice embedding...");
    // Get voice embedding - use [0] index like working demo
    const rawVoiceEmbedding = this.voices[voice];
    if (!rawVoiceEmbedding) {
      logError("❌ Available voices:", Object.keys(this.voices));
      throw new Error(`Voice ${voice} not found`);
    }

    // Extract first element like working demo: voiceEmbeddings[voice][0]
    const speakerEmbedding = Array.isArray(rawVoiceEmbedding[0])
      ? new Float32Array(rawVoiceEmbedding[0])
      : new Float32Array(rawVoiceEmbedding as number[]);

    logDebug("🔧 [PREP 3/4] Voice embedding processed:", {
      originalShape: Array.isArray(rawVoiceEmbedding[0])
        ? `[${rawVoiceEmbedding.length}, ${rawVoiceEmbedding[0].length}]`
        : `[${rawVoiceEmbedding.length}]`,
      finalDimensions: speakerEmbedding.length,
      wasNested: Array.isArray(rawVoiceEmbedding[0]),
    });

    logDebug("🔧 [PREP 4/4] Creating ONNX tensors...");
    logDebug("🔧 [PREP 4/4] Model expected inputs:", this.session.inputNames);
    const result = {
      input_ids: new ort.Tensor("int64", inputIds, [1, inputIds.length]),
      style: new ort.Tensor("float32", speakerEmbedding, [1, speakerEmbedding.length]),
      speed: new ort.Tensor("float32", new Float32Array([speed]), [1]),
    };
    
    // Verify input names match model expectations
    const expectedInputs = this.session.inputNames;
    const providedInputs = Object.keys(result);
    logDebug("🔧 [PREP 4/4] Expected inputs:", expectedInputs);
    logDebug("🔧 [PREP 4/4] Provided inputs:", providedInputs);
    
    if (!expectedInputs.every(name => providedInputs.includes(name))) {
      logWarn("⚠️ Input name mismatch detected!");
    }
    logDebug("✅ [PREP 4/4] Input preparation completed");
    logDebug("🔧 [PREP 4/4] Tensor shapes:", {
      input_ids: result.input_ids.dims,
      style: result.style.dims,
      speed: result.speed.dims,
    });
    logDebug("🔧 [PREP 4/4] Tensor data types:", {
      input_ids: result.input_ids.type,
      style: result.style.type, 
      speed: result.speed.type,
    });
    logDebug("🔧 [PREP 4/4] Sample tensor data:", {
      input_ids: Array.from(result.input_ids.data.slice(0, 10)),
      input_ids_full: Array.from(result.input_ids.data),
      style: Array.from(result.style.data.slice(0, 5)),
      speed: Array.from(result.speed.data),
    });
    
    // Log critical debugging info
    logDebug("🔍 [DEBUG] Critical model input analysis:");
    logDebug("🔍 Token sequence length:", inputIds.length);
    logDebug("🔍 Voice embedding shape check:", {
      rawShape: Array.isArray(rawVoiceEmbedding) ? rawVoiceEmbedding.length : 'not array',
      isNested: Array.isArray(rawVoiceEmbedding[0]),
      finalEmbeddingLength: speakerEmbedding.length,
      firstFewValues: Array.from(speakerEmbedding.slice(0, 3))
    });

    return result;
  }

  async synthesize(
    text: string,
    voice: VoiceName = "expr-voice-5-m",
    speed = 1.0,
  ): Promise<Float32Array> {
    const synthesisStart = performance.now();
    console.log("🎤 [SYNTHESIS] Starting speech synthesis...");
    console.log("🎤 [SYNTHESIS] Text being spoken:", `"${text}"`);
    console.log("🎤 [SYNTHESIS] Text length:", text.length, "characters");
    console.log("🎤 [SYNTHESIS] Voice:", voice, "Speed:", speed);

    // 🔧 TWEAKING GUIDE:
    // - voice: Change to any available voice (expr-voice-2-m, expr-voice-2-f, etc.)
    // - speed: 0.5 = slower, 1.0 = normal, 1.5 = faster
    // - For better quality: Try different voices or adjust speed between 0.8-1.2

    if (!this.isInitialized || !this.session) {
      throw new Error("KittenTTS not initialized. Call init() first.");
    }

    try {
      console.log("🎤 [SYNTHESIS STEP 1/4] Preparing model inputs...");
      const inputPrepStart = performance.now();
      const inputs = await this.prepareInputs(text, voice, speed);
      const inputPrepTime = performance.now() - inputPrepStart;
      console.log(
        `✅ [SYNTHESIS STEP 1/4] Inputs prepared in ${inputPrepTime.toFixed(2)}ms`,
      );

      console.log("🎤 [SYNTHESIS STEP 2/4] Running ONNX inference...");
      const inferenceStart = performance.now();
      let outputs = await this.session.run(inputs);
      const inferenceTime = performance.now() - inferenceStart;
      console.log(
        `✅ [SYNTHESIS STEP 2/4] Inference completed in ${inferenceTime.toFixed(2)}ms`,
      );
      console.log(
        "🎤 [SYNTHESIS STEP 2/4] Model outputs:",
        Object.keys(outputs),
      );

      console.log("🎤 [SYNTHESIS STEP 3/4] Processing audio output...");
      // Extract audio data - we know it's called 'waveform'
      let audioOutput = outputs.waveform;
      if (!audioOutput) {
        console.error("❌ Available outputs:", Object.keys(outputs));
        throw new Error("No waveform output from model");
      }
      
      let audioData = audioOutput.data as Float32Array;
      
      // Check if WebGPU produced NaN values and fallback to WASM (like working demo)
      if (audioData.length > 0 && audioData[0] !== undefined && isNaN(audioData[0])) {
        console.log("⚠️ WebGPU produced NaN values, falling back to WASM...");
        
        // Create WASM session if we don't have one
        if (!this.wasmSession) {
          const fallbackModelResponse = await fetch("/models/kitten_tts_nano_v0_1.onnx");
          const fallbackModelBuffer = await fallbackModelResponse.arrayBuffer();
          const fallbackModelUint8Array = new Uint8Array(fallbackModelBuffer);
          
          this.wasmSession = await ort.InferenceSession.create(
            fallbackModelUint8Array,
            {
              executionProviders: ['wasm']
            }
          );
        }
        
        // Retry inference with WASM
        outputs = await this.wasmSession.run(inputs);
        audioOutput = outputs.waveform;
        audioData = audioOutput?.data as Float32Array;
      }
      
      console.log("🎤 [SYNTHESIS STEP 3/4] Using waveform output");

      // Log duration if available
      if (outputs.duration) {
        const durationData = outputs.duration.data as Float32Array;
        console.log("🎤 [SYNTHESIS STEP 3/4] Duration output:", {
          shape: outputs.duration.dims,
          values: Array.from(durationData),
        });
      }

      const pcm = audioOutput?.data as Float32Array;
      console.log("🎤 [SYNTHESIS STEP 3/4] Raw PCM length:", pcm.length);
      console.log(
        "🎤 [SYNTHESIS STEP 3/4] Audio tensor shape:",
        audioOutput?.dims ?? [],
      );
      console.log("🎤 [SYNTHESIS STEP 3/4] Audio data type:", audioOutput?.type ?? 'unknown');
      console.log("🎤 [SYNTHESIS STEP 3/4] PCM sample range:", {
        min: Math.min(...Array.from(pcm).slice(0, 1000)),
        max: Math.max(...Array.from(pcm).slice(0, 1000)),
        first10: Array.from(pcm).slice(0, 10),
      });

      console.log(
        "🎤 [SYNTHESIS STEP 4/4] Audio processing with amplitude and sample rate fixes...",
      );

      // Use the correct sample rate based on model (like working demo)
      const sampleRate = 24000; // Model generates 24kHz audio
      
      // Log duration for debugging
      if (outputs.duration) {
        const durationData = outputs.duration.data as Float32Array;
        const durationSeconds = Number(durationData[0]);
        console.log(
          "🔧 Duration tensor shows:",
          durationSeconds + "s",
          "using fixed 24kHz sample rate"
        );
      }

      // Clean up NaN values and find amplitude (like working demo)
      let hasNaN = false;
      let maxAmplitude = 0;
      for (let i = 0; i < audioData.length; i++) {
        const value = audioData[i];
        if (value === undefined || isNaN(value)) {
          audioData[i] = 0; // Replace NaN with silence
          hasNaN = true;
        } else {
          maxAmplitude = Math.max(maxAmplitude, Math.abs(value));
        }
      }
      
      if (hasNaN) {
        console.log("⚠️ Cleaned up NaN values in audio data");
      }
      
      console.log("🔧 Audio amplitude analysis:", {
        maxAmplitude: maxAmplitude.toFixed(4),
        needsNormalization: maxAmplitude < 0.1,
      });

      // Normalize audio if it's too quiet (like working demo)
      const finalAudioData = new Float32Array(audioData);
      if (maxAmplitude > 0 && maxAmplitude < 0.1) {
        const normalizationFactor = 0.5 / maxAmplitude;
        console.log("🔧 Normalizing audio with factor:", normalizationFactor.toFixed(2));
        
        for (let i = 0; i < finalAudioData.length; i++) {
          finalAudioData[i] = (finalAudioData[i] ?? 0) * normalizationFactor;
        }
      }

      const trimmedPcm = finalAudioData;

      console.log("🎤 [DEBUG] Audio processing details:", {
        originalLength: audioData.length,
        finalLength: trimmedPcm.length,
        sampleRate: sampleRate + "Hz",
        durationSeconds: (trimmedPcm.length / sampleRate).toFixed(2) + "s",
        hadNaN: hasNaN,
        maxAmplitude: maxAmplitude.toFixed(4),
        amplitudeRange: {
          min: Math.min(...Array.from(trimmedPcm).slice(0, 1000)).toFixed(4),
          max: Math.max(...Array.from(trimmedPcm).slice(0, 1000)).toFixed(4),
        },
      });

      const totalTime = performance.now() - synthesisStart;
      console.log(
        `✅ [SYNTHESIS STEP 4/4] Generated ${trimmedPcm.length} audio samples`,
      );
      console.log(`🎉 Speech synthesis completed in ${totalTime.toFixed(2)}ms`);
      console.log("🎤 [SYNTHESIS] Audio stats:", {
        audioLength: trimmedPcm.length,
        sampleRate: sampleRate + "Hz",
        duration: `${(trimmedPcm.length / sampleRate).toFixed(2)}s`,
      });

      // Store the sample rate for use in WAV encoding
      this.lastUsedSampleRate = sampleRate;

      return trimmedPcm;
    } catch (error) {
      const totalTime = performance.now() - synthesisStart;
      console.error(
        `❌ Speech synthesis failed after ${totalTime.toFixed(2)}ms:`,
        error,
      );
      throw new Error(`Speech synthesis failed: ${String(error)}`);
    }
  }

  async speak(
    text: string,
    voice: VoiceName = "expr-voice-5-m",
    speed = 1.0,
  ): Promise<void> {
    const speakStart = performance.now();
    console.log("🔊 [SPEAK] Starting speak process...");

    try {
      console.log("🔊 [SPEAK STEP 1/4] Synthesizing audio...");
      const synthStart = performance.now();
      const pcm = await this.synthesize(text, voice, speed);
      const synthTime = performance.now() - synthStart;
      console.log(
        `✅ [SPEAK STEP 1/4] Audio synthesized in ${synthTime.toFixed(2)}ms`,
      );

      console.log("🔊 [SPEAK STEP 2/4] Encoding to WAV format...");
      const encodeStart = performance.now();
      // Use the actual sample rate determined during synthesis
      const wavBlob = encodeWAV(pcm, this.lastUsedSampleRate);
      const encodeTime = performance.now() - encodeStart;
      console.log(
        `✅ [SPEAK STEP 2/4] WAV encoded in ${encodeTime.toFixed(2)}ms`,
      );
      console.log(
        "🔊 [SPEAK STEP 2/4] WAV blob size:",
        (wavBlob.size / 1024).toFixed(2),
        "KB",
      );

      console.log("🔊 [SPEAK STEP 3/4] Creating audio URL...");
      const audioUrl = URL.createObjectURL(wavBlob);
      console.log(
        "✅ [SPEAK STEP 3/4] Audio URL created:",
        audioUrl.substring(0, 50) + "...",
      );

      console.log("🔊 [SPEAK STEP 4/4] Starting audio playback...");
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        audio.onloadstart = () =>
          console.log("🔊 [PLAYBACK] Audio loading started...");
        audio.oncanplay = () =>
          console.log("✅ [PLAYBACK] Audio can start playing");
        audio.onplay = () => {
          const totalTime = performance.now() - speakStart;
          console.log(
            `🎵 [PLAYBACK] Audio playback started (total time: ${totalTime.toFixed(2)}ms)`,
          );
        };
        audio.onended = () => {
          console.log("✅ [PLAYBACK] Audio playback completed");
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          console.error("❌ [PLAYBACK] Audio playback failed");
          URL.revokeObjectURL(audioUrl);
          reject(new Error("Audio playback failed"));
        };
        audio.play().catch((error) => {
          console.error("❌ [PLAYBACK] Play() failed:", error);
          reject(new Error(String(error)));
        });
      });
    } catch (error) {
      const totalTime = performance.now() - speakStart;
      console.error(
        `❌ Speak process failed after ${totalTime.toFixed(2)}ms:`,
        error,
      );
      throw error;
    }
  }

  getAvailableVoices(): VoiceName[] {
    return Object.keys(this.voices) as VoiceName[];
  }

  isReady(): boolean {
    return this.isInitialized && this.session !== null;
  }
}

// Singleton instance
let ttsInstance: KittenTTSWeb | null = null;

export function getKittenTTS(): KittenTTSWeb {
  ttsInstance ??= new KittenTTSWeb();
  return ttsInstance;
}
