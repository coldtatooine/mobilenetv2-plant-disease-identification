# Setup Guide - Plant Disease Detection

## Project Structure

```
plant-disease/
├── scripts/
│   ├── export_onnx.py          # Converts PyTorch → ONNX
│   ├── convert_tfjs.py          # Converts ONNX → TFJS
│   └── requirements.txt         # Python dependencies
├── public/
│   ├── index.html               # Main PWA
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service Worker
│   ├── class_names.json         # 38 class names
│   └── icons/                   # PWA icons
├── src/
│   ├── model-loader.js          # Model loading
│   ├── preprocess.js            # Preprocessing
│   ├── inference.js             # Inference
│   └── camera.js                # Camera control
├── web_model_tfjs/              # TFJS model (generated)
├── package.json                 # Node dependencies
└── mobilenetv2_plant.pth        # Original PyTorch model
```

## Step 1: Convert PyTorch Model to TensorFlow.js

### 1.1 Create Python Virtual Environment

```bash
cd "/Users/alessandro.lima/Documents/Tensor Flow/plant-disease"
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 1.2 Install Python Dependencies

```bash
pip install -r scripts/requirements.txt
```

### 1.3 Run Conversion

```bash
# Export to ONNX
python scripts/export_onnx.py

# Convert to TensorFlow.js
python scripts/convert_tfjs.py
```

Or use the npm script:

```bash
npm run convert
```

The converted model will be saved in `web_model_tfjs/`.

## Step 2: Install Node.js Dependencies

```bash
npm install
```

## Step 3: Generate PWA Icons (Optional)

Icons are required for the PWA to work completely. You can:

1. **Create manually**: Generate 192x192 and 512x512 icons and save them in `public/icons/`:
   - `icon-192.png`
   - `icon-512.png`

2. **Use online tools**: 
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/

## Step 4: Run Application

### Local Development

```bash
npm run serve
```

The application will be available at `http://localhost:8080`

### Important Notes

- **HTTPS required**: To access the camera, the application needs to run on HTTPS or localhost
- **Permissions**: The browser will request permission to access the camera
- **Model**: Make sure the model has been converted before using the application

## Features

### Manual Mode
1. Click "Start Camera"
2. Point the camera at a plant leaf
3. Click "Capture Photo"
4. View the detection result

### Continuous Mode
1. Start the camera
2. Enable "Continuous Mode"
3. Detection occurs automatically every 500ms

### Controls
- **Start Camera**: Activates video stream
- **Stop Camera**: Stops the stream
- **Capture Photo**: Executes a manual inference
- **Switch Camera**: Toggles between front and back camera
- **Continuous Mode**: Activates automatic detection

## Troubleshooting

### Error: "Model not found"
- Make sure to run the model conversion first
- Check if `web_model_tfjs/model.json` exists

### Error: "Camera not available"
- Check browser permissions
- Make sure you're on HTTPS or localhost
- Try another browser

### ONNX conversion error
- Check if all Python dependencies are installed
- Try using a different opset_version in the export_onnx.py script

### Slow performance
- Reduce throttle in code (INFERENCE_THROTTLE_MS)
- Use manual mode instead of continuous
- Test on a more powerful device

## Next Steps

After implementation, you can:
- Add detection history
- Save photos to IndexedDB
- Implement result sharing
- Add more disease classes
