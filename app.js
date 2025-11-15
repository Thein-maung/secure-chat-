import { setSeed } from './crypto.js';
import { generateQR, startScan } from './qr.js';

let currentSeed = crypto.getRandomValues(new Uint8Array(32));
let isEntangled = false;
let isInitialized = false;

const status = document.getElementById('status');
const qrcvs = document.getElementById('qrcvs');
const output = document.getElementById('output');
const scanBtn = document.getElementById('scan');
const regenSeedBtn = document.getElementById('regen-seed');
const textBtn = document.getElementById('text-chat');
const voiceBtn = document.getElementById('voice-chat');

// Preload TensorFlow.js in background
async function preloadTensorFlow() {
    try {
        // Load TensorFlow.js quietly in background
        await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.21.0/dist/tf.min.js');
        console.log('TensorFlow.js preloaded');
        return true;
    } catch (error) {
        console.error('TensorFlow preload failed:', error);
        return false;
    }
}

// Enhanced QR generation with error handling
async function showQR() {
    try {
        const seedB64 = btoa(String.fromCharCode(...currentSeed));
        await QRCode.toCanvas(qrcvs, seedB64, { 
            width: 200, // Smaller for faster rendering
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        qrcvs.hidden = false;
    } catch (error) {
        console.error('QR generation failed:', error);
        status.textContent = '❌ QR generation failed';
        status.style.color = 'red';
    }
}

// Improved initialization with progress updates
async function initializeApp() {
    try {
        status.textContent = '🔄 Loading quantum network...';
        
        // Show QR immediately without waiting for TensorFlow
        await showQR();
        
        // Start TensorFlow preload in background
        const tfPromise = preloadTensorFlow();
        
        status.textContent = '📱 Ready - Scan or show QR';
        status.style.color = 'blue';
        output.textContent = 'Share your QR or scan your partner\'s';
        
        // Mark as initialized
        isInitialized = true;
        
        // Check TensorFlow status in background
        tfPromise.then(success => {
            if (success) {
                console.log('AI network ready');
            } else {
                console.warn('AI network loading failed, will load on demand');
            }
        });
        
    } catch (error) {
        console.error('App initialization failed:', error);
        status.textContent = '⚠️ Basic features ready';
        status.style.color = 'orange';
        output.textContent = 'Advanced features loading...';
        isInitialized = true;
    }
}

// Enhanced scanning with better UX
scanBtn.onclick = () => {
    if (!isInitialized) {
        showAlert('App still initializing, please wait...');
        return;
    }
    
    status.textContent = '📷 Scanning...';
    status.style.color = 'blue';
    
    startScan(async data => {
        try {
            status.textContent = '🔐 Processing entanglement...';
            
            const bin = Uint8Array.from(atob(data), c => c.charCodeAt(0));
            
            if (bin.length !== 32) {
                throw new Error('Invalid seed length');
            }
            
            // Validate seed content
            if (bin.every(byte => byte === 0)) {
                throw new Error('Invalid seed (all zeros)');
            }
            
            status.textContent = '🤖 Loading AI crypto...';
            
            currentSeed = bin;
            await setSeed(bin);
            isEntangled = true;
            
            status.textContent = '✅ Entangled!';
            status.style.color = 'green';
            output.textContent = 'Paired – Start chatting!';
            
            // Update QR to show we're now paired
            await showQR();
            
            // Enable navigation immediately
            enableNavigation(true);
            
        } catch (error) {
            console.error('Scanning failed:', error);
            status.textContent = `❌ ${error.message}`;
            status.style.color = 'red';
            output.textContent = 'Please try scanning again';
        }
    }, error => {
        // Handle scanner errors
        console.error('Scanner error:', error);
        status.textContent = '❌ Scanner failed';
        status.style.color = 'red';
    });
};

// Seed regeneration
regenSeedBtn.onclick = () => {
    currentSeed = crypto.getRandomValues(new Uint8Array(32));
    isEntangled = false;
    enableNavigation(false);
    status.textContent = '🔄 New seed generated';
    status.style.color = 'blue';
    output.textContent = 'Scan or show the new QR code';
    showQR();
};

// Better navigation handling
function enableNavigation(enabled) {
    textBtn.disabled = !enabled;
    voiceBtn.disabled = !enabled;
    
    if (enabled) {
        textBtn.style.opacity = '1';
        voiceBtn.style.opacity = '1';
    } else {
        textBtn.style.opacity = '0.5';
        voiceBtn.style.opacity = '0.5';
    }
}

// Initialize navigation state
enableNavigation(false);

textBtn.onclick = () => {
    if (!isEntangled) {
        showAlert('Please entangle first by scanning a QR code!');
        return;
    }
    location.href = 'chat.html';
};

voiceBtn.onclick = () => {
    if (!isEntangled) {
        showAlert('Please entangle first by scanning a QR code!');
        return;
    }
    location.href = 'voice.html';
};

// Alert utility function
function showAlert(message) {
    // Use a better alert system or keep simple
    alert(message);
}

// Start initialization when page loads
window.addEventListener('load', initializeApp);

// Export state for debugging
window.getAppState = () => ({
    isEntangled,
    isInitialized,
    seedLength: currentSeed.length,
    seedPreview: Array.from(currentSeed.slice(0, 4))
});

// Service worker registration (non-blocking)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Don't wait for service worker
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
