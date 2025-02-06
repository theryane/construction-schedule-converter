// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Initialize PDF Processor
const pdfProcessor = new PDFProcessor();

// DOM Elements
const fileInput = document.getElementById('fileInput');
const processButton = document.getElementById('processButton');
const processingStatus = document.getElementById('processingStatus');
const previewContainer = document.getElementById('previewContainer');
const preview = document.getElementById('preview');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');

// Event Listeners
function initializeEventListeners() {
    fileInput.addEventListener('change', function(e) {
        console.log('File selected:', e.target.files[0]);
        if (e.target.files.length > 0) {
            processButton.disabled = false;
        }
    });

    processButton.addEventListener('click', function() {
        const file = fileInput.files[0];
        if (file) {
            processFile(file);
        } else {
            showError('Please select a PDF file first.');
        }
    });

    downloadBtn.addEventListener('click', handleDownload);
    copyBtn.addEventListener('click', handleCopy);
}

// Rest of the code remains the same...

// Initialize the application
initializeEventListeners();
processButton.disabled = true;
console.log('Application initialized');
