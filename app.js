import { setSeed, nextPad, cryptoReady } from './crypto.js';
import { generateQR, startScan } from './qr.js';

const chatDiv = document.getElementById('chat');
const pairingDiv = document.getElementById('pairing');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const twinStatus = document.getElementById('twinStatus');

// Quantum particle system
function createQuantumParticles() {
  const container = document.getElementById('particle-container');
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + 'vw';
      particle.style.top = '100vh';
      particle.style.animation = `particle-float ${2 + Math.random() * 3}s ease-in-out forwards`;
      container.appendChild(particle);
      
      setTimeout(() => particle.remove(), 5000);
    }, i * 150);
  }
}

// Initialize app with quantum theme
async function initApp() {
  try {
    loadingDiv.style.display = 'block';
    twinStatus.textContent = 'Initializing...';
    createQuantumParticles();
    
    console.log('🧠 Initializing Quantum AI Neural Network...');
    await cryptoReady();
    
    loadingDiv.style.display = 'none';
    twinStatus.textContent = 'Ready for Entanglement';
    console.log('⚛️ Quantum AI ready for entanglement');
    
    // Continuous particle effects
    setInterval(createQuantumParticles, 4000);
    
  } catch (error) {
    loadingDiv.style.display = 'none';
    showError(`Quantum collapse: ${error.message}`);
    console.error('Entanglement failure:', error);
  }
}

function showError(message) {
  errorDiv.textContent = `⚡ ${message}`;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  document.getElementById('log').textContent = message;
  createQuantumParticles();
}

function updateEntanglementStatus(entangled) {
  if (entangled) {
    twinStatus.textContent = '⚡ ENTANGLED';
    twinStatus.style.color = '#00ff00';
    createQuantumParticles();
  } else {
    twinStatus.textContent = 'Disentangled';
    twinStatus.style.color = '#ff4444';
  }
}

document.getElementById('genBtn').onclick = async () => {
  try {
    twinStatus.textContent = 'Creating entanglement...';
    const seed = crypto.getRandomValues(new Uint8Array(32));
    await setSeed(seed);
    const seedBase64 = btoa(String.fromCharCode(...seed));
    await generateQR(seedBase64);
    
    pairingDiv.hidden = true; 
    chatDiv.hidden = false;
    updateEntanglementStatus(true);
    showSuccess('🌌 Quantum entanglement established!\n\nYour AI twin now exists elsewhere in the universe.\nAny message you encrypt will instantly decrypt on the entangled device.');
    
  } catch (error) {
    showError(`Entanglement failed: ${error.message}`);
    updateEntanglementStatus(false);
  }
};

document.getElementById('scanBtn').onclick = async () => {
  try {
    twinStatus.textContent = 'Scanning for entanglement...';
    await startScan(async (raw) => {
      try {
        const seed = new Uint8Array([...atob(raw)].map(c => c.charCodeAt(0)));
        await setSeed(seed);
        pairingDiv.hidden = true; 
        chatDiv.hidden = false;
        updateEntanglementStatus(true);
        showSuccess('🔗 Quantum entanglement achieved!\n\nYou are now the twin AI. Any message from your entangled pair will decrypt instantly.');
      } catch (error) {
        showError(`Entanglement mismatch: ${error.message}`);
        updateEntanglementStatus(false);
      }
    });
  } catch (error) {
    showError(`Quantum observation failed: ${error.message}`);
    updateEntanglementStatus(false);
  }
};

document.getElementById('sendBtn').onclick = async () => {
  try {
    const message = document.getElementById('txt').value;
    if (!message.trim()) {
      showError('Message waveform is empty');
      return;
    }
    
    twinStatus.textContent = 'Collapsing wavefunction...';
    const txt = new TextEncoder().encode(message);
    const pad = await nextPad(txt.length);
    const cip = txt.map((b, i) => b ^ pad[i]);
    const ciphertext = btoa(String.fromCharCode(...cip));
    
    await navigator.clipboard.writeText(ciphertext);
    showSuccess(`🌠 Message teleported (copied to clipboard):\n${ciphertext}\n\n📡 This ciphertext will instantly decrypt on your entangled AI twin anywhere in the universe.`);
    document.getElementById('txt').value = '';
    twinStatus.textContent = '⚡ ENTANGLED';
    createQuantumParticles();
    
  } catch (error) {
    showError(`Wavefunction collapse failed: ${error.message}`);
  }
};

document.getElementById('decBtn').onclick = async () => {
  try {
    const ciphertext = prompt('🔍 Paste the quantum-encrypted message (base64):');
    if (!ciphertext) return;
    
    twinStatus.textContent = 'Observing quantum state...';
    const cip = new Uint8Array([...atob(ciphertext)].map(c => c.charCodeAt(0)));
    const pad = await nextPad(cip.length);
    const txt = cip.map((b, i) => b ^ pad[i]);
    const message = new TextDecoder().decode(txt);
    
    showSuccess(`📡 Message received from entangled twin:\n\n"${message}"\n\n⚛️ This message appeared instantly through quantum entanglement.`);
    twinStatus.textContent = '⚡ ENTANGLED';
    createQuantumParticles();
    
  } catch (error) {
    showError(`Quantum observation failed: ${error.message}`);
  }
};

initApp();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(registration => console.log('⚛️ Quantum service worker registered'))
    .catch(error => console.log('❌ Quantum service registration failed'));
}