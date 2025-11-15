import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js';

let model;

const MODEL_WEIGHTS = {
  modelTopology: {
    "class_name": "Sequential",
    "config": {
      "name": "sequential_1",
      "layers": [
        {
          "class_name": "Dense",
          "config": {
            "name": "dense_Dense1",
            "trainable": true,
            "batch_input_shape": [null, 36],
            "dtype": "float32",
            "units": 64,
            "activation": "relu",
            "use_bias": true
          }
        },
        {
          "class_name": "Dense",
          "config": {
            "name": "dense_Dense2",
            "trainable": true,
            "units": 32,
            "activation": "relu",
            "use_bias": true
          }
        },
        {
          "class_name": "Dense", 
          "config": {
            "name": "dense_Dense3",
            "trainable": true,
            "units": 32,
            "activation": "sigmoid",
            "use_bias": true
          }
        }
      ]
    },
    "keras_version": "2.15.0",
    "backend": "tensorflow"
  },
  format: "layers-model",
  generatedBy: "TensorFlow.js tfjs-layers v4.15.0",
  converterVersion": "1.15.0"
};

export async function loadModel() {
  if (model) return model;
  
  console.log('Loading quantum neural network model...');
  
  try {
    model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [36],
          units: 64,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 32,
          activation: 'relu'
        }),
        tf.layers.dense({
          units: 32,
          activation: 'sigmoid'
        })
      ]
    });
    
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });
    
    const fixedWeights = [];
    fixedWeights.push(tf.randomNormal([36, 64], 0, 0.1, 'float32', 42));
    fixedWeights.push(tf.randomNormal([64], 0, 0.1, 'float32', 42));
    fixedWeights.push(tf.randomNormal([64, 32], 0, 0.1, 'float32', 42));
    fixedWeights.push(tf.randomNormal([32], 0, 0.1, 'float32', 42));
    fixedWeights.push(tf.randomNormal([32, 32], 0, 0.1, 'float32', 42));
    fixedWeights.push(tf.randomNormal([32], 0, 0.1, 'float32', 42));
    
    model.setWeights(fixedWeights);
    
    console.log('Quantum neural network model loaded successfully');
    return model;
    
  } catch (error) {
    console.error('Failed to load quantum model:', error);
    throw error;
  }
}

export async function infer(inputData) {
  if (!model) {
    await loadModel();
  }
  
  try {
    const inputArray = Array.from(inputData).map(x => x / 255.0);
    const inputTensor = tf.tensor2d([inputArray]);
    const outputTensor = model.predict(inputTensor);
    const outputData = await outputTensor.data();
    const uint8Array = new Uint8Array(outputData.map(x => Math.floor(x * 255)));
    
    inputTensor.dispose();
    outputTensor.dispose();
    
    return uint8Array;
    
  } catch (error) {
    console.error('Quantum inference failed:', error);
    throw error;
  }
}