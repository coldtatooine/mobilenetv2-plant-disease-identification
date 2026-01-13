#!/usr/bin/env python3
"""
Exporta modelo PyTorch MobileNetV2 para formato ONNX.
"""

import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path
import onnx
import onnxruntime as ort
import numpy as np

def create_model(num_classes=38):
    """Cria modelo MobileNetV2 com arquitetura customizada."""
    model = models.mobilenet_v2(weights=None)
    
    # Congelar feature extractor (como no treinamento)
    for p in model.features.parameters():
        p.requires_grad = False
    
    # Substituir classificador para 38 classes
    model.classifier[1] = nn.Sequential(
        nn.Dropout(0.2),
        nn.Linear(model.classifier[1].in_features, num_classes)
    )
    
    return model

def export_to_onnx(model_path, output_path, num_classes=38):
    """Exporta modelo PyTorch para ONNX."""
    print(f"Carregando modelo de {model_path}...")
    
    # Criar modelo
    model = create_model(num_classes)
    
    # Carregar pesos
    checkpoint = torch.load(model_path, map_location='cpu')
    
    # Tentar carregar state_dict diretamente ou extrair de checkpoint
    if isinstance(checkpoint, dict):
        if 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'])
        elif 'state_dict' in checkpoint:
            model.load_state_dict(checkpoint['state_dict'])
        else:
            model.load_state_dict(checkpoint)
    else:
        model.load_state_dict(checkpoint)
    
    model.eval()
    
    # Criar input dummy
    dummy_input = torch.randn(1, 3, 224, 224)
    
    print(f"Exportando para ONNX: {output_path}...")
    
    # Exportar para ONNX
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=13,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['logits'],
        dynamic_axes={
            'input': {0: 'batch'},
            'logits': {0: 'batch'}
        },
        verbose=False
    )
    
    print(f"Modelo ONNX exportado com sucesso!")
    
    # Validar ONNX
    print("Validando modelo ONNX...")
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    print("Validação ONNX passou!")
    
    # Testar inferência com ONNX Runtime
    print("Testando inferência com ONNX Runtime...")
    sess = ort.InferenceSession(str(output_path))
    
    input_name = sess.get_inputs()[0].name
    test_input = np.random.randn(1, 3, 224, 224).astype(np.float32)
    
    outputs = sess.run(None, {input_name: test_input})
    print(f"Output shape: {outputs[0].shape}")
    print(f"Output range: [{outputs[0].min():.4f}, {outputs[0].max():.4f}]")
    print("Teste de inferência ONNX passou!")

if __name__ == "__main__":
    # Caminhos
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    model_path = project_root / "mobilenetv2_plant.pth"
    output_path = project_root / "mobilenetv2_plant.onnx"
    
    if not model_path.exists():
        print(f"Erro: Arquivo {model_path} não encontrado!")
        exit(1)
    
    export_to_onnx(model_path, output_path)
    print(f"\nConversão concluída! Arquivo ONNX salvo em: {output_path}")
