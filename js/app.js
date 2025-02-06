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
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
downloadBtn.addEventListener('click', handleDownload);
copyBtn.addEventListener('click', handleCopy);

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.
