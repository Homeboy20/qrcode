/**
 * Bulk Sequence Generator
 * Allows generation of multiple sequences of barcodes with different options
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let sequenceCount = 1;
    const maxSequences = 10;
    let isUserLoggedIn = false;
    
    // Get DOM elements
    const bulkSequenceContainer = document.getElementById('bulk-sequence-container');
    const addSequenceBtn = document.getElementById('add-sequence-btn');
    const generateAllBtn = document.getElementById('generate-all-btn');
    const sequencesForm = document.getElementById('bulk-sequences-form');
    const sequencesList = document.getElementById('sequences-list');
    const resultsContainer = document.getElementById('bulk-sequence-results');
    
    if (!bulkSequenceContainer) return;
    
    // Check if user is logged in
    function checkAuthStatus() {
        return fetch('/api/user/auth_status')
            .then(response => response.json())
            .then(data => {
                isUserLoggedIn = data.authenticated || false;
                
                // Update auth status display
                const authStatus = document.getElementById('bulk-sequence-auth-status');
                if (authStatus) {
                    authStatus.textContent = isUserLoggedIn ? 
                        'Your generated codes will be saved to your account' : 
                        'Sign in to save your generated codes to your account';
                }
                
                return isUserLoggedIn;
            })
            .catch(error => {
                console.error('Failed to check auth status:', error);
                return false;
            });
    }
    
    // Initialize the bulk sequence generator
    function initBulkSequenceGenerator() {
        // Check auth status first
        checkAuthStatus();
        
        // Add event listeners
        if (addSequenceBtn) {
            addSequenceBtn.addEventListener('click', addNewSequence);
        }
        
        if (generateAllBtn) {
            generateAllBtn.addEventListener('click', generateAllSequences);
        }
        
        if (sequencesForm) {
            sequencesForm.addEventListener('submit', function(e) {
                e.preventDefault();
                generateAllSequences();
            });
        }
        
        // Add initial sequence
        addNewSequence();
    }
    
    // Add a new sequence configuration to the form
    function addNewSequence() {
        if (sequenceCount >= maxSequences) {
            showError('Maximum number of sequences reached (10)');
            return;
        }
        
        const sequenceId = sequenceCount++;
        const sequenceItem = document.createElement('div');
        sequenceItem.className = 'sequence-item bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700';
        sequenceItem.dataset.id = sequenceId;
        
        sequenceItem.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Sequence #${sequenceId}</h3>
                <button type="button" class="remove-sequence-btn text-red-500 hover:text-red-700" data-id="${sequenceId}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                    <label for="prefix_${sequenceId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prefix
                    </label>
                    <input id="prefix_${sequenceId}" type="text" name="sequences[${sequenceId}][prefix]" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white" 
                        placeholder="Optional prefix">
                </div>
                
                <div class="form-group">
                    <label for="suffix_${sequenceId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Suffix
                    </label>
                    <input id="suffix_${sequenceId}" type="text" name="sequences[${sequenceId}][suffix]" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white" 
                        placeholder="Optional suffix">
                </div>
                
                <div class="form-group">
                    <label for="start_${sequenceId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Number
                    </label>
                    <input id="start_${sequenceId}" type="number" name="sequences[${sequenceId}][start]" value="1" min="0" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                </div>
                
                <div class="form-group">
                    <label for="count_${sequenceId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Count
                    </label>
                    <input id="count_${sequenceId}" type="number" name="sequences[${sequenceId}][count]" value="10" min="1" max="500" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                </div>
                
                <div class="form-group">
                    <label for="pad_${sequenceId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Padding (zeros)
                    </label>
                    <input id="pad_${sequenceId}" type="number" name="sequences[${sequenceId}][pad_length]" value="0" min="0" max="20" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                </div>
                
                <div class="form-group">
                    <label for="type_${sequenceId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Barcode Type
                    </label>
                    <select id="type_${sequenceId}" name="sequences[${sequenceId}][barcode_type]" 
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                              focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                        <option value="code128" selected>Code 128</option>
                        <option value="code39">Code 39</option>
                        <option value="ean13">EAN-13</option>
                        <option value="ean8">EAN-8</option>
                        <option value="upca">UPC-A</option>
                    </select>
                </div>
            </div>
        `;
        
        // Add to sequences list
        sequencesList.appendChild(sequenceItem);
        
        // Add event listener for remove button
        const removeBtn = sequenceItem.querySelector('.remove-sequence-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                removeSequence(this.dataset.id);
            });
        }
        
        // Enable/disable add button based on max sequences
        if (document.querySelectorAll('.sequence-item').length >= maxSequences) {
            addSequenceBtn.disabled = true;
            addSequenceBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    // Remove a sequence from the form
    function removeSequence(id) {
        const sequenceItem = document.querySelector(`.sequence-item[data-id="${id}"]`);
        if (sequenceItem) {
            sequenceItem.remove();
            
            // Re-enable add button if below max
            if (document.querySelectorAll('.sequence-item').length < maxSequences) {
                addSequenceBtn.disabled = false;
                addSequenceBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    }
    
    // Generate all configured sequences
    function generateAllSequences() {
        // Show loading state
        resultsContainer.innerHTML = `
            <div class="loading-spinner flex justify-center items-center p-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <span class="ml-3 text-gray-700 dark:text-gray-300">Generating barcodes...</span>
            </div>
        `;
        
        // Get all sequence configurations
        const sequenceItems = document.querySelectorAll('.sequence-item');
        if (sequenceItems.length === 0) {
            showError('Please add at least one sequence configuration');
            return;
        }
        
        // Check if any item has a range pattern in prefix field
        let hasRangePattern = false;
        let rangeString = '';
        let barcodeType = 'code128';
        
        sequenceItems.forEach(item => {
            const id = item.dataset.id;
            const prefixInput = document.getElementById(`prefix_${id}`);
            if (prefixInput && prefixInput.value) {
                // Check for range pattern like PREFIX[START-END]SUFFIX
                const rangePattern = /^(.*?)\[(\d+)-(\d+)\](.*)$/;
                const match = prefixInput.value.match(rangePattern);
                if (match) {
                    hasRangePattern = true;
                    rangeString = prefixInput.value;
                    barcodeType = document.getElementById(`type_${id}`).value || 'code128';
                    console.log(`Found range pattern: ${rangeString}, barcode type: ${barcodeType}`);
                }
            }
        });
        
        // If we found a range pattern, use special API payload
        if (hasRangePattern) {
            console.log(`Sending range string to API: ${rangeString}`);
            // Send data to API with range string
            fetch('/api/generate_bulk_sequence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    range_string: rangeString,
                    barcode_type: barcodeType,
                    save_to_system: isUserLoggedIn
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('API request failed');
                }
                return response.json();
            })
            .then(data => {
                console.log('API response:', data);
                if (data.status === 'success') {
                    // Check if barcodes are in the response
                    if (data.barcodes && data.barcodes.length > 0) {
                        // Format the data for the displayResults function
                        const formattedData = {
                            total_barcodes: data.barcodes.length,
                            sequences: [
                                {
                                    prefix: '',
                                    suffix: '',
                                    start: 1,
                                    count: data.barcodes.length,
                                    barcodes: data.barcodes,
                                    direction: 1
                                }
                            ]
                        };
                        displayResults(formattedData);
                    } else {
                        showError('No barcodes were generated');
                    }
                } else {
                    showError(data.error || 'Failed to generate barcodes');
                }
            })
            .catch(error => {
                console.error('Error generating sequences:', error);
                showError('Failed to generate barcodes: ' + error.message);
            });
            return;
        }
        
        // Prepare data for API (original sequence batch approach)
        const sequenceBatch = [];
        
        sequenceItems.forEach(item => {
            const id = item.dataset.id;
            const sequenceConfig = {
                prefix: document.getElementById(`prefix_${id}`).value || '',
                suffix: document.getElementById(`suffix_${id}`).value || '',
                start: parseInt(document.getElementById(`start_${id}`).value) || 1,
                count: parseInt(document.getElementById(`count_${id}`).value) || 10,
                pad_length: parseInt(document.getElementById(`pad_${id}`).value) || 0,
                barcode_type: document.getElementById(`type_${id}`).value || 'code128'
            };
            
            sequenceBatch.push(sequenceConfig);
        });
        
        // Add total count validation
        const totalBarcodes = sequenceBatch.reduce((sum, seq) => sum + seq.count, 0);
        if (totalBarcodes > 5000) {
            showError('Total number of barcodes cannot exceed 5,000');
            return;
        }
        
        // Send data to API
        fetch('/api/generate_bulk_sequence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sequences: sequenceBatch,
                save_to_system: isUserLoggedIn
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('API request failed');
            }
            return response.json();
        })
        .then(data => {
            // The API returns status 'success' instead of a boolean success property
            if (data.status === 'success') {
                // Check if barcodes are in the response
                if (data.barcodes && data.barcodes.length > 0) {
                    // Format the data for the displayResults function
                    const formattedData = {
                        total_barcodes: data.barcodes.length,
                        sequences: [
                            {
                                prefix: sequenceBatch[0].prefix,
                                suffix: sequenceBatch[0].suffix,
                                start: sequenceBatch[0].start,
                                count: data.barcodes.length,
                                barcodes: data.barcodes,
                                direction: 1
                            }
                        ]
                    };
                    displayResults(formattedData);
                } else {
                    showError('No barcodes were generated');
                }
            } else {
                showError(data.error || 'Failed to generate barcodes');
            }
        })
        .catch(error => {
            console.error('Error generating sequences:', error);
            showError('Failed to generate barcodes: ' + error.message);
        });
    }
    
    // Display the results of bulk sequence generation
    function displayResults(data) {
        if (!data.sequences || data.sequences.length === 0) {
            showError('No barcodes were generated');
            return;
        }
        
        // Create container for the results
        let html = `
            <div class="mb-4 p-3 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-md">
                <p><i class="fas fa-check-circle mr-2"></i> Successfully generated ${data.total_barcodes} barcodes across ${data.sequences.length} sequences</p>
            </div>
            
            <div class="export-options flex justify-end mb-4">
                <button id="export-all-csv-btn" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded mr-2">
                    <i class="fas fa-file-csv mr-1"></i> Export All to CSV
                </button>
                <button id="download-all-btn" class="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded">
                    <i class="fas fa-download mr-1"></i> Download All
                </button>
            </div>
        `;
        
        // Add accordion for each sequence
        html += '<div class="sequence-results-accordion space-y-4">';
        
        data.sequences.forEach((sequence, index) => {
            // Determine the range display based on direction
            let rangeDisplay;
            if (sequence.direction && sequence.direction < 0) {
                rangeDisplay = `[${sequence.start}-${sequence.start - (sequence.count - 1)}]`;
            } else {
                rangeDisplay = `[${sequence.start}-${sequence.start + (sequence.count - 1)}]`;
            }
            
            html += `
                <div class="sequence-result bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div class="sequence-header flex justify-between items-center p-4 cursor-pointer bg-gray-50 dark:bg-gray-700" data-target="sequence-content-${index}">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                            Sequence #${index + 1}: ${sequence.prefix || ''}${rangeDisplay}${sequence.suffix || ''}
                        </h3>
                        <span class="text-gray-600 dark:text-gray-300">
                            ${sequence.barcodes.length} barcodes <i class="fas fa-chevron-down ml-2"></i>
                        </span>
                    </div>
                    
                    <div id="sequence-content-${index}" class="sequence-content p-4 hidden">
                        <div class="sequence-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            `;
            
            // Add each barcode in this sequence
            sequence.barcodes.forEach(barcode => {
                // If barcode has image_data (base64), use that directly
                // If it has image_url, use that instead
                const imageSource = barcode.image_data || barcode.image_url;
                const downloadUrl = barcode.image_data || barcode.image_url;
                const barcodeId = barcode.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
                
                html += `
                    <div class="barcode-item border border-gray-200 dark:border-gray-700 rounded-md p-3">
                        <div class="barcode-data text-sm text-center mb-2 font-mono">${barcode.data}</div>
                        <div class="barcode-image flex justify-center">
                            <img src="${imageSource}" alt="Barcode: ${barcode.data}" class="max-w-full h-auto">
                        </div>
                        <div class="barcode-actions mt-2 text-center">
                            <a href="${downloadUrl}" download="barcode_${barcodeId}.png" class="text-blue-500 hover:text-blue-700 text-sm">
                                <i class="fas fa-download mr-1"></i> Download
                            </a>
                        </div>
                    </div>
                `;
            });
            
            html += `
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Update results container
        resultsContainer.innerHTML = html;
        
        // Add event listeners for accordion
        document.querySelectorAll('.sequence-header').forEach(header => {
            header.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const targetContent = document.getElementById(targetId);
                
                if (targetContent) {
                    targetContent.classList.toggle('hidden');
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-chevron-down');
                        icon.classList.toggle('fa-chevron-up');
                    }
                }
            });
        });
        
        // Add event listeners for export buttons
        const exportCsvBtn = document.getElementById('export-all-csv-btn');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function() {
                exportAllToCsv(data);
            });
        }
        
        const downloadAllBtn = document.getElementById('download-all-btn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', function() {
                downloadAllBarcodes(data);
            });
        }
    }
    
    // Export all barcodes to CSV
    function exportAllToCsv(data) {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Sequence,Prefix,Suffix,Barcode Data,Barcode Type,ID\n';
        
        data.sequences.forEach((sequence, seqIndex) => {
            sequence.barcodes.forEach(barcode => {
                csvContent += `${seqIndex + 1},${sequence.prefix || ''},${sequence.suffix || ''},${barcode.data},${barcode.barcode_type},${barcode.id}\n`;
            });
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `bulk_sequence_barcodes_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Download all barcodes as ZIP
    function downloadAllBarcodes(data) {
        // Collect all barcode IDs
        const barcodeIds = [];
        data.sequences.forEach(sequence => {
            sequence.barcodes.forEach(barcode => {
                barcodeIds.push(barcode.id);
            });
        });
        
        if (barcodeIds.length === 0) {
            showError('No barcodes to download');
            return;
        }
        
        // Show download status
        const downloadStatus = document.createElement('div');
        downloadStatus.className = 'download-status mt-4 p-3 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-md';
        downloadStatus.innerHTML = `
            <p><i class="fas fa-circle-notch fa-spin mr-2"></i> Preparing ${barcodeIds.length} barcodes for download...</p>
        `;
        resultsContainer.appendChild(downloadStatus);
        
        // Request ZIP file creation
        fetch('/api/user/barcodes/download-zip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: barcodeIds
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to prepare ZIP file');
            }
            
            const downloadToken = response.headers.get('X-Download-Token');
            if (!downloadToken) {
                throw new Error('No download token provided');
            }
            
            return downloadToken;
        })
        .then(token => {
            // Update download status
            downloadStatus.innerHTML = `
                <p><i class="fas fa-check-circle mr-2"></i> ZIP file is ready! Downloading...</p>
            `;
            
            // Trigger download
            window.location.href = `/api/user/barcodes/download-zip?token=${token}`;
            
            // Remove status after a delay
            setTimeout(() => {
                downloadStatus.remove();
            }, 5000);
        })
        .catch(error => {
            downloadStatus.innerHTML = `
                <p><i class="fas fa-exclamation-circle mr-2"></i> Error: ${error.message}</p>
            `;
            console.error('Error downloading ZIP:', error);
            
            // Remove status after a delay
            setTimeout(() => {
                downloadStatus.remove();
            }, 5000);
        });
    }
    
    // Show error message
    function showError(message) {
        resultsContainer.innerHTML = `
            <div class="error-message bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-md">
                <p><i class="fas fa-exclamation-circle mr-2"></i> ${message}</p>
            </div>
        `;
    }
    
    // Get CSRF token from meta tag
    function getCsrfToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        return metaTag ? metaTag.getAttribute('content') : '';
    }
    
    // Initialize on page load
    initBulkSequenceGenerator();
}); 