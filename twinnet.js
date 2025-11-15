import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.21.0/dist/tf.min.js';

let model;

const ENTANGLED_WEIGHTS = {
  'dense/kernel': tf.randomNormal([33, 64]).arraySync(),
  'dense/bias': tf.randomNormal([64]).arraySync(),
  'dense_1/kernel': tf.randomNormal([64, 32]).arraySync(),
  'dense_1/bias': tf.randomNormal([32]).arraySync()
};

export async function loadTwin() {
  if (model) return model;
  
  try {
    await tf.ready();
    
    // Validate ENTANGLED_WEIGHTS dimensions
    const inputDim = ENTANGLED_WEIGHTS['dense/kernel'].length;
    if (inputDim !== 33) {
      throw new Error(`Invalid weight dimensions: expected 33, got ${inputDim}`);
    }

    model = tf.sequential({
      layers: [
        tf.layers.dense({ 
          units: 64, 
          activation: 'relu', 
          inputShape: [33],
          name: 'dense'
        }),
        tf.layers.dense({ 
          units: 32, 
          activation: 'tanh',
          name: 'dense_1'
        })
      ]
    });

    // More robust weight setting
    const weights = [
      tf.tensor2d(ENTANGLED_WEIGHTS['dense/kernel'], [33, 64]),
      tf.tensor1d(ENTANGLED_WEIGHTS['dense/bias']),
      tf.tensor2d(ENTANGLED_WEIGHTS['dense_1/kernel'], [64, 32]),
      tf.tensor1d(ENTANGLED_WEIGHTS['dense_1/bias'])
    ];
    
    model.setWeights(weights);
    console.log('TwinNet model loaded successfully');
    return model;
    
  } catch (error) {
    console.error('Failed to load TwinNet:', error);
    throw error;
  }
}

export function infer(seed) {
  if (!model) {
    throw new Error('Model not loaded. Call loadTwin() first.');
  }
  
  if (seed.length !== 33) {
    throw new Error(`Seed must be 33 elements, got ${seed.length}`);
  }

  // Use tf.tidy for automatic memory cleanup
  return tf.tidy(() => {
    const input = tf.tensor2d([seed.map(v => v / 255)], [1, 33]);
    const output = model.predict(input);
    return Array.from(output.dataSync());
  });
}

// Add model serialization for persistence
export function getModelWeights() {
  if (!model) return null;
  return model.getWeights().map(w => w.arraySync());
}

// Add seed validation and generation utilities
export function validateSeed(seed) {
  return Array.isArray(seed) && 
         seed.length === 33 && 
         seed.every(v => v >= 0 && v <= 255);
}

export function generateRandomSeed() {
  return Array.from({length: 33}, () => Math.floor(Math.random() * 256));
}
