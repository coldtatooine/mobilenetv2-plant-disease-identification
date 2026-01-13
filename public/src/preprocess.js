/**
 * Pré-processamento de imagens para o modelo
 */

// TensorFlow.js será carregado globalmente via CDN
const tf = window.tf;

// Valores de normalização ImageNet (usados no treinamento)
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

/**
 * Pré-processa uma imagem para o modelo MobileNetV2
 * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} imageElement - Elemento de imagem
 * @param {number} targetSize - Tamanho alvo (padrão 224)
 * @returns {tf.Tensor4D} Tensor pré-processado [1, 224, 224, 3]
 */
export function preprocessImage(imageElement, targetSize = 224) {
  return tf.tidy(() => {
    // Converter para tensor [height, width, 3]
    let tensor = tf.browser.fromPixels(imageElement);
    
    // Redimensionar para 224x224
    tensor = tf.image.resizeBilinear(tensor, [targetSize, targetSize]);
    
    // Converter para float32 e normalizar para [0, 1]
    tensor = tf.cast(tensor, 'float32').div(255.0);
    
    // Normalizar com mean e std do ImageNet
    const mean = tf.tensor1d(IMAGENET_MEAN);
    const std = tf.tensor1d(IMAGENET_STD);
    
    // Subtrair mean e dividir por std para cada canal
    tensor = tensor.sub(mean).div(std);
    
    // Adicionar dimensão de batch: [1, 224, 224, 3]
    tensor = tensor.expandDims(0);
    
    return tensor;
  });
}

/**
 * Pré-processa um canvas diretamente
 * @param {HTMLCanvasElement} canvas - Canvas com imagem
 * @param {number} targetSize - Tamanho alvo
 * @returns {tf.Tensor4D}
 */
export function preprocessCanvas(canvas, targetSize = 224) {
  return preprocessImage(canvas, targetSize);
}

/**
 * Pré-processa um frame de vídeo
 * @param {HTMLVideoElement} video - Elemento de vídeo
 * @param {number} targetSize - Tamanho alvo
 * @returns {tf.Tensor4D}
 */
export function preprocessVideoFrame(video, targetSize = 224) {
  return preprocessImage(video, targetSize);
}
