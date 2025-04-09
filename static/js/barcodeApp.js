/**
 * Barcode and QR Code Generator Application
 * Handles all the frontend interactions for barcode generation
 */

// Optional: Uncommment if you need to add the class to html element
// document.documentElement.classList.add('expansion-alids-init');

document.addEventListener('DOMContentLoaded', function() {
    // Define safeDOM methods if not already defined
    window.safeDOM = window.safeDOM || {
        getElement: function(id) {
            return document.getElementById(id);
        },
        getValue: function(id, defaultValue) {
            const element = this.getElement(id);
            return element ? element.value || defaultValue : defaultValue;
        },
        getElementValue: function(id, defaultValue) {
            const element = this.getElement(id);
            return element ? element.value || defaultValue : defaultValue;
        },
        addEventListener: function(id, event, callback) {
            const element = this.getElement(id);
            if (element) {
                element.addEventListener(event, callback);
            }
        },
        createElementIfNotExists: function(id, tagName, parentId, options) {
            if (!this.getElement(id)) {
                const parent = this.getElement(parentId);
                if (parent) {
                    const element = document.createElement(tagName);
                    element.id = id;
                    if (options && options.className) {
                        element.className = options.className;
                    }
                    parent.appendChild(element);
                    return element;
                }
            }
            return this.getElement(id);
        }
    };

    // Check rate limits on page load
    checkRateLimits();
    
    // Set up periodic rate limit checks (every 5 minutes)
    setInterval(checkRateLimits, 300000);
    
    // Rate limit indicator functions
    function checkRateLimits() {
        // Wrap in try/catch to prevent unhandled rejections
        try {
            return fetch('/api/rate_limit_status')
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 429) {
                            // Handle rate limit exceeded gracefully
                            console.warn('[Rate Limit] Rate limit exceeded. Some features may be temporarily unavailable.');
                            updateRateLimitUI(true);
                            return { exceeded: true };
                        }
                        throw new Error('Failed to fetch rate limit status');
                    }
                    return response.json();
                })
                .then(data => {
                    updateRateLimitUI(data.exceeded);
                    return data;
                })
                .catch(error => {
                    console.warn('[Rate Limit] Failed to check rate limits:', error);
                    // Don't update UI on network errors to avoid false positives
                    return { exceeded: false, error: true };
                });
        } catch (e) {
            console.error('[Rate Limit] Error in rate limit check:', e);
            return Promise.resolve({ exceeded: false, error: true });
        }
    }
    
    // Add loadAnalytics function if it's missing
    if (typeof loadAnalytics !== 'function') {
        window.loadAnalytics = function() {
            console.log('Analytics loading placeholder - implement full functionality if needed');
            return Promise.resolve();
        };
    }
    
    function updateRateLimitIndicators(data) {
        // Safety check for data structure
        if (!data || !data.limits) {
            console.warn('Rate limit data is missing or has unexpected structure', data);
            return;
        }
        
        const limits = data.limits;
        const userRole = data.user_role || 'guest';
        
        // Update UI components with rate limit info
        const indicators = {
            'barcode-rate-limit': 'barcode_generation',
            'qrcode-rate-limit': 'qrcode_generation',
            'sequence-rate-limit': 'sequence_generation'
        };
        
        // Create or update rate limit indicators for each endpoint type
        for (const [elementId, endpointType] of Object.entries(indicators)) {
            if (!limits[endpointType]) {
                console.warn(`Rate limit data for ${endpointType} not found`);
                continue;
            }
            
            const limitInfo = limits[endpointType];
            
            // Find or create the indicator element
            let indicator = window.safeDOM.getElement(elementId);
            if (!indicator) {
                // If the element doesn't exist, create a container for it
                const container = document.createElement('div');
                container.id = elementId;
                container.className = 'rate-limit-indicator text-xs text-gray-500 mt-1';
                
                // Find the appropriate form to append to
                let form;
                if (endpointType === 'barcode_generation') {
                    form = window.safeDOM.getElement('barcode-form');
                } else if (endpointType === 'qrcode_generation') {
                    form = window.safeDOM.getElement('qrcode-form');
                } else if (endpointType === 'sequence_generation') {
                    form = window.safeDOM.getElement('sequence-form');
                }
                
                if (form) {
                    // Add before the form's submit button
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn && submitBtn.parentNode) {
                        submitBtn.parentNode.insertBefore(container, submitBtn);
                    } else {
                        form.appendChild(container);
                    }
                    indicator = container;
                }
            }
            
            if (indicator) {
                // If limitInfo is a string (like "100 per day")
                let requestCount = '100';
                let timeFrame = 'day';
                
                if (typeof limitInfo === 'string') {
                    try {
                        const limitParts = limitInfo.split(',')[0].trim().split(' ');
                        requestCount = limitParts[0] || '100';
                        timeFrame = limitParts[2] || 'day';
                    } catch (e) {
                        console.warn('Could not parse limit string:', limitInfo);
                    }
                }
                
                // Get remaining count if available
                let remaining = '';
                if (limits.remaining && limits.remaining[endpointType]) {
                    remaining = ` (${limits.remaining[endpointType]} remaining)`;
                }
                
                indicator.innerHTML = `
                    <span class="inline-block">
                        <i class="fas fa-tachometer-alt mr-1"></i>
                        <span>Rate limit: ${requestCount} per ${timeFrame}${remaining}</span>
                        <span class="user-role ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">
                            ${userRole.replace('_', ' ')}
                        </span>
                    </span>
                `;
            }
        }
    }
    
    // Tab switching functionality
    const tabs = document.querySelectorAll('#tabs a');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function to switch tabs
    function switchToTab(tabElement) {
        if (!tabElement) return;
        
        console.log("Switching to tab:", tabElement.getAttribute('data-target'));
        
        // Remove active class from all tabs
        tabs.forEach(t => {
            t.classList.remove('border-primary-600');
            t.classList.add('border-transparent');
            t.classList.remove('active');
        });
        
        // Add active class to the selected tab
        tabElement.classList.add('border-primary-600');
        tabElement.classList.remove('border-transparent');
        tabElement.classList.add('active');
        
        // Hide all tab contents
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        
        // Show the corresponding tab content
        const targetId = tabElement.getAttribute('data-target');
        const targetContent = window.safeDOM.getElement(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
            console.log("Tab content shown:", targetId);
        } else {
            console.error("Tab content not found:", targetId);
        }
    }
    
    // Handle hash changes
    function handleHashChange() {
        const hash = window.location.hash;
        console.log("Hash changed to:", hash);
        
        if (hash) {
            // Remove the # symbol
            const targetId = hash.substring(1);
            
            // Find the tab with matching data-target attribute
            const targetTab = document.querySelector(`#tabs a[data-target='${targetId}']`);
            
            if (targetTab) {
                switchToTab(targetTab);
                
                // If switching to sequence tab, automatically run debug diagnostics
                if (targetId === 'sequence-tab') {
                    console.log("Sequence tab detected, running diagnostics...");
                    // Small delay to ensure the tab is fully loaded
                    setTimeout(function() {
                        console.log("Running sequence tab diagnostics");
                        
                        // Check if sequence-list exists in sequence-results
                        const sequenceResults = window.safeDOM.getElement('sequence-results');
                        
                        if (sequenceResults) {
                            // Create sequence-list if it doesn't exist
                            window.safeDOM.createElementIfNotExists('sequence-list', 'ul', 'sequence-results', {
                                className: 'sequence-list'
                            });
                            
                            console.log("Sequence results contents:", sequenceResults.innerHTML.substring(0, 100) + '...');
                        } else {
                            console.warn("Sequence results container not found - will be created when needed");
                        }
                    }, 500);
                }
            } else {
                console.error("No tab found with data-target:", targetId);
            }
        } else {
            // If no hash, default to first tab
            const firstTab = document.querySelector('#tabs a');
            if (firstTab) {
                switchToTab(firstTab);
            }
        }
    }
    
    // Add click event listeners to tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update the URL hash to trigger the hashchange event
            const targetId = this.getAttribute('data-target');
            window.location.hash = targetId;
        });
    });
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial tab setup based on hash
    if (window.location.hash) {
        handleHashChange();
    } else {
        // Default to first tab if no hash
        const firstTab = document.querySelector('#tabs a');
        if (firstTab) {
            switchToTab(firstTab);
        }
    }

    // Initialize form event listeners
    initFormHandlers();

    // Barcode type info text
    const barcodeTypeInfo = {
        'code128': 'Code 128: Alphanumeric data with high density',
        'code39': 'Code 39: Alphanumeric data, commonly used in industry',
        'ean13': 'EAN-13: 13-digit product identification code',
        'ean8': 'EAN-8: 8-digit product identification code',
        'upca': 'UPC-A: 12-digit product identification code'
    };

    // Update barcode type info based on selection
    const barcodeType = window.safeDOM.getElement('barcode_type');
    const barcodeTypeInfoElement = window.safeDOM.getElement('barcode-type-info');
    
    if (barcodeType && barcodeTypeInfoElement) {
        barcodeType.addEventListener('change', function() {
            const selectedType = this.value;
            barcodeTypeInfoElement.textContent = barcodeTypeInfo[selectedType] || '';
        });
    }

    // Generate Barcode Button
    window.safeDOM.addEventListener('generate-barcode-btn', 'click', function(e) {
            e.preventDefault();
            generateBarcode();
        });

    // Generate QR Code Button
    window.safeDOM.addEventListener('generate-qr-btn', 'click', function(e) {
            e.preventDefault();
            generateQRCode();
        });

    // Generate Sequence Button
    window.safeDOM.addEventListener('generate-sequence-btn', 'click', function(e) {
            e.preventDefault();
            generateSequence();
        });

    // Toggle redirect URL fields based on dynamic checkbox for barcode
    const barcodeIsDynamic = window.safeDOM.getElement('barcode_is_dynamic');
    const barcodeRedirectContainer = window.safeDOM.getElement('barcode_redirect_container');
    
    if (barcodeIsDynamic && barcodeRedirectContainer) {
        barcodeIsDynamic.addEventListener('change', function() {
            if (this.checked) {
                barcodeRedirectContainer.classList.remove('hidden');
            } else {
                barcodeRedirectContainer.classList.add('hidden');
            }
        });
    }
    
    // Toggle redirect URL fields based on dynamic checkbox for QR code
    const qrIsDynamic = window.safeDOM.getElement('qr_is_dynamic');
    const qrRedirectContainer = window.safeDOM.getElement('qr_redirect_container');
    
    if (qrIsDynamic && qrRedirectContainer) {
        qrIsDynamic.addEventListener('change', function() {
            if (this.checked) {
                qrRedirectContainer.classList.remove('hidden');
            } else {
                qrRedirectContainer.classList.add('hidden');
            }
        });
    }

    /*************************************************************
     * 1) Generate a barcode
    *************************************************************/
    function generateBarcode() {
        // Get form data
        const barcodeData = document.getElementById('barcode_data')?.value || '';
        const barcodeType = document.getElementById('barcode_type')?.value || 'code128';
        
        // Get save toggle value (default to false if user is not logged in)
        let saveToSystem = false;
        const saveToggle = document.getElementById('save-barcode-toggle');
        if (saveToggle) {
            saveToSystem = saveToggle.checked;
        }
        
        // Validation
        if (!barcodeData) {
            showValidationError('barcode_data', 'Please enter data for the barcode');
            return;
        }
        
        // Create request data
        const requestData = {
            data: barcodeData,
            barcode_type: barcodeType,
            save: saveToSystem
        };
        
        // Show loading state
        const resultElement = document.getElementById('barcode-result');
        if (resultElement) {
            resultElement.innerHTML = '<div class="loading-spinner"></div><p class="text-center mt-2">Generating barcode...</p>';
        }
        
        // Generate barcode
        fetch('/generate_barcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Barcode generation response:", data);
            console.log("Image data type:", typeof data.image_data);
            if (data.image_data) {
                console.log("Image data starts with:", data.image_data.substring(0, 30) + "...");
            }
            displayBarcodeResult(data);
        })
        .catch(error => {
            console.error('Error generating barcode:', error);
            if (resultElement) {
                resultElement.innerHTML = '<div class="error-message">Error generating barcode. Please try again.</div>';
            }
        });
    }

    /*************************************************************
     * 2) Generate a QR code
    *************************************************************/
    function generateQRCode() {
        // Get form data
        const qrData = document.getElementById('qr_data')?.value || '';
        const isDynamic = document.getElementById('qr_dynamic')?.checked || false;
        const redirectUrl = isDynamic ? (document.getElementById('qr_redirect_url')?.value || '') : '';
        
        // Get save toggle value (default to false if user is not logged in)
        let saveToSystem = false;
        const saveToggle = document.getElementById('save-qr-toggle');
        if (saveToggle) {
            saveToSystem = saveToggle.checked;
        }
        
        // Validation
        if (!qrData) {
            showValidationError('qr_data', 'Please enter data for the QR code');
            return;
        }
        
        if (isDynamic && !redirectUrl) {
            showValidationError('qr_redirect_url', 'Please enter a redirect URL for dynamic QR codes');
            return;
        }
        
        // Create request data
        const requestData = {
            data: qrData,
            is_dynamic: isDynamic,
            redirect_url: redirectUrl,
            save: saveToSystem
        };
        
        // Show loading state
        const resultElement = document.getElementById('qr-result');
        if (resultElement) {
            resultElement.innerHTML = '<div class="loading-spinner"></div><p class="text-center mt-2">Generating QR code...</p>';
        }
        
        // Generate QR code
        fetch('/generate_qrcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            displayQRCodeResult(data);
        })
        .catch(error => {
            console.error('Error generating QR code:', error);
            if (resultElement) {
                resultElement.innerHTML = '<div class="error-message">Error generating QR code. Please try again.</div>';
            }
        });
    }

    /*************************************************************
     * 3) Generate a sequence of barcodes
    *************************************************************/
    function generateSequence() {
        // Safely get form elements
        const prefixInput = window.safeDOM.getElement('seq_prefix');
        const startInput = window.safeDOM.getElement('seq_start');
        const countInput = window.safeDOM.getElement('seq_count');
        const padLengthInput = window.safeDOM.getElement('seq_pad');
        const suffixInput = window.safeDOM.getElement('seq_suffix');
        const typeSelect = window.safeDOM.getElement('seq_type');
        
        // Get values with null checks
        const prefix = prefixInput ? prefixInput.value || '' : '';
        const startNum = startInput ? parseInt(startInput.value || '1') : 1;
        const count = countInput ? parseInt(countInput.value || '10') : 10;
        const padLength = padLengthInput ? parseInt(padLengthInput.value || '0') : 0;
        const suffix = suffixInput ? suffixInput.value || '' : '';
        const barcodeType = typeSelect ? typeSelect.value || 'code128' : 'code128';
        
        // Get the results container and export options
        const resultContainer = window.safeDOM.getElement('sequence-results');
        const exportOptions = window.safeDOM.getElement('export-options');
        
        // Validate inputs
        if (count <= 0 || count > 1000) {
            showToast('Count must be between 1 and 1000', 'error');
            return Promise.reject('Invalid count');
        }
        
        if (padLength < 0 || padLength > 20) {
            showToast('Padding length must be between 0 and 20', 'error');
            return Promise.reject('Invalid padding length');
        }
        
        // Show loading state in result container
        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="flex justify-center items-center py-10">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <span class="ml-3 text-gray-600 dark:text-gray-300">Generating ${count} barcodes...</span>
                </div>
            `;
        }
        
        // Show loading state on generate button
        const generateBtn = window.safeDOM.getElement('generate-sequence-btn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Generating...';
        }
        
        // Prepare the request data
        const requestData = {
            prefix,
            start: startNum,
            count,
            pad_length: padLength,
            barcode_type: barcodeType,
            suffix,
            save_to_system: false // Do not save temporary barcodes
        };
        
        console.log("Generating sequence with data:", requestData);
        
        // Make the API request
        return axios.post('/generate_sequence', requestData, {
                headers: { 'Content-Type': 'application/json' }
        })
        .then(function(response) {
            console.log("Sequence generation response:", response.data);
            
            // Check if response data exists
            if (response && response.data) {
                // Store barcodes for export functionality
                window.userBarcodes = response.data.barcodes || [];
                
                // Display the generated sequence
                displaySequenceResult(response.data);
                
                // Show export options if barcodes were generated
                if (exportOptions && window.userBarcodes.length > 0) {
                    exportOptions.classList.remove('hidden');
                }
                
                // Show success message
                showToast(`Generated ${window.userBarcodes.length} barcodes successfully`, 'success');
                return response.data;
            } else {
                throw new Error("Invalid response from server");
            }
        })
        .catch(function(error) {
            console.error('Error generating sequence:', error);
            
            if (resultContainer) {
                let errorMessage = 'An error occurred while generating the sequence.';
                
            if (error.response && error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
                
                resultContainer.innerHTML = `
                    <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-200">
                        <p class="flex items-center">
                            <i class="fas fa-exclamation-circle mr-2"></i>
                            ${errorMessage}
                        </p>
                    </div>
                `;
            }
            
            showToast('Failed to generate barcode sequence', 'error');
            return Promise.reject(error);
        })
        .finally(function() {
            // Reset generate button state
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = 'Generate Sequence';
            }
        });
    }

    /*************************************************************
     * Setup Export Buttons
    *************************************************************/
    function setupExportButtons(barcodes) {
        const exportCsvBtn = window.safeDOM.getElement('export-csv-btn');
        const downloadAllBtn = window.safeDOM.getElement('download-all-btn');
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function() {
                exportSequenceToCsv(barcodes);
            });
        }
        
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', function() {
                downloadAllSequenceBarcodes(barcodes);
            });
        }
    }
    
    /*************************************************************
     * Export sequence to CSV
    *************************************************************/
    function exportSequenceToCsv(barcodes) {
        if (!barcodes || barcodes.length === 0) {
            showExportStatus('No barcodes to export', 'error');
            return;
        }
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Data,Type,Image URL\n";
        
        barcodes.forEach(barcode => {
            // For temp barcodes with base64 data, use a placeholder URL
            const imageUrl = barcode.image_url || 'data:image/png;base64,...';
            csvContent += `${barcode.id || 'temp'},"${barcode.data || ''}","${barcode.barcode_type || 'code128'}","${imageUrl}"\n`;
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `barcodes_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        document.body.removeChild(link);
        
        showExportStatus('CSV file downloaded successfully', 'success');
    }
    
    /*************************************************************
     * Download all barcodes
    *************************************************************/
    function downloadAllSequenceBarcodes(barcodes) {
        if (!barcodes || barcodes.length === 0) {
            showExportStatus('No barcodes to download', 'error');
            return;
        }
        
        showExportStatus('Download will start shortly. Please allow multiple downloads.', 'info');
        
        // For temporary barcodes, trigger downloads one by one
        barcodes.forEach((barcode, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                // Use image_data (base64) for temp barcodes or image_url for saved barcodes
                link.href = barcode.image_data || barcode.image_url || `/barcode/${barcode.id}`;
                link.download = `barcode_${barcode.data || barcode.id || index}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                if (index === barcodes.length - 1) {
                    showExportStatus('All downloads completed', 'success');
                }
            }, index * 300); // 300ms delay between downloads
        });
    }
    
    /*************************************************************
     * Show export status message
    *************************************************************/
    function showExportStatus(message, type) {
        const statusElement = window.safeDOM.getElement('export-status');
        if (!statusElement) return;
        
        statusElement.innerHTML = message;
        statusElement.className = 'mt-4 px-4 py-2 rounded-md';
        
        // Add appropriate styling based on message type
        if (type === 'success') {
            statusElement.classList.add('bg-green-50', 'text-green-800', 'border', 'border-green-200');
        } else if (type === 'error') {
            statusElement.classList.add('bg-red-50', 'text-red-800', 'border', 'border-red-200');
        } else if (type === 'info') {
            statusElement.classList.add('bg-blue-50', 'text-blue-800', 'border', 'border-blue-200');
        }
        
        statusElement.classList.remove('hidden');
        
        // Clear message after some time for success and info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 5000);
        }
    }

    /*************************************************************
     * Display Barcode Result
    *************************************************************/
    function displayBarcodeResult(data) {
        const resultElement = window.safeDOM.getElement('barcode-result');
        if (!resultElement) return;
        
        console.log("Displaying barcode result:", data);
        
        if (data.status === 'success') {
            let imageUrl;
            let downloadUrl;
            let downloadFilename;
            let savedStatus;
            
            // Handle different response formats for saved vs temporary barcodes
            if (data.id > 0) {
                console.log("Displaying saved barcode with ID:", data.id);
                // Saved barcode
                imageUrl = data.image_url;
                // Add download parameter for server-side downloads
                downloadUrl = data.image_url + (data.image_url.includes('?') ? '&' : '?') + 'download=true';
                downloadFilename = `barcode_${data.id}.png`;
                savedStatus = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Yes - Saved to your account</span>';
            } else {
                console.log("Displaying temp barcode with image_data");
                // For temporary barcodes, use the base64 image data directly
                imageUrl = data.image_data;
                downloadUrl = imageUrl;
                downloadFilename = `barcode_${data.data || 'temp'}.png`;
                savedStatus = '<span class="text-gray-600"><i class="fas fa-info-circle mr-1"></i>No - Login to save barcodes</span>';
            }
            
            console.log("Image URL being used:", imageUrl ? imageUrl.substring(0, 30) + "..." : "undefined");
            
            resultElement.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                    <div class="text-center">
                        <h3 class="text-lg font-semibold mb-4">Generated Barcode</h3>
                        <div class="barcode-image-container mb-4">
                            <img src="${imageUrl}" alt="Barcode: ${data.data}" class="mx-auto max-w-full">
                        </div>
                        <div class="barcode-details text-left grid grid-cols-1 gap-2 mb-4">
                            <div class="detail-row">
                                <span class="font-medium">Data:</span> 
                                <span class="detail-value">${data.data}</span>
                            </div>
                            <div class="detail-row">
                                <span class="font-medium">Type:</span> 
                                <span class="detail-value">${data.barcode_type}</span>
                            </div>
                            <div class="detail-row">
                                <span class="font-medium">Saved:</span> 
                                <span class="detail-value">${savedStatus}</span>
                            </div>
                        </div>
                        <div class="barcode-actions flex flex-wrap justify-center gap-2">
                            <a href="${downloadUrl}" download="${downloadFilename}" class="btn-secondary px-4 py-2 flex items-center">
                                <i class="fas fa-download mr-2"></i> Download
                            </a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Display error
            resultElement.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Error:</strong>
                    <span class="block sm:inline">${data.error || 'Failed to generate barcode'}</span>
                </div>
            `;
        }
    }

    /*************************************************************
     * Display QR Code Result
    *************************************************************/
    function displayQRCodeResult(data) {
        const resultElement = window.safeDOM.getElement('qr-result');
        if (!resultElement) return;
        
        if (data.status === 'success') {
            let imageUrl;
            let downloadUrl;
            let downloadFilename;
            let savedStatus;
            
            // Handle different response formats for saved vs temporary QR codes
            if (data.id > 0) {
                // Saved QR code
                imageUrl = data.image_url;
                // Add download parameter for server-side downloads
                downloadUrl = data.image_url + (data.image_url.includes('?') ? '&' : '?') + 'download=true';
                downloadFilename = `qrcode_${data.id}.png`;
                savedStatus = '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Yes - Saved to your account</span>';
            } else {
                // For temporary QR codes, use the base64 image data directly
                imageUrl = data.image_data;
                downloadUrl = imageUrl;
                downloadFilename = `qrcode_${data.data || 'temp'}.png`;
                savedStatus = '<span class="text-gray-600"><i class="fas fa-info-circle mr-1"></i>No - Login to save QR codes</span>';
            }
            
            let dynamicInfo = '';
            if (data.is_dynamic) {
                dynamicInfo = `
                    <div class="detail-row">
                        <span class="font-medium">Redirect URL:</span> 
                        <span class="detail-value break-all">${data.redirect_url}</span>
                    </div>
                `;
            }
            
            resultElement.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                    <div class="text-center">
                        <h3 class="text-lg font-semibold mb-4">Generated QR Code</h3>
                        <div class="qr-image-container mb-4">
                            <img src="${imageUrl}" alt="QR Code: ${data.data}" class="mx-auto max-w-full">
                        </div>
                        <div class="qr-details text-left grid grid-cols-1 gap-2 mb-4">
                            <div class="detail-row">
                                <span class="font-medium">Data:</span> 
                                <span class="detail-value break-all">${data.data}</span>
                            </div>
                            <div class="detail-row">
                                <span class="font-medium">Dynamic:</span> 
                                <span class="detail-value">${data.is_dynamic ? 'Yes' : 'No'}</span>
                            </div>
                            ${dynamicInfo}
                            <div class="detail-row">
                                <span class="font-medium">Saved:</span> 
                                <span class="detail-value">${savedStatus}</span>
                            </div>
                        </div>
                        <div class="qr-actions flex flex-wrap justify-center gap-2">
                            <a href="${downloadUrl}" download="${downloadFilename}" class="btn-secondary px-4 py-2 flex items-center">
                                <i class="fas fa-download mr-2"></i> Download
                            </a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Display error
            resultElement.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Error:</strong>
                    <span class="block sm:inline">${data.error || 'Failed to generate QR code'}</span>
                </div>
            `;
        }
    }

    /*************************************************************
     * Display Sequence Result
    *************************************************************/
    function displaySequenceResult(data) {
        console.log("Displaying sequence result:", data);
        
        // Safely get the results container
        const resultsContainer = window.safeDOM.getElement('sequence-results');
        if (!resultsContainer) {
            console.error("Could not find sequence-results container");
            return;
        }

        // Clear previous results
        resultsContainer.innerHTML = '';
        
        // Check if we have data to display
        const barcodes = data.barcodes || [];
        
        if (!barcodes || barcodes.length === 0) {
            resultsContainer.innerHTML = `
                <div class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-700 dark:text-yellow-200">
                    <p class="flex items-center">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        No barcodes were generated
                    </p>
                </div>
            `;
                        return;
                    }
                    
        // Create a grid layout for the barcodes
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4';
        
        // Process all barcodes
        barcodes.forEach((barcode, index) => {
            // Create card for each barcode
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 flex flex-col items-center';
            
            // Add barcode image
                        const img = document.createElement('img');
            if (barcode.image_data) {
                // For temporary barcodes with image_data
                        img.src = barcode.image_data;
            } else if (barcode.image_url) {
                // For saved barcodes with image_url
                img.src = barcode.image_url;
                    } else {
                // Fallback for barcodes with just an ID
                img.src = `/barcode/${barcode.id}`;
            }
            img.alt = `Barcode: ${barcode.data || ''}`;
            img.className = 'max-w-full h-auto mb-3';
            
            // Add barcode data
            const dataDiv = document.createElement('div');
            dataDiv.className = 'text-sm text-gray-800 dark:text-gray-200 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-full text-center overflow-x-auto';
            dataDiv.textContent = barcode.data || '';
                
                // Add download link
                const downloadLink = document.createElement('a');
            if (barcode.image_data) {
                // For temporary barcodes, use the base64 image data
                downloadLink.href = barcode.image_data;
            } else if (barcode.image_url) {
                // For saved barcodes, add download parameter
                downloadLink.href = barcode.image_url + (barcode.image_url.includes('?') ? '&' : '?') + 'download=true';
            } else {
                // Fallback for barcodes with just an ID
                downloadLink.href = `/barcode/${barcode.id}?download=true`;
            }
            downloadLink.download = `barcode_${barcode.data || `seq_${index+1}`}.png`;
            downloadLink.className = 'mt-3 text-primary-600 hover:text-primary-700 text-sm flex items-center';
            downloadLink.innerHTML = '<i class="fas fa-download mr-1"></i> Download';
            
            // Assemble the card
            card.appendChild(img);
            card.appendChild(dataDiv);
            card.appendChild(downloadLink);
            
            // Add to grid
            grid.appendChild(card);
        });
        
        // Add the grid to results container
        resultsContainer.appendChild(grid);
        
        // Add summary information
        const summary = document.createElement('div');
        summary.className = 'mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300';
        
        // Add warning for temporary barcodes or success for saved ones
        if (data.saved) {
            summary.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                    <div>
                        <h4 class="font-medium">Successfully generated and saved ${barcodes.length} barcodes</h4>
                        <p class="text-sm mt-1">These barcodes have been saved to your account and will be available in your history.</p>
                    </div>
                </div>
            `;
        } else {
            summary.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-info-circle text-blue-500 mt-1 mr-3"></i>
                    <div>
                        <h4 class="font-medium">Generated ${barcodes.length} temporary barcodes</h4>
                        <p class="text-sm mt-1">These barcodes are temporary and will not be saved. Please download any barcodes you wish to keep.</p>
                    </div>
                </div>
            `;
        }
        
        // Add to results container
        resultsContainer.appendChild(summary);
        
        // Add bulk download button
        const bulkDownloadBtn = document.createElement('button');
        bulkDownloadBtn.className = 'mt-4 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-center';
        bulkDownloadBtn.innerHTML = '<i class="fas fa-cloud-download-alt mr-2"></i> Download All Barcodes';
        bulkDownloadBtn.addEventListener('click', function() {
            downloadAllSequenceBarcodes(barcodes);
        });
        
        // Add to results container
        resultsContainer.appendChild(bulkDownloadBtn);
    }

    // Function to show validation error
    function showValidationError(elementId, message) {
        const element = window.safeDOM.getElement(elementId);
        if (element) {
            element.textContent = message;
            element.classList.remove('hidden');
        }
    }

    // Function to hide validation error
    function hideValidationError(elementId) {
        const element = window.safeDOM.getElement(elementId);
        if (element) {
            element.classList.add('hidden');
        }
    }

    /*************************************************************
     * Barcode History
    *************************************************************/
    function loadBarcodeHistory() {
        axios.get('/api/get_barcodes')
            .then(function(response) {
                if (response && response.data && response.data.barcodes) {
                    displayBarcodeHistory(response.data.barcodes);
                } else {
                    console.error('No data received from history API');
                }
            })
            .catch(function(error) {
                console.error('Error loading barcode history:', error);
            });
    }

    // Display barcode history with improved layout
    function displayBarcodeHistory(barcodes) {
        const historyContainer = window.safeDOM.getElement('history_list');
        if (!historyContainer) return;
        
        // Clear previous results
        historyContainer.innerHTML = '';
        
        if (!barcodes || !barcodes.length) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'text-gray-600 dark:text-gray-300 text-center py-8';
            emptyMessage.textContent = 'No barcode history found.';
            historyContainer.appendChild(emptyMessage);
            return;
        }
        
        // Display barcodes
        barcodes.forEach(barcode => {
            if (!barcode || !barcode.id) return; // Skip invalid entries
            
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow mb-4';
            
            const header = document.createElement('div');
            header.className = 'bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b dark:border-gray-600';
            
            const title = document.createElement('h3');
            title.className = 'text-gray-800 dark:text-white font-medium';
            title.textContent = barcode.barcode_type ? barcode.barcode_type.toUpperCase() : 'BARCODE';
            
            const content = document.createElement('div');
            content.className = 'p-4';
            
            const image = document.createElement('img');
            image.src = `/barcode/${barcode.id}`;
            image.alt = barcode.data || '';
            image.className = 'mx-auto mb-3';
            
            const dataText = document.createElement('p');
            dataText.className = 'text-sm text-gray-600 dark:text-gray-300 mb-2 text-center';
            dataText.textContent = barcode.data || '';
            
            const footer = document.createElement('div');
            footer.className = 'flex justify-between items-center mt-3';
            
            const date = document.createElement('span');
            date.className = 'text-xs text-gray-500 dark:text-gray-400';
            try {
                const createdDate = new Date(barcode.created_at);
                date.textContent = createdDate.toLocaleDateString();
            } catch (e) {
                date.textContent = 'Unknown date';
            }
            
            const downloadLink = document.createElement('a');
            downloadLink.href = `/barcode/${barcode.id}?download=true`;
            downloadLink.download = `${barcode.barcode_type || 'barcode'}_${barcode.id}.png`;
            downloadLink.className = 'text-primary-600 hover:text-primary-800 text-sm font-medium';
            downloadLink.textContent = 'Download';
            
            footer.appendChild(date);
            footer.appendChild(downloadLink);
            
            header.appendChild(title);
            content.appendChild(image);
            content.appendChild(dataText);
            content.appendChild(footer);
            
            card.appendChild(header);
            card.appendChild(content);
            
            historyContainer.appendChild(card);
        });
    }

    // Load history when the history tab is clicked
    const historyTab = window.safeDOM.getElement('tab-history');
    if (historyTab) {
        historyTab.addEventListener('click', function() {
            loadBarcodeHistory();
        });
    }

    // Load the history immediately if we're on the history tab
    const historyTabContent = window.safeDOM.getElement('history-tab');
    if (historyTabContent && historyTabContent.style.display !== 'none') {
        loadBarcodeHistory();
    }

    // Set up theme toggle
    const themeToggle = window.safeDOM.getElement('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });
        
        // Set initial theme based on localStorage or system preference
        if (localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
});

/*************************************************************
 * Initialize Form Handlers
 *************************************************************/
function initFormHandlers() {
    // Check authentication status
    let isUserLoggedIn = false;
    
    // Get and setup save toggles
    const saveBarcodeToggle = window.safeDOM.getElement('save-barcode-toggle');
    const saveQRToggle = window.safeDOM.getElement('save-qr-toggle');
    const saveSequenceToggle = window.safeDOM.getElement('save-sequence-toggle');
    
    // Check authentication status
    fetch('/api/user/auth_status')
        .then(response => response.json())
        .then(data => {
            isUserLoggedIn = data.authenticated || false;
            
            // Update UI based on authentication status
            updateSaveToggles(isUserLoggedIn);
        })
        .catch(error => {
            console.error('Error checking authentication status:', error);
            isUserLoggedIn = false;
            updateSaveToggles(false);
        });
    
    function updateSaveToggles(isLoggedIn) {
        // Update save toggles based on authentication status
        [saveBarcodeToggle, saveQRToggle, saveSequenceToggle].forEach(toggle => {
            if (toggle) {
                if (!isLoggedIn) {
                    toggle.checked = false;
                    toggle.disabled = true;
                    
                    // Add a tooltip or message
                    const parentLabel = toggle.parentElement;
                    if (parentLabel && parentLabel.tagName === 'LABEL') {
                        parentLabel.classList.add('opacity-50');
                        
                        const helpText = document.createElement('div');
                        helpText.className = 'text-xs text-gray-500 mt-1';
                        helpText.innerHTML = '<i class="fas fa-info-circle mr-1"></i>Login to save barcodes';
                        
                        // Insert after the label
                        if (parentLabel.nextSibling) {
                            parentLabel.parentNode.insertBefore(helpText, parentLabel.nextSibling);
                        } else {
                            parentLabel.parentNode.appendChild(helpText);
                        }
                    }
                } else {
                    toggle.disabled = false;
                    
                    // Enable the toggle and set default to true for logged in users
                    toggle.checked = true;
                    
                    const parentLabel = toggle.parentElement;
                    if (parentLabel) {
                        parentLabel.classList.remove('opacity-50');
                    }
                }
            }
        });
    }
    
    // Initialize form validation
    initFormValidation();
    
    // Single barcode form handler
    const barcodeForm = window.safeDOM.getElement('barcode-form');
    if (barcodeForm) {
        barcodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                barcode_data: window.safeDOM.getValue('barcode_data', ''),
                barcode_type: window.safeDOM.getValue('barcode_type', 'code128'),
                barcode_is_dynamic: window.safeDOM.getElement('barcode_is_dynamic')?.checked || false,
                barcode_redirect_url: window.safeDOM.getValue('barcode_redirect_url', '')
            };
            
            // Define validation rules
            const validationRules = {
                barcode_data: { type: 'text', required: true, minLength: 1, maxLength: 255 }
            };
            
            // Add dynamic URL validation if needed
            if (formData.barcode_is_dynamic) {
                validationRules.barcode_redirect_url = { type: 'url', required: true };
            }
            
            // Validate form
            const validationResult = FormValidator.validateForm(formData, validationRules);
            
            // If valid, generate barcode
            if (validationResult.isValid) {
            generateBarcode();
            }
        });
    }
    
    // QR code form handler
    const qrcodeForm = window.safeDOM.getElement('qrcode-form');
    if (qrcodeForm) {
        qrcodeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                qr_data: window.safeDOM.getValue('qr_data', ''),
                qr_is_dynamic: window.safeDOM.getElement('qr_dynamic') ? window.safeDOM.getElement('qr_dynamic').checked : false,
                qr_redirect_url: window.safeDOM.getValue('qr_redirect_url', '')
            };
            
            // Define validation rules
            const validationRules = {
                qr_data: { type: 'text', required: true, minLength: 1, maxLength: 512 }
            };
            
            // Add dynamic URL validation if needed
            if (formData.qr_is_dynamic) {
                validationRules.qr_redirect_url = { type: 'url', required: true };
            }
            
            // Validate form
            const validationResult = FormValidator.validateForm(formData, validationRules);
            
            // If valid, generate QR code
            if (validationResult.isValid) {
            generateQRCode();
            }
        });
    }
    
    // Sequence form handler
    const sequenceForm = document.getElementById('sequence-form');
    if (sequenceForm) {
        // Remove any existing event listeners
        const newForm = sequenceForm.cloneNode(true);
        sequenceForm.parentNode.replaceChild(newForm, sequenceForm);
        
        // Add event listener to the new form
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                seq_prefix: document.getElementById('seq_prefix')?.value || '',
                seq_start: document.getElementById('seq_start')?.value || '1',
                seq_count: document.getElementById('seq_count')?.value || '10',
                seq_pad: document.getElementById('seq_pad')?.value || '0',
                seq_suffix: document.getElementById('seq_suffix')?.value || '',
                seq_type: document.getElementById('seq_type')?.value || 'code128'
            };
            
            // Define validation rules
            const validationRules = {
                seq_start: { type: 'number', required: true, min: 0, integer: true },
                seq_count: { type: 'number', required: true, min: 1, max: 1000, integer: true },
                seq_pad: { type: 'number', required: true, min: 0, max: 10, integer: true }
            };
            
            // Validate form
            const validationResult = FormValidator.validateForm(formData, validationRules);
            
            // If valid, generate sequence
            if (validationResult.isValid) {
            generateSequence();
            }
        });
    }
    
    // Setup bulk sequence generator button
    const bulkSequenceBtn = window.safeDOM.getElement('bulk-sequence-btn');
    if (bulkSequenceBtn) {
        // For anchor tag, no need for click handler as it navigates directly
        // Just add some visual feedback
        bulkSequenceBtn.addEventListener('mousedown', function() {
            this.classList.add('active-btn');
        });
        bulkSequenceBtn.addEventListener('mouseup', function() {
            this.classList.remove('active-btn');
        });
        bulkSequenceBtn.addEventListener('mouseleave', function() {
            this.classList.remove('active-btn');
        });
    }
    
    // Toggle for advanced options
    const toggleAdvanced = window.safeDOM.getElement('toggle-advanced');
    const advancedOptions = window.safeDOM.getElement('advanced-options');
    if (toggleAdvanced && advancedOptions) {
        toggleAdvanced.addEventListener('click', function() {
            if (advancedOptions.classList.contains('hidden')) {
                advancedOptions.classList.remove('hidden');
                toggleAdvanced.textContent = 'Hide Advanced Options';
            } else {
                advancedOptions.classList.add('hidden');
                toggleAdvanced.textContent = 'Show Advanced Options';
            }
        });
    }
}

/*************************************************************
 * Debug Functions for Sequence Generator
 *************************************************************/
function debugSequenceGenerator() {
    console.log("========= Debugging Sequence Generator =========");
    
    // Check if sequence tab exists
    const sequenceTab = window.safeDOM.getElement('sequence-tab');
    console.log("Sequence Tab Element:", sequenceTab ? "Found" : "Not Found");
    if (sequenceTab) {
        console.log("Sequence Tab Display:", getComputedStyle(sequenceTab).display);
        console.log("Sequence Tab Classes:", sequenceTab.className);
    }
    
    // Check if form exists
    const sequenceForm = window.safeDOM.getElement('sequence-form');
    console.log("Sequence Form Element:", sequenceForm ? "Found" : "Not Found");
    if (sequenceForm) {
        console.log("Form Action:", sequenceForm.action);
        console.log("Form Method:", sequenceForm.method);
        
        // Check form inputs
        const inputs = sequenceForm.querySelectorAll('input, select');
        console.log("Form Input Count:", inputs.length);
        
        inputs.forEach(input => {
            console.log(`Input "${input.name || input.id}":`, {
                type: input.type,
                value: input.value,
                id: input.id
            });
        });
    }
    
    // Check results container
    const resultsContainer = window.safeDOM.getElement('sequence-results');
    console.log("Results Container:", resultsContainer ? "Found" : "Not Found");
    if (resultsContainer) {
        console.log("Results Container Children:", resultsContainer.children.length);
        console.log("Results Container HTML:", resultsContainer.innerHTML.substring(0, 100) + '...');
    }
    
    // Try to generate a test sequence
    console.log("Attempting to generate a test sequence...");
    try {
        axios.post('/generate_sequence', 
            {
                prefix: 'DEBUG',
                start: 1,
                count: 3,
                pad_length: 2,
                barcode_type: 'code128',
                suffix: '-TEST',
                save_to_system: false
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        )
        .then(function(response) {
            console.log("Debug Sequence API Response:", response.data);
            
            if (response.data.sequence_data) {
                console.log("First Debug Barcode:", {
                    data: response.data.sequence_data[0].data,
                    hasImageData: !!response.data.sequence_data[0].image_data
                });
            }
            
            // Try to manually create and display a barcode element
            if (resultsContainer && response.data.sequence_data) {
                const testBarcodeDiv = document.createElement('div');
                testBarcodeDiv.className = 'debug-barcode';
                testBarcodeDiv.style = 'padding: 10px; border: 2px solid red; margin: 10px; text-align: center;';
                
                const barcodeData = response.data.sequence_data[0];
                
                // Add image
                const img = document.createElement('img');
                img.src = barcodeData.image_data;
                img.alt = 'Debug Barcode';
                img.style = 'max-width: 200px; height: auto;';
                
                // Add text
                const p = document.createElement('p');
                p.textContent = `Debug Barcode: ${barcodeData.data}`;
                
                testBarcodeDiv.appendChild(p);
                testBarcodeDiv.appendChild(img);
                
                // Clear container and add test element
                resultsContainer.innerHTML = '';
                resultsContainer.appendChild(testBarcodeDiv);
                
                console.log("Added debug barcode element to results container");
            }
        })
        .catch(function(error) {
            console.error("Debug Sequence API Error:", error);
        });
    } catch (e) {
        console.error("Exception during debug sequence generation:", e);
    }
}

// Expose debug function globally so it can be called from the console
window.debugSequenceGenerator = debugSequenceGenerator;

// Listen for message events from other windows (for debugging)
window.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'runDebugSequenceGenerator') {
        console.log("Received debug command from debug window");
        setTimeout(function() {
            debugSequenceGenerator();
        }, 500);
    }
});

/**
 * Form validation utilities
 */
if (typeof FormValidator === 'undefined') {
    window.FormValidator = {
        /**
         * Validates a text input for basic requirements
         * @param {string} value - The input value to validate
         * @param {Object} options - Validation options
         * @returns {Object} - Validation result with isValid and message properties
         */
        validateText: function(value, options = {}) {
            const { required = true, minLength = 1, maxLength = 255, pattern = null } = options;
            
            // Required check
            if (required && (!value || value.trim() === '')) {
                return { isValid: false, message: 'This field is required' };
            }
            
            // Min length check
            if (value && value.length < minLength) {
                return { isValid: false, message: `Minimum length is ${minLength} characters` };
            }
            
            // Max length check
            if (value && value.length > maxLength) {
                return { isValid: false, message: `Maximum length is ${maxLength} characters` };
            }
            
            // Pattern check
            if (pattern && value && !pattern.test(value)) {
                return { isValid: false, message: 'Invalid format' };
            }
            
            return { isValid: true, message: '' };
        },
        
        /**
         * Validates a numeric input
         * @param {string|number} value - The input value to validate
         * @param {Object} options - Validation options
         * @returns {Object} - Validation result with isValid and message properties
         */
        validateNumber: function(value, options = {}) {
            const { required = true, min = null, max = null, integer = false } = options;
            
            // Required check
            if (required && (value === null || value === undefined || value === '')) {
                return { isValid: false, message: 'This field is required' };
            }
            
            // Parse as number
            const num = Number(value);
            
            // Valid number check
            if (value !== '' && isNaN(num)) {
                return { isValid: false, message: 'Must be a valid number' };
            }
            
            // Integer check
            if (integer && value !== '' && !Number.isInteger(num)) {
                return { isValid: false, message: 'Must be a whole number' };
            }
            
            // Min value check
            if (min !== null && num < min) {
                return { isValid: false, message: `Minimum value is ${min}` };
            }
            
            // Max value check
            if (max !== null && num > max) {
                return { isValid: false, message: `Maximum value is ${max}` };
            }
            
            return { isValid: true, message: '' };
        },
        
        /**
         * Validates an URL input
         * @param {string} value - The URL to validate
         * @param {Object} options - Validation options
         * @returns {Object} - Validation result with isValid and message properties
         */
        validateUrl: function(value, options = {}) {
            const { required = false } = options;
            
            // Required check
            if (required && (!value || value.trim() === '')) {
                return { isValid: false, message: 'URL is required' };
            }
            
            // Skip validation if empty and not required
            if (!required && (!value || value.trim() === '')) {
                return { isValid: true, message: '' };
            }
            
            // URL pattern check
            const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
            if (!urlPattern.test(value)) {
                return { isValid: false, message: 'Must be a valid URL' };
            }
            
            return { isValid: true, message: '' };
        },
        
        /**
         * Validates an email input
         * @param {string} value - The email to validate
         * @param {Object} options - Validation options
         * @returns {Object} - Validation result with isValid and message properties
         */
        validateEmail: function(value, options = {}) {
            const { required = true } = options;
            
            // Required check
            if (required && (!value || value.trim() === '')) {
                return { isValid: false, message: 'Email is required' };
            }
            
            // Skip validation if empty and not required
            if (!required && (!value || value.trim() === '')) {
                return { isValid: true, message: '' };
            }
            
            // Email pattern check
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(value)) {
                return { isValid: false, message: 'Must be a valid email address' };
            }
            
            return { isValid: true, message: '' };
        },
        
        /**
         * Shows a validation error message
         * @param {string} inputId - The ID of the input element
         * @param {string} message - The error message to display
         */
        showError: function(inputId, message) {
            const input = window.safeDOM.getElement(inputId);
            if (!input) return;
            
            // Add error styling to the input
            input.classList.add('border-red-500');
            
            // Find or create the error message element
            let errorElement = document.querySelector(`#${inputId}-error`);
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = `${inputId}-error`;
                errorElement.className = 'text-red-500 text-xs mt-1';
                input.parentNode.insertBefore(errorElement, input.nextSibling);
            }
            
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        },
        
        /**
         * Clears a validation error
         * @param {string} inputId - The ID of the input element
         */
        clearError: function(inputId) {
            const input = window.safeDOM.getElement(inputId);
            if (!input) return;
            
            // Remove error styling
            input.classList.remove('border-red-500');
            
            // Hide error message
            const errorElement = document.querySelector(`#${inputId}-error`);
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.add('hidden');
            }
        },
        
        /**
         * Validates a form using specified validation rules
         * @param {Object} formData - Object containing form field values
         * @param {Object} validationRules - Rules for each field
         * @returns {Object} - Result with isValid flag and errors object
         */
        validateForm: function(formData, validationRules) {
            const errors = {};
            let isValid = true;
            
            for (const [field, rules] of Object.entries(validationRules)) {
                const value = formData[field];
                let result;
                
                // Apply the appropriate validation function
                switch (rules.type) {
                    case 'text':
                        result = this.validateText(value, rules);
                        break;
                    case 'number':
                        result = this.validateNumber(value, rules);
                        break;
                    case 'url':
                        result = this.validateUrl(value, rules);
                        break;
                    case 'email':
                        result = this.validateEmail(value, rules);
                        break;
                    default:
                        result = { isValid: true, message: '' };
                }
                
                // If invalid, store the error and update overall validity
                if (!result.isValid) {
                    errors[field] = result.message;
                    isValid = false;
                    
                    // Show the error in the UI
                    this.showError(field, result.message);
                } else {
                    // Clear any existing error
                    this.clearError(field);
                }
            }
            
            return { isValid, errors };
        }
    };
}

