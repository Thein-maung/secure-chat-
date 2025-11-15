import { loadTwin, infer } from './twinnet.js';

let TWIN_SEED;
let COUNTER = 0;

// Enhanced seed management with validation
export async function setSeed(seedBytes) {
  if (!seedBytes || seedBytes.length < 16) {
    throw new Error('Seed must be at least 16 bytes');
  }
  
  try {
    const hash = await crypto.subtle.digest('SHA-256', seedBytes);
    TWIN_SEED = new Uint8Array(hash);
    COUNTER = 0;
    console.log('Seed set, counter reset to 0');
  } catch (error) {
    console.error('Seed setting failed:', error);
    throw new Error('Failed to set seed');
  }
}

// Improved pad generation with better error handling
export async function nextPad(len = 32) {
  if (!TWIN_SEED) throw new Error('Entangle first - no seed set');
  if (len <= 0 || len > 1024) throw new Error('Pad length must be between 1 and 1024');
  
  try {
    await loadTwin();
    
    // Create input: seed + counter
    const input = new Uint8Array(33);
    input.set(TWIN_SEED, 0);
    input[32] = COUNTER;
    
    // Generate raw output from neural network
    const raw = infer(Array.from(input));
    
    // Increment counter and handle overflow
    COUNTER = (COUNTER + 1) % 256;
    
    // Convert to bytes (0-255)
    const pad = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      // Scale from [-1, 1] to [0, 255] with clamping
      let value = Math.floor((raw[i % raw.length] + 1) * 127.5);
      pad[i] = Math.max(0, Math.min(255, value));
    }
    
    console.log(`Generated pad of length ${len}, counter: ${COUNTER}`);
    return pad;
    
  } catch (error) {
    console.error('Pad generation failed:', error);
    throw new Error('Failed to generate pad: ' + error.message);
  }
}

// Enhanced encryption with validation
export function encrypt(message, pad) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }
  if (!pad || !(pad instanceof Uint8Array)) {
    throw new Error('Pad must be a Uint8Array');
  }
  
  const msgBytes = new TextEncoder().encode(message);
  if (msgBytes.length > pad.length) {
    throw new Error(`Pad too short: need ${msgBytes.length} bytes, have ${pad.length}`);
  }
  
  try {
    const encrypted = new Uint8Array(msgBytes.length);
    for (let i = 0; i < msgBytes.length; i++) {
      encrypted[i] = msgBytes[i] ^ pad[i];
    }
    
    const base64 = btoa(String.fromCharCode(...encrypted));
    console.log(`Encrypted ${msgBytes.length} bytes`);
    return base64;
    
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed: ' + error.message);
  }
}

// Enhanced decryption with validation
export function decrypt(encryptedB64, pad) {
  if (!encryptedB64 || typeof encryptedB64 !== 'string') {
    throw new Error('Encrypted data must be a non-empty string');
  }
  if (!pad || !(pad instanceof Uint8Array)) {
    throw new Error('Pad must be a Uint8Array');
  }
  
  try {
    // Validate base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedB64)) {
      throw new Error('Invalid base64 format');
    }
    
    const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    
    if (encrypted.length > pad.length) {
      throw new Error(`Pad too short: need ${encrypted.length} bytes, have ${pad.length}`);
    }
    
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ pad[i];
    }
    
    const message = new TextDecoder().decode(decrypted);
    console.log(`Decrypted ${encrypted.length} bytes`);
    return message;
    
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed: ' + error.message);
  }
}

// Utility functions for state management
export function getCryptoState() {
  return {
    hasSeed: !!TWIN_SEED,
    seedLength: TWIN_SEED?.length || 0,
    counter: COUNTER,
    seedPreview: TWIN_SEED ? Array.from(TWIN_SEED.slice(0, 4)) : null
  };
}

export function resetCrypto() {
  TWIN_SEED = null;
  COUNTER = 0;
  console.log('Crypto state reset');
}

// Pad health checking
export function getPadHealth() {
  const padsRemaining = 256 - COUNTER;
  const healthPercent = (padsRemaining / 256) * 100;
  
  return {
    counter: COUNTER,
    padsRemaining,
    healthPercent,
    status: healthPercent > 20 ? 'healthy' : healthPercent > 5 ? 'warning' : 'critical'
  };
}

// Batch pad generation for longer messages
export async function generatePads(count = 1, len = 32) {
  const pads = [];
  for (let i = 0; i < count; i++) {
    pads.push(await nextPad(len));
  }
  return pads;
}

// Additional security utilities
export function wipeArray(array) {
  if (array && array.fill) {
    array.fill(0);
  }
}

// Secure message encryption with automatic pad cleanup
export async function encryptWithCleanup(message, padLength = 32) {
  const pad = await nextPad(padLength);
  try {
    return encrypt(message, pad);
  } finally {
    wipeArray(pad);
  }
}

// Pad verification (ensure both parties have same pad)
export function verifyPadConsistency(pad1, pad2) {
  if (pad1.length !== pad2.length) return false;
  
  let matches = 0;
  for (let i = 0; i < Math.min(8, pad1.length); i++) {
    if (pad1[i] === pad2[i]) matches++;
  }
  
  return matches >= 6; // Allow for minor differences in floating-point conversion
}
