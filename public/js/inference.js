const onnx = require('onnxjs-node');
const fs = require('fs');
const path = require('path');
const { Image } = require('canvas');

// Load the ONNX model
const modelPath = path.join(__dirname, 'your_model.onnx');
const modelBuffer = fs.readFileSync(modelPath);
const session = new onnx.InferenceSession({ backendHint: 'webgl' });
session.loadModel(new onnx.InferenceModel(modelBuffer));

// Load an image (replace 'your_image.jpg' with your image file)
const image = new Image();
image.src = 'your_image.jpg'; // Replace with the path to your image

image.onload = async () => {
  const canvas = new Canvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, image.width, image.height);
  const inputTensor = new onnx.Tensor(
    new Float32Array(canvas.toBuffer('raw').slice(4)),
    'float32',
    [1, 3, image.height, image.width]
  );

  // Run inference
  const output = await session.run([inputTensor]);
  const predictions = output.map((tensor) => tensor.data);
  console.log('Inference Results:', predictions);

  // Further process the predictions as needed
};
