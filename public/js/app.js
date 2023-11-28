// DOM elements
const imageInput = document.getElementById('imageInput');
const processButton = document.getElementById('processButton');
const uploadedImage = document.getElementById('uploadedImage');
const fileInputLabel = document.querySelector('.custom-file-input-label');
const imageContainer = document.getElementById('imageContainer');



imageContainer.addEventListener('click', (event) => {
  const isPasteClick = event.target === pasteBox;
  if (isPasteClick) {
    // Handle logic for pasting an image here
    // Implement the necessary logic for pasting an image
    // For example:
    // const blob = ... // Get the image blob from the clipboard
    // displayImage(blob);
    // Process the pasted image

pasteBox.click(); // Trigger the click event of the hidden file input
  } else {

  imageInput.click(); // Trigger the click event of the hidden file input
  }
});

// Event listeners
imageInput.addEventListener('change', handleImageInputChange);
processButton.addEventListener('click', handleProcessButtonClick);

var model_encoder = null;
var model_decoder = null;
var model_mobilenet = null;

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
    var select = document.getElementById('dropdownOptions');
    var value = select.options[select.selectedIndex].value;
    if (value == "faster") {
      processImage(selectedFile);
    } else if (value == "smarter") {
      processImage_smarter(selectedFile);
    }
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

  if (model_mobilenet == null) {
    model_mobilenet = await ort.InferenceSession.create('../model/mobilenet.onnx');
  }


  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 224;
  canvas.height = 224;
  await new Promise((resolve) => {
    image.onload = () => {
      ctx.drawImage(image, 0, 0, 224, 224);
      const imageData = ctx.getImageData(0, 0, 224, 224).data;

      const inputArray = new Float32Array(3 * 224 * 224);

      // Populate the inputArray with normalized pixel values
      for (let i = 0; i < 224 * 224; i++) {
        inputArray[i] = imageData[i * 4] / 255; // Red channel
        inputArray[i + 224 * 224] = imageData[i * 4 + 1] / 255; // Green channel
        inputArray[i + 2 * 224 * 224] = imageData[i * 4 + 2] / 255; // Blue channel
      }

      const inputTensor = new ort.Tensor('float32', inputArray, [1, 3, 224, 224]);
      const feeds = { data: inputTensor };

      // Run inference
      model_mobilenet.run(feeds).then((output) => {
        // Process the inference results
        console.log('Inference Results:', output);
        const outputData = output.mobilenetv20_output_flatten0_reshape0.data;

        // Find the index of the maximum value
        let maxIndex = 0;
        let maxValue = outputData[0];

        for (let i = 1; i < outputData.length; i++) {
          if (outputData[i] > maxValue) {
            maxValue = outputData[i];
            maxIndex = i;
          }
        }

        console.log('Index of the maximum value:', maxIndex);

        const labelsFileUrl = '../labels.txt';
        get_image_label_mobilenet(labelsFileUrl, maxIndex);
      });
    };

    resolve();
  });

  // model_mobilenet = null;

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


async function processImage_smarter(imageFile) {
  const image = new Image();
  image.src = URL.createObjectURL(imageFile);
  const predictedLabelElement = document.getElementById('predictedLabel');


  if (model_encoder == null) {
    model_encoder = await ort.InferenceSession.create('../model/vitgpt2/encoder_model_fp16_inputf32.onnx', { executionProviders: ['wasm'] });
  }
  if (model_decoder == null) {
    model_decoder = await ort.InferenceSession.create('../model/vitgpt2/decoder_model_fp16_inputf32.onnx', { executionProviders: ['wasm'] });
  }

  await new Promise((resolve) => {
    image.onload = async () => {
      console.log("model loaded");

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 224;
      canvas.height = 224;
      ctx.drawImage(image, 0, 0, 224, 224);
      const imageData = ctx.getImageData(0, 0, 224, 224).data;

      const inputArray = new Float32Array(3 * 224 * 224);

      for (let i = 0; i < 224 * 224; i++) {
        inputArray[i] = (imageData[i * 4] * 0.00392156862745098 - 0.5) / 0.5; // Red channel
        inputArray[i + 224 * 224] = (imageData[i * 4 + 1] * 0.00392156862745098 - 0.5) / 0.5; // Green channel
        inputArray[i + 2 * 224 * 224] = (imageData[i * 4 + 2] * 0.00392156862745098 - 0.5) / 0.5; // Blue channel
      }

      const inputTensor = new ort.Tensor("float32", inputArray, [1, 3, 224, 224]);
      const feeds = { "pixel_values": inputTensor };

      // Run encoder inference
      const encoder_output = await model_encoder.run(feeds);

      let inputArrayId = new BigInt64Array(1 * 1);
      inputArrayId[0] = BigInt(50256);
      const inputTensorId = new ort.Tensor("int64", inputArrayId, [1, 1]);

      const encoder_hidden_states = new ort.Tensor("float32", encoder_output.last_hidden_state.data, [1, 197, 768]);

      // Run decoder inference
      let decoder_output = await generateText(model_decoder, encoder_hidden_states, inputTensorId);

      let size_input = 1;
      let maxIndex = findMaxValueAndIndex(decoder_output.logits.data).maxIndex;
      let sentence = "";

      while (maxIndex != 50256) {
        const word = await getWordFromIndex(maxIndex);
        sentence += word.replace("Ġ", "") + " ";
        predictedLabelElement.textContent = `🤖: ${sentence}`;

        // Update input for the next iteration
        inputArrayId = appendToInputArray(inputArrayId, size_input, BigInt(maxIndex));
        size_input += 1;
        const inputTensorId = new ort.Tensor("int64", inputArrayId, [1, size_input]);

        // Run decoder inference with updated input
        decoder_output = await generateText(model_decoder, encoder_hidden_states, inputTensorId);

        maxIndex = findMaxValueAndIndex(decoder_output.logits.data.slice(50257 * (size_input - 1), 50257 * size_input)).maxIndex;
      }

      resolve(); // Resolve the promise after image processing
    };

    // Ensure the image.onload is triggered
    if (image.complete && image.naturalWidth !== 0) {
      image.onload();
    }
  });
}

// Helper functions
async function generateText(model, encoder_hidden_states, inputTensorId) {
  return await model.run({ "encoder_hidden_states": encoder_hidden_states, "input_ids": inputTensorId });
}

function appendToInputArray(inputArrayId, size_input, newMaxIndex) {
  const tmpInputArrayId = new BigInt64Array(size_input + 1);
  tmpInputArrayId.set(inputArrayId);
  tmpInputArrayId[size_input] = newMaxIndex;
  return tmpInputArrayId;
}


// Find the max value and its index in an array
function findMaxValueAndIndex(array) {
  let maxIndex = 0;
  let maxValue = array[0];
  console.log("SIZE : ", array.length);
  for (let i = 1; i < array.length; i++) {
    if (array[i] > maxValue) {
      maxValue = array[i];
      maxIndex = i;
    }
  }
  return { maxIndex, maxValue };
}

// Open vocabulary for the GPT-2 model and return the corresponding word
async function getWordFromIndex(index) {
  try {
    const vocabFileUrl = '../model/vitgpt2/vocab_reversed.json';
    const response = await fetch(vocabFileUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch vocab file');
    }

    const data = await response.json();
    const vocab = data;

    // You can do additional operations here if needed
    // console.log(vocab);
    console.log(index);

    return vocab[index];
  } catch (error) {
    console.error('Error fetching vocab:', error);
    return null; // or handle the error accordingly
  }
}