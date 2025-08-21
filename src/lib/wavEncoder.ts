// Simple WAV encoder for PCM audio data

export function encodeWAV(samples: Float32Array, sampleRate = 24000): Blob {
  const length = samples.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  // File length minus first 8 bytes
  view.setUint32(4, 36 + length * 2, true);
  // RIFF type
  writeString(8, 'WAVE');
  // Format chunk identifier
  writeString(12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, 1, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate (sample rate * channels * bytes per sample)
  view.setUint32(28, sampleRate * 2, true);
  // Block align (channels * bytes per sample)
  view.setUint16(32, 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(36, 'data');
  // Data chunk length
  view.setUint32(40, length * 2, true);

  // Convert float samples to 16-bit PCM with better error handling
  let offset = 44;
  let clippedSamples = 0;
  for (let i = 0; i < length; i++) {
    const rawSample = samples[i];
    if (rawSample === undefined || rawSample === null || !isFinite(rawSample)) {
      view.setInt16(offset, 0, true); // Silent for invalid samples
      offset += 2;
      continue;
    }
    
    const sample = Math.max(-1, Math.min(1, Number(rawSample))); // Ensure number and clamp
    if (Math.abs(Number(rawSample)) > 1) clippedSamples++;
    
    view.setInt16(offset, Math.round(sample * 0x7FFF), true);
    offset += 2;
  }
  
  // Debug log for WAV encoding issues
  if (clippedSamples > 0) {
    console.log(`⚠️ WAV Encoder: Clipped ${clippedSamples} samples that were > ±1.0`);
  }
  console.log(`📦 WAV Encoder: Generated ${length} samples at ${sampleRate}Hz (${(length/sampleRate).toFixed(2)}s)`);
  console.log(`📦 WAV Encoder: File size ${(44 + length * 2)} bytes`);
  console.log(`📦 WAV Encoder: Sample range check:`, {
    first10: Array.from(samples.slice(0, 10)).map(s => Number(s).toFixed(6)),
    hasValidSamples: Array.from(samples.slice(0, 100)).some(s => Math.abs(Number(s)) > 0.001)
  });

  return new Blob([buffer], { type: 'audio/wav' });
}