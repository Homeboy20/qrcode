/**
 * Batch Processor for Barcode Generator
 * Import data from CSV/Excel to generate multiple barcodes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize batch processing
    initBatchProcessor();
    
    /**
     * Set up batch processor functionality
     */
    function initBatchProcessor() {
        // Create batch import tab content if it doesn't exist yet
        setupBatchUI();
        
        // Add event listeners for file import
        setupFileImport();
        
        // Add event listeners for batch generation
        setupBatchGeneration();
    }
    
    /**
     * Create the batch import UI
     */
    function setupBatchUI() {
        // Find the tabs list and check if batch tab already exists
        const tabsList = document.querySelector('#tabs');
        if (!tabsList) return;
        
        // Check if batch tab exists
        let batchTab = document.querySelector('#tab-batch');
        if (!batchTab) {
            // Create a new tab
            const tabItem = document.createElement('li');
            tabItem.className = 'mr-2 flex-1 md:flex-none';
            tabItem.innerHTML = `
                <a href="#" class="inline-block w-full p-4 border-b-2 border-transparent rounded-t-lg"
                id="tab-batch" data-target="batch-tab">
                    <i class="fas fa-upload mr-2"></i>Batch Import
                </a>
            `;
            tabsList.appendChild(tabItem);
            
            // Create the tab content
            const tabContents = document.querySelector('.tab-panel-container');
            if (!tabContents) return;
            
            const batchTabContent = document.createElement('div');
            batchTabContent.id = 'batch-tab';
            batchTabContent.className = 'tab-content hidden';
            batchTabContent.innerHTML = `
                <div class="grid md:grid-cols-2 gap-8">
                    <div class="space-y-5 flex flex-col">
                        <div class="bg-primary-50 dark:bg-gray-700 rounded-lg p-5 border border-primary-100 dark:border-gray-600 
                               hover:shadow-md transition-shadow">
                            <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <i class="fas fa-upload mr-2 text-primary-500"></i>
                                Import Data for Batch Processing
                            </h2>
                            
                            <div class="space-y-4">
                                <!-- File Upload -->
                                <div class="relative">
                                    <label for="batch_file" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Upload CSV File
                                    </label>
                                    <div class="flex flex-col space-y-2">
                                        <input type="file" id="batch_file" accept=".csv,.xlsx,.xls,.txt" class="hidden" />
                                        <label for="batch_file" class="flex justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-primary-500 dark:hover:border-primary-400">
                                            <div class="text-center">
                                                <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                                                <p class="text-sm text-gray-600 dark:text-gray-300">Drag and drop or click to select</p>
                                                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">CSV, Excel, or TXT files</p>
                                            </div>
                                        </label>
                                    </div>
                                    <div id="file-info" class="mt-2 text-sm text-gray-600 dark:text-gray-300 hidden">
                                        <p><span id="file-name"></span> (<span id="file-size"></span>)</p>
                                    </div>
                                </div>
                                
                                <!-- Barcode Type Selection -->
                                <div>
                                    <label for="batch_barcode_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Barcode Type
                                    </label>
                                    <div class="relative">
                                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <i class="fas fa-tags text-gray-400"></i>
                                        </span>
                                        <select id="batch_barcode_type" class="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                                            <option value="code128">Code 128</option>
                                            <option value="code39">Code 39</option>
                                            <option value="ean13">EAN-13</option>
                                            <option value="ean8">EAN-8</option>
                                            <option value="upca">UPC-A</option>
                                        </select>
                                        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <i class="fas fa-chevron-down text-gray-400"></i>
                                        </div>
                                    </div>
                                </div>

                                <!-- Column Mapping -->
                                <div id="column-mapping" class="hidden">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Data Column Mapping
                                    </label>
                                    <div class="space-y-2">
                                        <div>
                                            <label for="data_column" class="text-xs text-gray-600 dark:text-gray-400">
                                                Barcode Data Column
                                            </label>
                                            <select id="data_column" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                                                <option value="">Select column</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Options for CSV parsing -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        CSV Options
                                    </label>
                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input type="checkbox" id="has_header" checked
                                                class="rounded text-primary-600 focus:ring-primary-500 mr-2" />
                                            <label for="has_header" class="text-sm text-gray-600 dark:text-gray-300">
                                                First row contains headers
                                            </label>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="checkbox" id="save_to_system" checked
                                                class="rounded text-primary-600 focus:ring-primary-500 mr-2" />
                                            <label for="save_to_system" class="text-sm text-gray-600 dark:text-gray-300">
                                                Save barcodes to system
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Start Processing button -->
                                <div>
                                    <button id="process-batch-btn" class="w-full flex justify-center items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" disabled>
                                        <i class="fas fa-cogs mr-2"></i>
                                        Process Batch
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Preview and results -->
                    <div class="space-y-5">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                                Data Preview
                            </h3>
                            <div id="data-preview" class="overflow-x-auto">
                                <p class="text-gray-500 dark:text-gray-400 italic text-sm">Upload a file to preview data</p>
                            </div>
                        </div>
                        
                        <!-- Batch Processing Results -->
                        <div id="batch-results" class="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 hidden">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                                    Batch Results
                                </h3>
                                <div class="flex space-x-2">
                                    <button id="download-all-batch-btn" class="flex items-center px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                                        <i class="fas fa-download mr-1"></i>
                                        Download All
                                    </button>
                                    <button id="export-csv-batch-btn" class="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors">
                                        <i class="fas fa-file-csv mr-1"></i>
                                        Export CSV
                                    </button>
                                </div>
                            </div>
                            
                            <div id="batch-progress" class="mb-4 hidden">
                                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                    <div id="progress-bar" class="bg-primary-600 h-2.5 rounded-full" style="width: 0%"></div>
                                </div>
                                <p id="progress-text" class="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">0%</p>
                            </div>
                            
                            <div id="results-container" class="space-y-4">
                                <p class="text-gray-500 dark:text-gray-400 italic text-sm">Process a batch to see results</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add the tab content to the page
            const tabPanelContainer = document.querySelector('.p-6');
            if (tabPanelContainer) {
                tabPanelContainer.appendChild(batchTabContent);
            }
        }
    }
    
    /**
     * Set up file import functionality
     */
    function setupFileImport() {
        const fileInput = window.safeDOM.getElement('batch_file');
        if (!fileInput) return;
        
        // Handle file selection
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Display file info
            const fileInfo = window.safeDOM.getElement('file-info');
            const fileName = window.safeDOM.getElement('file-name');
            const fileSize = window.safeDOM.getElement('file-size');
            
            if (fileInfo && fileName && fileSize) {
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                fileInfo.classList.remove('hidden');
            }
            
            // Process the file
            processFile(file);
        });
        
        // Handle drag and drop
        const dropZone = document.querySelector('label[for="batch_file"]');
        if (dropZone) {
            // Prevent default drag behaviors
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, preventDefaults, false);
            });
            
            // Highlight drop zone when file is dragged over it
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, highlight, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, unhighlight, false);
            });
            
            // Handle dropped files
            dropZone.addEventListener('drop', handleDrop, false);
        }
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        function highlight() {
            dropZone.classList.add('border-primary-500');
        }
        
        function unhighlight() {
            dropZone.classList.remove('border-primary-500');
        }
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            fileInput.files = dt.files;
            
            // Trigger change event
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    }
    
    /**
     * Process the uploaded file and show a preview
     */
    function processFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const contents = e.target.result;
            let data = [];
            let headers = [];
            
            // Determine file type from extension
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (extension === 'csv' || extension === 'txt') {
                // Parse CSV
                const result = parseCSV(contents);
                data = result.data;
                headers = result.headers;
            } else if (extension === 'xlsx' || extension === 'xls') {
                // We would need a library like SheetJS (xlsx) to parse Excel
                // For this example, show a placeholder
                showParsingError('Excel parsing requires the SheetJS library. Please use CSV format instead.');
                return;
            }
            
            // Show data preview
            showDataPreview(data, headers);
            
            // Enable processing button
            const processBtn = window.safeDOM.getElement('process-batch-btn');
            if (processBtn) {
                processBtn.disabled = false;
            }
            
            // Update column mapping dropdown
            updateColumnMapping(headers);
        };
        
        reader.onerror = function() {
            showParsingError('Error reading file');
        };
        
        // Read the file
        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            showParsingError('Unsupported file format. Please upload a CSV, TXT, or Excel file.');
        }
    }
    
    /**
     * Parse CSV data
     */
    function parseCSV(text) {
        const hasHeader = window.safeDOM.getElement('has_header')?.checked || true;
        const lines = text.split(/\r?\n/);
        const delimiter = detectDelimiter(text);
        
        let headers = [];
        let data = [];
        
        if (lines.length > 0) {
            // Parse headers if the first row contains them
            if (hasHeader) {
                headers = lines[0].split(delimiter).map(header => header.trim());
                lines.shift(); // Remove header row from data
            } else {
                // Create default headers (Column 1, Column 2, etc.)
                const firstRow = lines[0].split(delimiter);
                headers = Array(firstRow.length).fill().map((_, i) => `Column ${i + 1}`);
            }
            
            // Parse data rows
            data = lines
                .filter(line => line.trim() !== '') // Skip empty lines
                .map(line => {
                    const values = line.split(delimiter).map(value => value.trim());
                    return values;
                });
        }
        
        return { headers, data };
    }
    
    /**
     * Detect the delimiter used in CSV
     */
    function detectDelimiter(text) {
        const firstLine = text.split(/\r?\n/)[0];
        
        const delimiters = [',', ';', '\t', '|'];
        const counts = delimiters.map(delimiter => ({
            delimiter,
            count: (firstLine.match(new RegExp(delimiter, 'g')) || []).length
        }));
        
        // Use the delimiter that appears most frequently
        const maxCount = Math.max(...counts.map(c => c.count));
        const detected = counts.find(c => c.count === maxCount);
        
        return detected.delimiter;
    }
    
    /**
     * Show an error message
     */
    function showParsingError(message) {
        const preview = window.safeDOM.getElement('data-preview');
        if (preview) {
            preview.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4">
                    <p class="font-medium">Error</p>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    /**
     * Show a preview of the parsed data
     */
    function showDataPreview(data, headers) {
        const preview = window.safeDOM.getElement('data-preview');
        if (!preview) return;
        
        // Limit the number of rows to display
        const MAX_PREVIEW_ROWS = 5;
        const displayData = data.slice(0, MAX_PREVIEW_ROWS);
        
        if (data.length === 0) {
            preview.innerHTML = '<p class="text-gray-500 italic">No data found in the file</p>';
            return;
        }
        
        let tableHtml = `
            <div class="rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
        `;
        
        // Add headers
        headers.forEach(header => {
            tableHtml += `<th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">${header}</th>`;
        });
        
        tableHtml += `
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
        `;
        
        // Add data rows
        displayData.forEach(row => {
            tableHtml += '<tr>';
            row.forEach((cell, i) => {
                const headerValue = headers[i] || `Column ${i + 1}`;
                tableHtml += `<td class="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">${cell}</td>`;
            });
            tableHtml += '</tr>';
        });
        
        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Add row count info
        if (data.length > MAX_PREVIEW_ROWS) {
            tableHtml += `<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Showing ${MAX_PREVIEW_ROWS} of ${data.length} rows</p>`;
        }
        
        preview.innerHTML = tableHtml;
        
        // Show column mapping
        const columnMapping = window.safeDOM.getElement('column-mapping');
        if (columnMapping) {
            columnMapping.classList.remove('hidden');
        }
    }
    
    /**
     * Update column mapping dropdown with headers
     */
    function updateColumnMapping(headers) {
        const dataColumn = window.safeDOM.getElement('data_column');
        if (!dataColumn) return;
        
        // Clear existing options
        dataColumn.innerHTML = '<option value="">Select column</option>';
        
        // Add options for each header
        headers.forEach((header, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = header;
            dataColumn.appendChild(option);
        });
        
        // Auto-select a column if it looks like it contains barcode data
        const barcodeKeywords = ['barcode', 'code', 'sku', 'product', 'item', 'id'];
        const bestMatch = headers.findIndex(header => 
            barcodeKeywords.some(keyword => 
                header.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        
        if (bestMatch !== -1) {
            dataColumn.value = bestMatch;
        }
    }
    
    /**
     * Format file size in human-readable format
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Set up batch generation functionality
     */
    function setupBatchGeneration() {
        const processBtn = window.safeDOM.getElement('process-batch-btn');
        if (!processBtn) return;
        
        processBtn.addEventListener('click', function() {
            const fileInput = window.safeDOM.getElement('batch_file');
            if (!fileInput || !fileInput.files[0]) return;
            
            const file = fileInput.files[0];
            generateBarcodesBatch(file);
        });
    }
    
    /**
     * Generate barcodes in batch
     */
    function generateBarcodesBatch(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const contents = e.target.result;
            const extension = file.name.split('.').pop().toLowerCase();
            let data = [];
            
            if (extension === 'csv' || extension === 'txt') {
                const result = parseCSV(contents);
                data = result.data;
            } else {
                showParsingError('Unsupported file format');
                return;
            }
            
            // Get selected options
            const barcodeType = window.safeDOM.getValue('batch_barcode_type', 'code128');
            const dataColumnIndex = parseInt(window.safeDOM.getValue('data_column', '0'));
            const saveToSystem = window.safeDOM.getElement('save_to_system')?.checked || false;
            
            // Show batch results section
            const batchResults = window.safeDOM.getElement('batch-results');
            if (batchResults) {
                batchResults.classList.remove('hidden');
            }
            
            // Show progress bar
            const batchProgress = window.safeDOM.getElement('batch-progress');
            if (batchProgress) {
                batchProgress.classList.remove('hidden');
            }
            
            // Clear previous results
            const resultsContainer = window.safeDOM.getElement('results-container');
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
            }
            
            // Process the data in batches to avoid browser freezing
            processBarcodeDataInBatches(data, dataColumnIndex, barcodeType, saveToSystem);
        };
        
        reader.onerror = function() {
            showParsingError('Error reading file');
        };
        
        reader.readAsText(file);
    }
    
    /**
     * Process barcode data in batches
     */
    function processBarcodeDataInBatches(data, dataColumnIndex, barcodeType, saveToSystem) {
        const BATCH_SIZE = 10; // Number of barcodes to process at once
        const totalItems = data.length;
        let processedItems = 0;
        let results = [];
        
        // Show initial progress
        updateProgress(0, totalItems);
        
        // Process batches sequentially
        function processNextBatch(startIndex) {
            if (startIndex >= totalItems) {
                // All batches processed
                finalizeBatchProcessing(results);
                return;
            }
            
            const endIndex = Math.min(startIndex + BATCH_SIZE, totalItems);
            const batchData = data.slice(startIndex, endIndex).map(row => row[dataColumnIndex]);
            
            // Call batch API
            fetch('/api/batch_operation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'generate',
                    items: batchData.map(code => ({
                        type: 'barcode',
                        data: code,
                        barcode_type: barcodeType
                    }))
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(responseData => {
                if (responseData.status === 'success') {
                    // Add to results
                    results = results.concat(responseData.results);
                    
                    // Update progress
                    processedItems += (endIndex - startIndex);
                    updateProgress(processedItems, totalItems);
                    
                    // Display batch results
                    displayBatchResults(responseData.results);
                    
                    // Process next batch
                    setTimeout(() => processNextBatch(endIndex), 100);
                } else {
                    throw new Error(responseData.error || 'Unknown error');
                }
            })
            .catch(error => {
                showBatchError(error.message);
                
                // Continue with next batch despite error
                processedItems += (endIndex - startIndex);
                updateProgress(processedItems, totalItems);
                setTimeout(() => processNextBatch(endIndex), 100);
            });
        }
        
        // Start processing the first batch
        processNextBatch(0);
    }
    
    /**
     * Update the progress bar
     */
    function updateProgress(current, total) {
        const progressBar = window.safeDOM.getElement('progress-bar');
        const progressText = window.safeDOM.getElement('progress-text');
        
        if (progressBar && progressText) {
            const percentage = Math.round((current / total) * 100);
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${current} of ${total} (${percentage}%)`;
        }
    }
    
    /**
     * Display results from a batch
     */
    function displayBatchResults(batchResults) {
        const resultsContainer = window.safeDOM.getElement('results-container');
        if (!resultsContainer) return;
        
        // Create grid for barcode display
        let gridDiv = resultsContainer.querySelector('.results-grid');
        if (!gridDiv) {
            gridDiv = document.createElement('div');
            gridDiv.className = 'results-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
            resultsContainer.appendChild(gridDiv);
        }
        
        // Add each barcode to the grid
        batchResults.forEach(result => {
            const barcodeDiv = document.createElement('div');
            barcodeDiv.className = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 text-center';
            
            // Barcode image
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${result.image}`;
            img.alt = result.data;
            img.className = 'mx-auto mb-2';
            
            // Barcode data
            const dataP = document.createElement('p');
            dataP.className = 'text-sm text-gray-800 dark:text-gray-200 font-medium';
            dataP.textContent = result.data;
            
            // Type
            const typeP = document.createElement('p');
            typeP.className = 'text-xs text-gray-500 dark:text-gray-400';
            typeP.textContent = result.type.toUpperCase();
            
            // Download link
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${result.image}`;
            link.download = `${result.data}.png`;
            link.className = 'inline-block mt-2 text-xs text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300';
            link.innerHTML = '<i class="fas fa-download mr-1"></i>Download';
            
            // Append elements
            barcodeDiv.appendChild(img);
            barcodeDiv.appendChild(dataP);
            barcodeDiv.appendChild(typeP);
            barcodeDiv.appendChild(link);
            
            gridDiv.appendChild(barcodeDiv);
        });
    }
    
    /**
     * Show an error during batch processing
     */
    function showBatchError(message) {
        const resultsContainer = window.safeDOM.getElement('results-container');
        if (!resultsContainer) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-4';
        errorDiv.innerHTML = `
            <p class="font-medium">Error</p>
            <p>${message}</p>
        `;
        
        resultsContainer.insertBefore(errorDiv, resultsContainer.firstChild);
    }
    
    /**
     * Finalize batch processing
     */
    function finalizeBatchProcessing(results) {
        // Set up export buttons
        setupBatchExport(results);
        
        // Update progress to complete
        updateProgress(1, 1);
        
        const progressText = window.safeDOM.getElement('progress-text');
        if (progressText) {
            progressText.textContent = `Completed: ${results.length} barcodes generated`;
        }
    }
    
    /**
     * Set up batch export buttons
     */
    function setupBatchExport(results) {
        // Download All button
        const downloadAllBtn = window.safeDOM.getElement('download-all-batch-btn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', function() {
                // Create a zip file with JSZip (would need to be loaded)
                alert('Download all functionality requires JSZip library. This is a placeholder.');
            });
        }
        
        // Export CSV button
        const exportCsvBtn = window.safeDOM.getElement('export-csv-batch-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function() {
                exportBatchToCsv(results);
            });
        }
    }
    
    /**
     * Export batch results to CSV
     */
    function exportBatchToCsv(results) {
        // Create CSV content
        let csvContent = 'data:text/csv;charset=utf-8,';
        
        // Add headers
        csvContent += 'Barcode Data,Type,Image URL\n';
        
        // Add rows
        results.forEach(result => {
            // Create a downloadable URL for each image
            // In a real implementation, you'd need to have a server endpoint to get these images
            csvContent += `${result.data},${result.type},"${window.location.origin}/api/barcode/${result.id}"\n`;
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `barcode_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up
        document.body.removeChild(link);
    }
}); 