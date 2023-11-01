
// const onnx = require("onnxruntime-node");

const imageInput = document.getElementById('imageInput');
const processButton = document.getElementById('processButton');
const uploadedImage = document.getElementById('uploadedImage');
const fileInputLabel = document.querySelector('.custom-file-input-label');



// const { InferenceSession, Tensor, onnx } = require('onnxruntime-web');

// const model = new ort.InferenceSession();
// model.loadModel('../mobilenet.onnx');


imageInput.addEventListener('change', async () => {
  const selectedFile = imageInput.files[0];
  if (selectedFile) {
    displayImage(selectedFile);
    fileInputLabel.style.display = 'none';
    
    const image = new Image();
    image.src = URL.createObjectURL(selectedFile);

    image.onload = async () => {
      const session = await ort.InferenceSession.create('../model/mobilenet.onnx');

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(image, 0, 0, 224, 224);
      const imageData = ctx.getImageData(0, 0,224, 224).data;

      // Convert image data to a Float32Array
      // const inputArray = new Float32Array(imageData);
      console.log(image.height);
      console.log(image.width);
      const inputArray = new Float32Array(3 * 224 * 224); 
      const inputTensor = new ort.Tensor('float32', inputArray, [1, 3, 224, 224]);

      for (let i = 0; i < 224 * 224; i++) {
        inputArray[i] = imageData[i * 4] / 255; // Red channel
        inputArray[i + 224 * 224] = imageData[i * 4 + 1] / 255; // Green channel
        inputArray[i + 2 * 224 * 224] = imageData[i * 4 + 2] / 255; // Blue channel
      }


      const feeds = { data: inputTensor };
      // Run inference
      const output = await session.run(feeds);

      // Process the inference results
      console.log('Inference Results:', output);
      alert(output);

      const outputData = output.mobilenetv20_output_flatten0_reshape0.data; // Get the data from the output tensor

      
      // Find the index of the maximum value
      let maxIndex = 0;
      let maxValue = outputData[0];
      console.log(outputData);
      for (let i = 1; i < outputData.length; i++) {
        if (outputData[i] > maxValue) {
          maxValue = outputData[i];
          maxIndex = i;
        }
      }

      console.log('Index of the maximum value:', maxIndex);

     
      const labelsFileUrl = '../labels.txt';

      // Fetch the labels file
      fetch(labelsFileUrl)
        .then(response => response.text())
        .then(labelsData => {
          // Split the labels data into an array of labels
          const labels = labelsData.split('\n');
      
          // Check if maxIndex is within the valid range of labels
          if (maxIndex >= 0 && maxIndex < labels.length) {
            const predictedLabel = labels[maxIndex].split(" ").slice(1,).join(" ");

            const predictionBox = document.getElementById('predictionBox');
           const predictedLabelElement = document.getElementById('predictedLabel'); 
            predictedLabelElement.textContent = `Predicted Label: ${predictedLabel}`;

            console.log('Predicted Label:', predictedLabel);
          } else {
            console.log('Index out of range or labels file is missing.');
          }
        })
        .catch(error => {
          console.error('Error fetching labels:', error);
        });





      // Display or further process the results as needed
    };

  }
});


processButton.addEventListener('click', () => {
  const selectedFile = imageInput.files[0];
  if (selectedFile) {
    // Perform image processing here (you can use libraries like Fabric.js or HTML5 Canvas).
    // Once processing is done, display a string.
    
    const resultString = "Processing";
    
    
    console.log(resultString);
    alert(resultString); // You can display it in a more user-friendly way.

    
  
  }
});


function displayImage(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    uploadedImage.src = event.target.result;
    uploadedImage.style.display = 'block'; // Make the image visible
  };
  reader.readAsDataURL(file);
}