// Add input validation for form fields
function initFormValidation() {
    // Define input fields to validate on change/input
    const fieldsToValidate = [
        { id: 'barcode_data', rules: { type: 'text', required: true, minLength: 1, maxLength: 255 } },
        { id: 'barcode_redirect_url', rules: { type: 'url', required: false } },
        { id: 'qr_data', rules: { type: 'text', required: true, minLength: 1, maxLength: 512 } },
        { id: 'qr_redirect_url', rules: { type: 'url', required: false } },
        { id: 'seq_prefix', rules: { type: 'text', required: false, maxLength: 50 } },
        { id: 'seq_start', rules: { type: 'number', required: true, min: 0, integer: true } },
        { id: 'seq_count', rules: { type: 'number', required: true, min: 1, max: 1000, integer: true } },
        { id: 'seq_pad', rules: { type: 'number', required: true, min: 0, max: 10, integer: true } },
        { id: 'seq_suffix', rules: { type: 'text', required: false, maxLength: 50 } }
    ];
    
    // Add validation listeners to each field
    fieldsToValidate.forEach(field => {
        const input = window.safeDOM.getElement(field.id);
        if (input) {
            // Validate on input with debounce
            let debounceTimer;
            input.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const result = FormValidator.validateText(this.value, field.rules);
                    if (!result.isValid) {
                        FormValidator.showError(field.id, result.message);
                    } else {
                        FormValidator.clearError(field.id);
                    }
                }, 300);
            });
            
            // Also validate on blur (when user leaves the field)
            input.addEventListener('blur', function() {
                const result = FormValidator.validateText(this.value, field.rules);
                if (!result.isValid) {
                    FormValidator.showError(field.id, result.message);
                } else {
                    FormValidator.clearError(field.id);
                }
            });
        }
    });
}
