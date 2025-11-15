import { loadTwin, infer } from './twinnet.js';

let TWIN_SEED;
let COUNTER = 0;
let isModelLoaded = false;

// Fast seed setting without model preload
export async function setSeed(seedBytes) {
    if (!seedBytes || seedBytes.length < 16) {
        throw new Error('Seed must be at least 16 bytes');
    }
    
    try {
        const hash = await crypto.subtle.digest('SHA-256', seedBytes);
        TWIN_SEED = new Uint8Array(hash);
        COUNTER = 0;
        console.log('Seed set, counter reset to 0');
        
        // Preload model in background after seed is set
        loadTwin().then(() => {
            isModelLoaded = true;
            console.log('Model loaded in background');
        }).catch(err => {
            console.error('Background model load failed:', err);
        });
        
    } catch (error) {
        console.error('Seed setting failed:', error);
        throw new Error('Failed to set seed');
    }
}

// Optimized pad generation
export async function nextPad(len = 32) {
    if (!TWIN_SEED) throw new Error('Entangle first - no seed set');
    
    try {
        // Load model if not already loaded
        if (!isModelLoaded) {
            await loadTwin();
            isModelLoaded = true;
        }
        
        // Create input: seed + counter
        const input = new Uint8Array(33);
        input.set(TWIN_SEED, 0);
        input[32] = COUNTER;
        
        // Generate raw output from neural network
        const raw = infer(Array.from(input));
        
        // Increment counter
        COUNTER = (COUNTER + 1) % 256;
        
        // Convert to bytes (0-255)
        const pad = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            let value = Math.floor((raw[i % raw.length] + 1) * 127.5);
            pad[i] = Math.max(0, Math.min(255, value));
        }
        
        return pad;
        
    } catch (error) {
        console.error('Pad generation failed:', error);
        throw new Error('Failed to generate pad: ' + error.message);
    }
}

// Rest of crypto functions remain the same...
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
    
    const encrypted = new Uint8Array(msgBytes.length);
    for (let i = 0; i < msgBytes.length; i++) {
        encrypted[i] = msgBytes[i] ^ pad[i];
    }
    
    return btoa(String.fromCharCode(...encrypted));
}

export function decrypt(encryptedB64, pad) {
    if (!encryptedB64 || typeof encryptedB64 !== 'string') {
        throw new Error('Encrypted data must be a non-empty string');
    }
    if (!pad || !(pad instanceof Uint8Array)) {
        throw new Error('Pad must be a Uint8Array');
    }
    
    const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    
    if (encrypted.length > pad.length) {
        throw new Error(`Pad too short: need ${encrypted.length} bytes, have ${pad.length}`);
    }
    
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ pad[i];
    }
    
    return new TextDecoder().decode(decrypted);
}

// Utility functions
export function getCryptoState() {
    return {
        hasSeed: !!TWIN_SEED,
        isModelLoaded,
        counter: COUNTER
    };
                                     }
