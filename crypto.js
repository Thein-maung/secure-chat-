import { loadModel, infer } from './twinnet.js';

const SEED_DB = 'quantum_entanglement';
let COUNTER = 0;
let QUANTUM_STATE;
let modelReady = false;

async function idbSet(dbName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([dbName], 'readwrite');
      const store = transaction.objectStore(dbName);
      const putRequest = store.put(data, 'quantum_state');
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(dbName)) {
        db.createObjectStore(dbName);
      }
    };
  });
}

async function idbGet(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([dbName], 'readonly');
      const store = transaction.objectStore(dbName);
      const getRequest = store.get('quantum_state');
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(dbName)) {
        db.createObjectStore(dbName);
      }
    };
  });
}

async function loadQuantumState() {
  try {
    const data = await idbGet(SEED_DB);
    if (data) {
      QUANTUM_STATE = new Uint8Array(data.quantumState);
      COUNTER = data.counter;
      console.log('🌌 Loaded quantum state from superposition, counter:', COUNTER);
    }
  } catch (error) {
    console.warn('Could not load quantum state:', error);
  }
}

export async function cryptoReady() {
  if (modelReady) return true;
  
  try {
    console.log('🧠 Loading Quantum AI Neural Network...');
    await loadModel();
    await loadQuantumState();
    modelReady = true;
    console.log('⚛️ Quantum AI ready for entanglement');
    return true;
  } catch (error) {
    console.error('Quantum initialization failed:', error);
    throw error;
  }
}

export async function setSeed(s) {
  QUANTUM_STATE = new Uint8Array(await crypto.subtle.digest('SHA-256', s));
  COUNTER = 0;
  await saveQuantumState();
  console.log('🔗 Quantum entanglement established with seed');
}

export async function nextPad(len) {
  if (!QUANTUM_STATE) {
    await loadQuantumState();
  }
  if (!QUANTUM_STATE) {
    throw new Error('Quantum state not entangled. Please establish entanglement first.');
  }

  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint32(0, COUNTER, true);
  const measurementBasis = new Uint8Array(buf);

  const quantumInput = new Uint8Array(36);
  quantumInput.set(QUANTUM_STATE, 0);
  quantumInput.set(measurementBasis, 32);

  console.log(`🌠 Collapsing wavefunction for measurement ${COUNTER}`);
  const raw = await infer(quantumInput);
  COUNTER++;
  await saveQuantumState();
  
  console.log(`📡 Generated quantum pad for measurement ${COUNTER - 1}`);
  return raw.slice(0, len);
}

async function saveQuantumState() {
  if (QUANTUM_STATE) {
    await idbSet(SEED_DB, { 
      quantumState: Array.from(QUANTUM_STATE),
      counter: COUNTER 
    });
  }
}