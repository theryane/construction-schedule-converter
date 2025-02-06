// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Initialize Schedule Processor
const scheduleProcessor = new ScheduleProcessor();

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
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
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                processFile(file);
            } else {
                showError('Please select a PDF file.');
            }
        }
    });

    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                processFile(file);
            } else {
                showError('Please drop a PDF file.');
            }
        }
    });

    downloadBtn.addEventListener('click', handleDownload);
    copyBtn.addEventListener('click', handleCopy);
}

// File Processing
async function processFile(file) {
    try {
        showProcessing(true);
        const arrayBuffer = await file.arrayBuffer();
        const result = await scheduleProcessor.processSchedule(arrayBuffer);
        displayResult(result);
        showProcessing(false);
    } catch (error) {
        console.error('Error processing file:', error);
        showError('Error processing the PDF file. Please try again.');
        showProcessing(false);
    }
}

// UI Updates
function showProcessing(show) {
    processingStatus.classList.toggle('hidden', !show);
    dropZone.classList.toggle('hidden', show);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    dropZone.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function displayResult(data) {
    preview.textContent = data;
    previewContainer.classList.remove('hidden');
}

// Download and Copy Functions
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

async function handleCopy() {
    try {
        await navigator.clipboard.writeText(preview.textContent);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = originalText, 2000);
    } catch (err) {
        console.error('Failed to copy text:', err);
        showError('Failed to copy to clipboard');
    }
}

// Initialize the application
initializeEventListeners();
console.log('Application initialized');
