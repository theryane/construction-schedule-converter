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

// File Processing Function
async function processFile(file) {
    try {
        showProcessing(true);
        const arrayBuffer = await file.arrayBuffer();
        const result = await pdfProcessor.processSchedule(arrayBuffer);
        displayResult(result);
        showProcessing(false);
    } catch (error) {
        console.error('Error processing file:', error);
        showError('Error processing the PDF file. Please try again.');
        showProcessing(false);
    }
}

// Download Function
function handleDownload() {
    const blob = new Blob([preview.textContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Helper Functions
function showProcessing(show) {
    processingStatus.classList.toggle('hidden', !show);
    processButton.disabled = show;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    processButton.parentNode.insertBefore(errorDiv, processButton.nextSibling);
    setTimeout(() => errorDiv.remove(), 3000);
}

function displayResult(data) {
    preview.textContent = data;
    previewContainer.classList.remove('hidden');
}

// Event Listeners
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

// Initialize UI State
processButton.disabled = true;
console.log('Application initialized');
