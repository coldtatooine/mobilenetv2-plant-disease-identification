/**
 * Carregamento do modelo TensorFlow.js
 */

// TensorFlow.js carregado via CDN (disponível globalmente como window.tf)
const tf = window.tf;

/**
 * Carrega o modelo TensorFlow.js Graph Model
 * @param {string} modelPath - Caminho para o model.json
 * @param {Function} onProgress - Callback de progresso (opcional)
 * @returns {Promise<tf.GraphModel>} Modelo carregado
 */
export async function loadModel(modelPath = '/web_model_tfjs/model.json', onProgress = null) {
  try {
    console.log('Carregando modelo TensorFlow.js...');
    
    // Callback de progresso se fornecido
    const progressCallback = onProgress ? (fraction) => {
      if (onProgress) {
        onProgress(Math.round(fraction * 100));
      }
    } : undefined;
    
    // Carregar modelo
    const model = await tf.loadGraphModel(modelPath, {
      onProgress: progressCallback
    });
    
    console.log('Modelo carregado com sucesso!');
    console.log('Input shape:', model.inputs[0].shape);
    console.log('Output shape:', model.outputs[0].shape);
    
    // Warmup do modelo (primeira inferência é mais lenta)
    console.log('Executando warmup...');
    const warmupInput = tf.zeros([1, 224, 224, 3]);
    await model.predict(warmupInput);
    warmupInput.dispose();
    console.log('Warmup concluído!');
    
    return model;
    
  } catch (error) {
    console.error('Erro ao carregar modelo:', error);
    throw new Error(`Falha ao carregar modelo: ${error.message}`);
  }
}

/**
 * Verifica se o modelo está carregado e válido
 * @param {tf.GraphModel} model - Modelo a verificar
 * @returns {boolean}
 */
export function isModelLoaded(model) {
  return model != null && model.inputs && model.inputs.length > 0;
}
