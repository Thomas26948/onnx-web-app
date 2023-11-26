const uploadedImage = document.getElementById('boostingUploadedImage');
const imageInput = document.getElementById('boostingImageInput');
const fileInputLabel = document.querySelector('.boosting-custom-file-input-label');


imageInput.addEventListener('change', () => {
    const selectedFile = imageInput.files[0];
    if (selectedFile) {
        displayImage(selectedFile);
        fileInputLabel.style.display = 'none';

        const image = new Image();
        image.src = URL.createObjectURL(selectedFile);
    
        image.onload = async () => {
          const session = await ort.InferenceSession.create('../model/super-resolution-10.onnx');
    
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
          const inputArray = new Float32Array(1 * 224 * 224); 
          const inputTensor = new ort.Tensor('float32', inputArray, [1, 1, 224, 224]);
    
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