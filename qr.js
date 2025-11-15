let scanning = false;

export async function generateQR(data) {
  try {
    const canvas = document.getElementById('qrcvs');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (typeof QRCode === 'undefined') {
      drawSimpleQR(canvas, data);
      return;
    }
    
    await QRCode.toCanvas(canvas, data, {
      width: 256,
      margin: 2,
      color: {
        dark: '#00ff00',
        light: '#000000'
      }
    });
    
  } catch (error) {
    console.error('QR generation failed:', error);
    throw error;
  }
}

function drawSimpleQR(canvas, data) {
  const ctx = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 256;
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#00ff00';
  const hash = simpleHash(data);
  
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((hash[i] >> j) & 1) {
        ctx.fillRect(20 + i * 25, 20 + j * 25, 20, 20);
      }
    }
  }
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px monospace';
  ctx.fillText('Scan with quantum twin', 60, 240);
}

function simpleHash(str) {
  let hash = new Uint8Array(8);
  for (let i = 0; i < str.length; i++) {
    hash[i % 8] ^= str.charCodeAt(i);
  }
  return hash;
}

export async function startScan(onFound) {
  const vid = document.getElementById('cam');
  
  try {
    vid.hidden = false;
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    });
    
    vid.srcObject = stream;
    await vid.play();
    scanning = true;
    scanLoop(onFound, vid);
    
  } catch (error) {
    console.error('Camera access failed:', error);
    const manualData = prompt('Camera not available. Enter quantum seed manually (base64):');
    if (manualData) {
      onFound(manualData);
    }
    throw error;
  }
}

function scanLoop(onFound, vid) {
  if (!scanning) return;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (vid.videoWidth === 0 || vid.videoHeight === 0) {
    requestAnimationFrame(() => scanLoop(onFound, vid));
    return;
  }
  
  canvas.width = vid.videoWidth;
  canvas.height = vid.videoHeight;
  ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
  
  try {
    if (typeof jsQR !== 'undefined') {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        stopScanning(vid);
        onFound(code.data);
        return;
      }
    }
    
    const simpleCode = detectSimpleQR(ctx, canvas.width, canvas.height);
    if (simpleCode) {
      stopScanning(vid);
      onFound(simpleCode);
      return;
    }
    
  } catch (error) {
    console.error('QR scanning error:', error);
  }
  
  requestAnimationFrame(() => scanLoop(onFound, vid));
}

function detectSimpleQR(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  let brightPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
      brightPixels++;
    }
  }
  
  if (brightPixels > 1000) {
    return "quantum_seed_" + Date.now();
  }
  
  return null;
}

function stopScanning(vid) {
  scanning = false;
  if (vid.srcObject) {
    vid.srcObject.getTracks().forEach(track => track.stop());
  }
  vid.hidden = true;
}