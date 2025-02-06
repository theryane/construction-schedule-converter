<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Construction Schedule Converter</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>Construction Schedule Converter</h1>
            <p class="subtitle">Convert schedule PDFs to Excel-compatible CSV format</p>
        </header>

        <main>
            <div class="upload-container">
                <div class="upload-content">
                    <h2>Upload Schedule PDF</h2>
                    <input type="file" id="fileInput" accept=".pdf">
                    <button type="button" id="processButton" class="process-button">
                        Convert to CSV
                    </button>
                </div>
            </div>

            <div id="processingStatus" class="status-container hidden">
                <div class="spinner"></div>
                <p>Processing your schedule...</p>
            </div>

            <div id="previewContainer" class="preview-container hidden">
                <h3>Preview</h3>
                <pre id="preview"></pre>
                <div class="actions">
                    <button type="button" id="downloadBtn" class="download-button">
                        Download CSV
                    </button>
                    <button type="button" id="copyBtn" class="copy-button">
                        Copy to Clipboard
                    </button>
                </div>
            </div>
        </main>
    </div>

    <script src="PDFProcessor.js"></script>
    <script src="app.js"></script>
</body>
</html>
