// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Initialize PDF Processor
const pdfProcessor = new PDFProcessor();

// Define all DOM elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    processButton: document.getElementById('processButton'),
    processingStatus: document.getElementById('processingStatus'),
    previewContainer: document.getElementById('previewContainer'),
    preview: document.getElementById('preview'),
    downloadBtn: document.getElementById('downloadBtn'),
    copyBtn: document.getElementById('copyBtn')
};

// Define all core functions first
function handleDownload() {
    const blob = new Blob([elements.preview.textContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function processFile(file) {
    try {
        showProcessingStatus(true);
        const arrayBuffer = await file.arrayBuffer();
        const result = await pdfProcessor.processSchedule(arrayBuffer);
        displayResult(result);
        showProcessingStatus(false);
    } catch (error) {
        console.error('Error processing file:', error);
        showError('Error processing the PDF file. Please try again.');
        showProcessingStatus(false);
    }
}

function showProcessingStatus(show) {
    elements.processingStatus.classList.toggle('hidden', !show);
    elements.processButton.disabled = show;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    elements.processButton.parentNode.insertBefore(errorDiv, elements.processButton.nextSibling);
    setTimeout(() => errorDiv.remove(), 3000);
}

function displayResult(data) {
    elements.preview.textContent = data;
    elements.previewContainer.classList.remove('hidden');
}

// Set up event listeners after all functions are defined
function initializeEventListeners() {
    elements.fileInput.addEventListener('change', function(e) {
        console.log('File selected:', e.target.files[0]);
        if (e.target.files.length > 0) {
            elements.processButton.disabled = false;
        }
    });

    elements.processButton.addEventListener('click', function() {
        const file = elements.fileInput.files[0];
        if (file) {
            processFile(file);
        } else {
            showError('Please select a PDF file first.');
        }
    });

    elements.downloadBtn.addEventListener('click', handleDownload);
}

// Initialize the application
initializeEventListeners();
elements.processButton.disabled = true;
console.log('Application initialized with all functions defined');
