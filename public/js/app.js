const imageInput = document.getElementById('imageInput');
const processButton = document.getElementById('processButton');
const uploadedImage = document.getElementById('uploadedImage');
const fileInputLabel = document.querySelector('.custom-file-input-label');




imageInput.addEventListener('change', () => {
  const selectedFile = imageInput.files[0];
  if (selectedFile) {
    displayImage(selectedFile);
    fileInputLabel.style.display = 'none';
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