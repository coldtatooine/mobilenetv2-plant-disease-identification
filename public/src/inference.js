/**
 * Lógica de inferência e mapeamento de classes
 */

// TensorFlow.js será carregado globalmente via CDN
const tf = window.tf;

let classNames = null;

/**
 * Carrega os nomes das classes do JSON
 * @param {string} classNamesPath - Caminho para class_names.json
 * @returns {Promise<string[]>}
 */
export async function loadClassNames(classNamesPath = '/class_names.json') {
  if (classNames) {
    return classNames;
  }
  
  try {
    const response = await fetch(classNamesPath);
    classNames = await response.json();
    console.log(`Carregadas ${classNames.length} classes`);
    return classNames;
  } catch (error) {
    console.error('Erro ao carregar class_names.json:', error);
    throw new Error('Falha ao carregar nomes das classes');
  }
}

/**
 * Executa predição no modelo
 * @param {tf.GraphModel} model - Modelo TensorFlow.js
 * @param {tf.Tensor4D} preprocessedTensor - Tensor pré-processado
 * @returns {Promise<{index: number, className: string, confidence: number, allProbabilities: Float32Array}>}
 */
export async function predict(model, preprocessedTensor) {
  return tf.tidy(() => {
    // Executar inferência
    const logits = model.predict(preprocessedTensor);
    
    // Aplicar softmax para obter probabilidades
    const probabilities = tf.softmax(logits);
    
    // Obter dados do tensor
    const probData = probabilities.dataSync();
    
    // Encontrar índice da classe com maior probabilidade
    let maxIndex = 0;
    let maxProb = probData[0];
    
    for (let i = 1; i < probData.length; i++) {
      if (probData[i] > maxProb) {
        maxProb = probData[i];
        maxIndex = i;
      }
    }
    
    // Mapear índice para nome da classe
    const className = classNames && classNames[maxIndex] 
      ? classNames[maxIndex] 
      : `Classe ${maxIndex}`;
    
    // Limpar tensores
    logits.dispose();
    probabilities.dispose();
    
    return {
      index: maxIndex,
      className: className,
      confidence: maxProb,
      allProbabilities: probData
    };
  });
}

/**
 * Formata o nome da classe para exibição
 * @param {string} className - Nome da classe (ex: "Apple___Apple_scab")
 * @returns {Object} Objeto com planta e doença formatados
 */
export function formatClassName(className) {
  if (!className || !className.includes('___')) {
    return {
      plant: 'Desconhecido',
      disease: 'Desconhecido',
      display: className || 'Desconhecido'
    };
  }
  
  const [plant, disease] = className.split('___');
  
  // Formatar nome da planta
  const formattedPlant = plant
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  // Formatar doença
  const formattedDisease = disease
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  // Determinar se é saudável
  const isHealthy = disease.toLowerCase() === 'healthy';
  
  return {
    plant: formattedPlant,
    disease: formattedDisease,
    isHealthy: isHealthy,
    display: isHealthy 
      ? `${formattedPlant} - Saudável` 
      : `${formattedPlant} - ${formattedDisease}`
  };
}

/**
 * Obtém top K predições
 * @param {Float32Array} probabilities - Array de probabilidades
 * @param {number} k - Número de top predições
 * @returns {Array<{index: number, className: string, confidence: number}>}
 */
export function getTopKPredictions(probabilities, k = 5) {
  if (!classNames) {
    return [];
  }
  
  // Criar array de índices com probabilidades
  const indexed = probabilities.map((prob, index) => ({
    index,
    className: classNames[index] || `Classe ${index}`,
    confidence: prob
  }));
  
  // Ordenar por probabilidade (decrescente)
  indexed.sort((a, b) => b.confidence - a.confidence);
  
  // Retornar top K
  return indexed.slice(0, k);
}
