/**
 * Controle de câmera e captura de frames
 */

let currentStream = null;

/**
 * Inicializa a câmera do dispositivo
 * @param {HTMLVideoElement} videoElement - Elemento de vídeo
 * @param {Object} constraints - Constraints da câmera (opcional)
 * @returns {Promise<MediaStream>}
 */
export async function initCamera(
  videoElement, 
  constraints = { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } }
) {
  try {
    // Parar stream anterior se existir
    if (currentStream) {
      stopCamera();
    }
    
    console.log('Solicitando acesso à câmera...');
    
    // Solicitar acesso à câmera
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Atribuir stream ao elemento de vídeo
    videoElement.srcObject = stream;
    currentStream = stream;
    
    // Aguardar metadata do vídeo carregar
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });
    
    console.log('Câmera inicializada com sucesso!');
    console.log(`Resolução: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
    
    return stream;
    
  } catch (error) {
    console.error('Erro ao acessar câmera:', error);
    
    let errorMessage = 'Erro ao acessar câmera';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Câmera está sendo usada por outro aplicativo.';
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Para a câmera e libera o stream
 */
export function stopCamera() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => {
      track.stop();
    });
    currentStream = null;
    console.log('Câmera parada');
  }
}

/**
 * Captura um frame do vídeo para um canvas
 * @param {HTMLVideoElement} videoElement - Elemento de vídeo
 * @param {HTMLCanvasElement} canvasElement - Canvas de destino
 * @param {number} width - Largura desejada (opcional)
 * @param {number} height - Altura desejada (opcional)
 * @returns {HTMLCanvasElement} Canvas com frame capturado
 */
export function captureFrame(videoElement, canvasElement, width = 224, height = 224) {
  const ctx = canvasElement.getContext('2d');
  
  // Definir dimensões do canvas
  canvasElement.width = width;
  canvasElement.height = height;
  
  // Desenhar frame do vídeo no canvas
  ctx.drawImage(videoElement, 0, 0, width, height);
  
  return canvasElement;
}

/**
 * Verifica se a câmera está disponível
 * @returns {boolean}
 */
export function isCameraAvailable() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Obtém lista de dispositivos de câmera disponíveis
 * @returns {Promise<MediaDeviceInfo[]>}
 */
export async function getCameraDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Erro ao listar dispositivos:', error);
    return [];
  }
}

/**
 * Alterna entre câmera frontal e traseira
 * @param {HTMLVideoElement} videoElement - Elemento de vídeo
 * @returns {Promise<MediaStream>}
 */
export async function switchCamera(videoElement) {
  stopCamera();
  
  // Determinar facingMode oposto
  const currentFacingMode = currentStream?.getVideoTracks()[0]?.getSettings()?.facingMode;
  const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
  
  return initCamera(videoElement, {
    video: { 
      facingMode: newFacingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });
}
