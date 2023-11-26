// DOM elements
const imageInput = document.getElementById('imageInput');
const processButton = document.getElementById('processButton');
const uploadedImage = document.getElementById('uploadedImage');
const fileInputLabel = document.querySelector('.custom-file-input-label');

// Event listeners
imageInput.addEventListener('change', handleImageInputChange);
processButton.addEventListener('click', handleProcessButtonClick);


// Attach event listener to the paste box
const pasteBox = document.getElementById('pasteBox');
pasteBox.addEventListener('click', () => {
  navigator.clipboard.read().then(async (clipboardItems) => {
    for (const item of clipboardItems) {
      if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
        const blob = await item.getType('image/png' || 'image/jpeg');
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          uploadedImage.src = url;
          uploadedImage.style.display = 'block';
     
        // Create a new File object for the pasted image
        const pastedImageFile = new File([blob], 'pasted_image.png', { type: blob.type });

        // Update imageInput with the pasted image
        const imageInput = document.getElementById('imageInput');
        const fileList = new DataTransfer();
        fileList.items.add(pastedImageFile);
        imageInput.files = fileList.files;

        // Process the pasted image if needed
        handleImageInputChange({ target: { files: [pastedImageFile] } });
  
        };
     
      image.src = url;
        

      }

    }
  }).catch(error => {
    console.error('Failed to read clipboard contents: ', error);
  });
});

// Functions
function handleImageInputChange(event) {

    const selectedFile = event.target.files[0];

  if (selectedFile) {
    displayImage(selectedFile);
    fileInputLabel.style.display = 'none';
    // const image = new Image();
    // image.src = URL.createObjectURL(selectedFile);
    // processImage(image);
  }
}

function handleProcessButtonClick() {
  // console.log(uploadedImage.src);
  const selectedFile = imageInput.files[0];
  // const selectedFile = uploadedImage.src;
  console.log(selectedFile);
  if (selectedFile) {
    processImage(selectedFile);
  }
}

function displayImage(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    uploadedImage.src = event.target.result;
    uploadedImage.style.display = 'block'; // Make the image visible
  };
  reader.readAsDataURL(file);
}

async function processImage(imageFile) {
    const image = new Image();
    image.src = URL.createObjectURL(imageFile);

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
    // alert(output);

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
    get_image_label_mobilenet(labelsFileUrl, maxIndex);

}; 

function get_image_label_mobilenet(labelsFileUrl, maxIndex) {

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
          predictedLabelElement.textContent = `🤖: ${predictedLabel}`;

          console.log('🤖:', predictedLabel);
        } else {
          console.log('Index out of range or labels file is missing.');
        }
      })
      .catch(error => {
        console.error('Error fetching labels:', error);
      });
    return predictedLabel;
};