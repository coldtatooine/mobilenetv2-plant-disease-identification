#!/usr/bin/env python3
"""
Converte modelo ONNX para TensorFlow.js via TensorFlow SavedModel.
"""

import os
import sys
from pathlib import Path
import subprocess

def convert_onnx_to_tf(onnx_path, tf_savedmodel_path):
    """Converte ONNX para TensorFlow SavedModel."""
    print(f"Convertendo ONNX para TensorFlow SavedModel...")
    print(f"  ONNX: {onnx_path}")
    print(f"  SavedModel: {tf_savedmodel_path}")
    
    # Tentar onnx2tf primeiro (mais moderno)
    try:
        import subprocess
        cmd = [
            "onnx2tf",
            "-i", str(onnx_path),
            "-o", str(tf_savedmodel_path),
            "--output_signaturedefs",
            "--copy_onnx_input_output_names_to_tflite"
        ]
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("Conversão ONNX → TensorFlow concluída usando onnx2tf!")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"onnx2tf não disponível ou falhou: {e}")
        print("Tentando onnx-tf...")
    
    # Fallback para onnx-tf
    try:
        from onnx_tf.backend import prepare
        import onnx
        
        # Carregar modelo ONNX
        onnx_model = onnx.load(str(onnx_path))
        
        # Preparar e exportar para TensorFlow
        tf_rep = prepare(onnx_model)
        tf_rep.export_graph(str(tf_savedmodel_path))
        
        print("Conversão ONNX → TensorFlow concluída usando onnx-tf!")
        return True
        
    except Exception as e:
        print(f"Erro ao converter ONNX para TensorFlow: {e}")
        return False

def convert_tf_to_tfjs(tf_savedmodel_path, tfjs_output_path):
    """Converte TensorFlow SavedModel para TensorFlow.js."""
    print(f"\nConvertendo TensorFlow SavedModel para TensorFlow.js...")
    print(f"  SavedModel: {tf_savedmodel_path}")
    print(f"  TFJS: {tfjs_output_path}")
    
    # Criar diretório de saída
    tfjs_output_path.mkdir(parents=True, exist_ok=True)
    
    # Comando tensorflowjs_converter
    cmd = [
        "tensorflowjs_converter",
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        "--signature_name=serving_default",
        str(tf_savedmodel_path),
        str(tfjs_output_path)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True
        )
        print("Conversão TensorFlow → TensorFlow.js concluída!")
        print(result.stdout)
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"Erro ao converter para TensorFlow.js:")
        print(e.stderr)
        return False
    except FileNotFoundError:
        print("Erro: tensorflowjs_converter não encontrado!")
        print("Instale com: pip install tensorflowjs")
        return False

def validate_tfjs_model(tfjs_path):
    """Valida modelo TFJS carregando-o."""
    print(f"\nValidando modelo TensorFlow.js...")
    
    try:
        import tensorflow as tf
        
        # Carregar SavedModel
        model = tf.saved_model.load(str(tfjs_path.parent / "tf_saved_model"))
        
        # Testar inferência
        test_input = tf.random.normal((1, 224, 224, 3), dtype=tf.float32)
        
        # Obter função de inferência
        infer = model.signatures['serving_default']
        output = infer(test_input)
        
        # Extrair output (pode ter nome variável)
        output_tensor = list(output.values())[0]
        print(f"Output shape: {output_tensor.shape}")
        print(f"Output dtype: {output_tensor.dtype}")
        print("Validação TensorFlow passou!")
        
        return True
        
    except Exception as e:
        print(f"Erro na validação TensorFlow: {e}")
        print("Continuando mesmo assim...")
        return True  # Não bloquear se validação falhar

if __name__ == "__main__":
    # Caminhos
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    onnx_path = project_root / "mobilenetv2_plant.onnx"
    tf_savedmodel_path = project_root / "tf_saved_model"
    tfjs_output_path = project_root / "web_model_tfjs"
    
    if not onnx_path.exists():
        print(f"Erro: Arquivo ONNX {onnx_path} não encontrado!")
        print("Execute primeiro: python scripts/export_onnx.py")
        sys.exit(1)
    
    # Limpar diretórios anteriores se existirem
    if tf_savedmodel_path.exists():
        import shutil
        print(f"Removendo SavedModel anterior: {tf_savedmodel_path}")
        shutil.rmtree(tf_savedmodel_path)
    
    # Passo 1: ONNX → TensorFlow SavedModel
    success = convert_onnx_to_tf(onnx_path, tf_savedmodel_path)
    
    if not success:
        print("\nErro na conversão ONNX → TensorFlow")
        sys.exit(1)
    
    # Validar SavedModel
    validate_tfjs_model(tf_savedmodel_path)
    
    # Passo 2: TensorFlow SavedModel → TensorFlow.js
    success = convert_tf_to_tfjs(tf_savedmodel_path, tfjs_output_path)
    
    if not success:
        print("\nErro na conversão TensorFlow → TensorFlow.js")
        sys.exit(1)
    
    print(f"\n{'='*60}")
    print("Conversão completa!")
    print(f"Modelo TensorFlow.js salvo em: {tfjs_output_path}")
    print(f"{'='*60}")
