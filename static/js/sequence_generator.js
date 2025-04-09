/**
 * Sequence Generator - Frontend JS
 * Manages the sequence generation UI with two column layout and export options
 */

document.addEventListener('DOMContentLoaded', function() {
    // Main container
    const sequenceContainer = document.getElementById('sequence-generator-container');
    if (!sequenceContainer) return;

    // Track user authentication state
    let isUserLoggedIn = false;
    let userBarcodes = [];
    
    // Check if user is logged in and handle errors
    function checkAuthStatus() {
        // This would typically be a fetch to an endpoint that returns auth status
        // For now, we'll use a simplified approach
        return new Promise((resolve) => {
            fetch('/api/user/auth_status')
                .then(response => response.json())
                .then(data => {
                    if (data.authenticated) {
                        isUserLoggedIn = true;
                    } else {
                        console.warn('User is not authenticated.');
                        isUserLoggedIn = false;
                    }
                    resolve(isUserLoggedIn);
                })
                .catch(() => {
                    isUserLoggedIn = false;
                    resolve(false);
                });
        });
    }
    
    // Initialize the UI
    async function initSequenceGenerator() {
        try {
        await checkAuthStatus();
        
            // Check if the sequence container exists
            const sequenceContainer = document.getElementById('sequence-generator-container');
            if (!sequenceContainer) {
                console.error('Sequence generator container not found');
                return;
            }
            
            // Add event listeners for export buttons
            const exportCsvBtn = document.getElementById('export-csv-btn');
            if (exportCsvBtn) {
                exportCsvBtn.addEventListener('click', exportToCsv);
            }
            
            const exportSheetBtn = document.getElementById('export-sheet-btn');
            if (exportSheetBtn) {
                exportSheetBtn.addEventListener('click', exportToGoogleSheets);
            }
            
            const exportPdfBtn = document.getElementById('export-pdf-btn');
            if (exportPdfBtn) {
                exportPdfBtn.addEventListener('click', exportToPdf);
            }
            
            const downloadAllBtn = document.getElementById('download-all-btn');
            if (downloadAllBtn) {
                downloadAllBtn.addEventListener('click', downloadAllBarcodes);
            }
        } catch (error) {
            console.error('Error initializing sequence generator:', error);
        }
    }
    
    // Handle form submission
    function handleSequenceFormSubmit(e) {
        e.preventDefault();
        
        try {
        // Show loading state
        const resultsContainer = document.getElementById('sequence-results');
            if (!resultsContainer) {
                console.error('Results container not found');
                return;
            }
            
        resultsContainer.innerHTML = `
            <div class="loading">
                <p>Generating barcodes...</p>
                <div class="spinner"></div>
            </div>
        `;
        
        // Get form data
        const formData = new FormData(e.target);
        const payload = {};
        for (let [key, value] of formData.entries()) {
            // Convert numeric values
            if (['start', 'count', 'pad_length'].includes(key)) {
                    payload[key] = parseInt(value) || 0;
            } else {
                    payload[key] = value || '';
            }
        }
        
        // Validate form data
        const errorMessage = validateFormData(payload);
        if (errorMessage) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <p>Error: ${errorMessage}</p>
                </div>
            `;
            return;
        }
        
        // Make API request with error handling
        fetch('/api/generate_sequence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
        .then(data => {
                if (data && data.success) {
                displaySequenceResults(data);
                const exportOptions = document.querySelector('.export-options');
                if (exportOptions) {
                    exportOptions.style.display = 'flex';
                }
            } else {
                resultsContainer.innerHTML = `
                    <div class="error-message">
                            <p>Error: ${data && data.error ? data.error : 'Failed to generate barcode sequence'}</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error generating sequence:', error);
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <p>Error: ${error.message || 'An unexpected error occurred while generating the sequence.'}</p>
                </div>
            `;
        });
        } catch (error) {
            console.error('Error in form submission:', error);
            alert('An unexpected error occurred. Please try again.');
        }
    }
    
    // Validate form data
    function validateFormData(payload) {
        if (payload.start < 0) {
            return 'Start number cannot be negative.';
        }
        if (payload.count < 1 || payload.count > 1000) {
            return 'Count must be between 1 and 1000.';
        }
        if (payload.pad_length < 0 || payload.pad_length > 20) {
            return 'Padding must be between 0 and 20.';
        }
        return null; // No errors
    }
    
    // Display sequence results in two columns
    function displaySequenceResults(data) {
        const resultsContainer = document.getElementById('sequence-results');
        if (!resultsContainer) {
            console.error('Results container not found');
            return;
        }
        
        // Initialize userBarcodes with proper error handling
        userBarcodes = Array.isArray(data.sequence_data) ? data.sequence_data : [];
        
        if (!userBarcodes || userBarcodes.length === 0) {
            resultsContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">No barcodes were generated.</p>';
            return;
        }
        
        // Show export options
        const exportOptions = document.querySelector('.export-options');
        if (exportOptions) {
            exportOptions.style.display = 'flex';
        }
        
        // Clear existing content and show a grid of barcodes
        resultsContainer.innerHTML = '';
        
        // Create grid container for the barcodes
        const barcodeGrid = document.createElement('div');
        barcodeGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4';
        
        // Add each barcode to the grid
        userBarcodes.forEach((barcode, index) => {
            if (!barcode) {
                console.warn(`Skipping invalid barcode at index ${index}`);
                return;
            }
            
            const barcodeData = barcode.data || `Barcode ${index + 1}`;
            const barcodeImageUrl = barcode.image_url || '';
            
            if (!barcodeImageUrl) {
                console.warn(`Barcode at index ${index} has no image URL`);
                // Create item to show error
                const errorItem = document.createElement('div');
                errorItem.className = 'barcode-item bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-md p-3 shadow-sm';
                errorItem.innerHTML = `
                    <div class="text-center text-sm font-mono mb-2 text-gray-700 dark:text-gray-300">${barcodeData}</div>
                    <div class="flex justify-center mb-2 text-red-600 dark:text-red-400">
                        <i class="fas fa-exclamation-circle mr-2"></i> Image not available
                </div>
            `;
                barcodeGrid.appendChild(errorItem);
                return;
            }
            
            const barcodeItem = document.createElement('div');
            barcodeItem.className = 'barcode-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-sm';
            
            // Add barcode data
            const dataDiv = document.createElement('div');
            dataDiv.className = 'text-center text-sm font-mono mb-2 text-gray-700 dark:text-gray-300';
            dataDiv.textContent = barcodeData;
            barcodeItem.appendChild(dataDiv);
            
            // Add barcode image
            const imgContainer = document.createElement('div');
            imgContainer.className = 'flex justify-center mb-2';
            
            const img = document.createElement('img');
            img.src = barcodeImageUrl;
            img.alt = `Barcode: ${barcodeData}`;
            img.className = 'max-w-full h-auto';
            
            // Add error handling for image loading
            img.onerror = function() {
                console.error(`Failed to load image for barcode ${index}: ${barcodeData}`);
                this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzg4OCIgdGV4dC1sZW5ndGg9IjE4MCI+SW1hZ2UgbG9hZCBmYWlsZWQ8L3RleHQ+PC9zdmc+';
                this.alt = 'Image load failed';
            };
            
            imgContainer.appendChild(img);
            barcodeItem.appendChild(imgContainer);
            
            // Add download link
            const actions = document.createElement('div');
            actions.className = 'flex justify-center';
            
            const downloadLink = document.createElement('a');
            downloadLink.href = barcodeImageUrl;
            downloadLink.download = `barcode_${barcode.id || index}.png`;
            downloadLink.className = 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm';
            downloadLink.innerHTML = '<i class="fas fa-download mr-1"></i> Download';
            
            // Handle data URI downloads for temporary barcodes
            if (barcodeImageUrl.startsWith('data:')) {
                downloadLink.addEventListener('click', function(e) {
                    try {
                        // For data URLs, we need special handling for the download attribute to work
                        const link = document.createElement('a');
                        link.href = barcodeImageUrl;
                        link.download = `barcode_${barcode.id || index}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (error) {
                        console.error('Error handling download:', error);
                        showExportStatus('Failed to download barcode', 'error');
                    }
                    e.preventDefault();
                });
            }
            
            actions.appendChild(downloadLink);
            barcodeItem.appendChild(actions);
            
            // Add to grid
            barcodeGrid.appendChild(barcodeItem);
        });
        
        resultsContainer.appendChild(barcodeGrid);
        
        // Add status message
        const statusMsg = document.createElement('div');
        statusMsg.className = 'mt-4 p-3 rounded-md text-sm';
        
        if (data.saved_to_account) {
            statusMsg.className += ' bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-100';
            statusMsg.innerHTML = '<i class="fas fa-check-circle mr-1"></i> These barcodes have been saved to your account.';
        } else if (data.saved_to_system) {
            statusMsg.className += ' bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
            statusMsg.innerHTML = '<i class="fas fa-info-circle mr-1"></i> These barcodes are saved on the server but not linked to an account.';
        } else {
            statusMsg.className += ' bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
            statusMsg.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i> These barcodes are temporary and will be lost when you leave the page.';
        }
        
        resultsContainer.appendChild(statusMsg);
        
        // Add failure message if any
        if (data.failed && data.failed.length > 0) {
            const failureMsg = document.createElement('div');
            failureMsg.className = 'mt-4 p-3 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md text-sm';
            failureMsg.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i> ${data.failed.length} barcodes could not be generated due to validation errors.`;
            resultsContainer.appendChild(failureMsg);
        }
    }
    
    // Export to CSV
    function exportToCsv() {
        if (!userBarcodes || userBarcodes.length === 0) {
            showExportStatus('No barcodes to export', 'error');
            return;
        }
        
        try {
        if (isUserLoggedIn) {
            // Use server-side export for authenticated users
            window.location.href = '/api/user/barcodes/export/csv';
        } else {
            // Client-side export for non-authenticated users
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "ID,Data,Type,Image URL\n";
            
                // Filter out invalid barcodes before processing
                const validBarcodes = userBarcodes.filter(barcode => barcode && typeof barcode === 'object');
                
                validBarcodes.forEach((barcode, index) => {
                    const id = barcode.id || `temp_${index}`;
                    const data = barcode.data || '';
                    const type = barcode.barcode_type || 'Unknown';
                    const imageUrl = barcode.image_url || '';
                    
                    // Escape double quotes in CSV data
                    const escapedData = data.replace(/"/g, '""');
                    
                    csvContent += `${id},"${escapedData}","${type}","${imageUrl}"\n`;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `barcodes_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showExportStatus('CSV file downloaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            showExportStatus('Failed to export to CSV: ' + error.message, 'error');
        }
    }
    
    // Export to Google Sheets
    function exportToGoogleSheets() {
        try {
        if (!isUserLoggedIn) {
            showExportStatus('Please sign in to export to Google Sheets', 'error');
            return;
        }
        
            if (!userBarcodes || userBarcodes.length === 0) {
            showExportStatus('No barcodes to export', 'error');
            return;
        }
        
        // Show loading status
        showExportStatus('Exporting to Google Sheets...', 'loading');
        
        // Make API call to server to initiate Google Sheets export
        fetch('/api/user/barcodes/export/sheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    barcodes: userBarcodes.filter(barcode => barcode && typeof barcode === 'object')
                        .map(barcode => ({
                            id: barcode.id || '',
                            data: barcode.data || '',
                            type: barcode.barcode_type || 'Unknown'
                        }))
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                return response.json();
            })
        .then(data => {
                if (data && data.success && data.sheet_url) {
                    showExportStatus(`Exported to Google Sheets successfully. <a href="${data.sheet_url}" target="_blank" rel="noopener noreferrer">Open Sheet</a>`, 'success');
            } else {
                    showExportStatus(`Export failed: ${data && data.error ? data.error : 'Unknown error'}`, 'error');
            }
        })
        .catch(error => {
                console.error('Google Sheets export error:', error);
            showExportStatus(`Export failed: ${error.message || 'Connection error'}`, 'error');
            });
        } catch (error) {
            console.error('Error in Google Sheets export function:', error);
            showExportStatus(`Export error: ${error.message || 'Unexpected error'}`, 'error');
        }
    }
    
    // Export to PDF
    function exportToPdf() {
        if (!userBarcodes || userBarcodes.length === 0) {
            showExportStatus('No barcodes to export', 'error');
            return;
        }

        showExportStatus('Preparing PDF...', 'loading');
        
        // Create a temporary container for PDF layout
        const pdfContainer = document.createElement('div');
        pdfContainer.className = 'pdf-container';
        
        // Create grid for barcodes
        const barcodeGrid = document.createElement('div');
        barcodeGrid.className = 'barcode-grid';
        
        // Add barcodes to grid
        userBarcodes.forEach(barcode => {
            const barcodeItem = document.createElement('div');
            barcodeItem.className = 'barcode-item';
            barcodeItem.innerHTML = `
                <div class="barcode-data">${barcode.data}</div>
                <div class="barcode-image">
                    <img src="${barcode.image_url}" alt="Barcode ${barcode.data}">
                </div>
            `;
            barcodeGrid.appendChild(barcodeItem);
        });
        
        pdfContainer.appendChild(barcodeGrid);
        
        // Use html2pdf.js to generate PDF
        const opt = {
            margin: 10,
            filename: 'barcode_sequence.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(pdfContainer).save().then(() => {
            showExportStatus('PDF exported successfully', 'success');
        }).catch(error => {
            console.error('PDF generation error:', error);
            showExportStatus('Error generating PDF', 'error');
        });
    }
    
    // Download all barcodes as zip
    function downloadAllBarcodes() {
        if (!userBarcodes || userBarcodes.length === 0) {
            showExportStatus('No barcodes to download', 'error');
            return;
        }
        
        // Check if any barcode is using a data URI (temporary barcode)
        const hasDataURIBarcodes = userBarcodes.some(barcode => 
            barcode && barcode.image_url && barcode.image_url.startsWith('data:')
        );
        
        // If we have temporary barcodes, handle client-side downloads
        if (hasDataURIBarcodes) {
            downloadTemporaryBarcodes();
            return;
        }
        
        showExportStatus('Preparing download...', 'loading');
        
        // Create a list of barcode IDs to download
        const barcodeIds = userBarcodes
            .filter(barcode => barcode && barcode.id)
            .map(barcode => barcode.id);
        
        // If user is logged in, use server-side zip creation
        if (isUserLoggedIn && barcodeIds.length > 0) {
            fetch('/api/user/barcodes/download-zip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ ids: barcodeIds })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create download package');
                }
                
                // Check for download token in response
                const downloadToken = response.headers.get('X-Download-Token');
                if (!downloadToken) {
                    return response.json().then(data => {
                        if (data && data.download_url) {
                            return data.download_url;
                        }
                        throw new Error('No download information provided');
                    });
                }
                
                return `/api/user/barcodes/download-zip?token=${downloadToken}`;
            })
            .then(downloadUrl => {
                // Trigger the download
                window.location.href = downloadUrl;
                showExportStatus('Download initiated', 'success');
            })
            .catch(error => {
                console.error('Download error:', error);
                showExportStatus(`Download failed: ${error.message}`, 'error');
            });
        } else {
            // For non-logged in users with non-temporary barcodes, use a simpler approach
            const queryParams = barcodeIds.map(id => `id=${id}`).join('&');
            window.location.href = `/api/barcodes/download-zip?${queryParams}`;
            showExportStatus('Download initiated', 'success');
        }
    }
    
    // Download temporary barcodes that exist only in the browser
    function downloadTemporaryBarcodes() {
        showExportStatus('Preparing temporary barcodes for download...', 'loading');
        
        // Filter out invalid barcodes
        const validBarcodes = userBarcodes.filter(barcode => 
            barcode && (barcode.image_url || barcode.image_data) && barcode.data
        );
        
        if (validBarcodes.length === 0) {
            showExportStatus('No valid barcodes to download', 'error');
            return;
        }
        
        // Use JSZip library if available
        if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            let completedDownloads = 0;
            
            // Function to update progress
            const updateProgress = () => {
                completedDownloads++;
                showExportStatus(`Processing: ${completedDownloads} of ${validBarcodes.length} barcodes`, 'loading');
            };
            
            // Add each barcode to the zip file
            validBarcodes.forEach((barcode, index) => {
                const filename = `barcode_${index+1}_${barcode.data}.png`;
                
                if (barcode.image_data && barcode.image_data.startsWith('data:')) {
                    try {
                        // For data URLs, extract the base64 content
                        const parts = barcode.image_data.split(',');
                        if (parts.length > 1) {
                            const base64Data = parts[1];
                            zip.file(filename, base64Data, {base64: true});
                            updateProgress();
                        } else {
                            console.error(`Invalid data URL format for barcode ${index}`);
                            updateProgress();
                        }
                    } catch(e) {
                        console.error(`Error processing data URL for barcode ${index}:`, e);
                        updateProgress();
                    }
                } else if (barcode.image_url) {
                    // For server URLs, ensure we're requesting image format not JSON
                    const fetchUrl = barcode.image_url.startsWith('/') && !barcode.image_url.includes('?') ? 
                        `${barcode.image_url}?download=true` : barcode.image_url;
                    
                    fetch(fetchUrl)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Failed to fetch image: ${response.status}`);
                            }
                            return response.blob();
                        })
                        .then(blob => {
                            zip.file(filename, blob);
                            updateProgress();
                        })
                        .catch(error => {
                            console.error(`Error fetching ${filename}:`, error);
                            updateProgress();
                        });
                } else {
                    console.error(`No valid image source for barcode ${index}`);
                    updateProgress();
                }
            });
            
            // Generate the zip file and trigger download
                setTimeout(() => {
                zip.generateAsync({type:'blob'})
                    .then(content => {
                        // Create a download link
                    const link = document.createElement('a');
                        link.href = URL.createObjectURL(content);
                        link.download = `barcodes_${new Date().toISOString().slice(0,10)}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                        showExportStatus('All barcodes downloaded as ZIP', 'success');
                    })
                    .catch(error => {
                        console.error('Error creating ZIP:', error);
                        showExportStatus('Failed to create ZIP file', 'error');
                    });
            }, 500);
        } else {
            // Fallback for when JSZip is not available: download one by one
            showExportStatus('Downloading barcodes individually...', 'loading');
            
            // Create a container to show individual download links
            const downloadContainer = document.createElement('div');
            downloadContainer.className = 'mt-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700';
            downloadContainer.innerHTML = `
                <p class="mb-2 text-sm text-gray-700 dark:text-gray-300">
                    Click each link below to download individual barcodes:
                </p>
                <div class="space-y-2 text-sm">
                    ${validBarcodes.map((barcode, idx) => 
                        `<div>
                            <a href="${barcode.image_url}" download="barcode_${idx+1}_${barcode.data}.png" 
                               class="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                               <i class="fas fa-download mr-1"></i> Barcode ${idx+1}: ${barcode.data}
                            </a>
                        </div>`
                    ).join('')}
                </div>
            `;
            
            // Add download links to the results area
            const resultsContainer = document.getElementById('sequence-results');
            if (resultsContainer) {
                resultsContainer.appendChild(downloadContainer);
            } else {
                console.error('Results container not found for download links');
            }
            
            showExportStatus('Click each link to download individual barcodes', 'info');
        }
    }
    
    // Show export status message
    function showExportStatus(message, type) {
        const statusElement = document.getElementById('export-status');
        if (!statusElement) return;
        
        statusElement.classList.remove('hidden', 'bg-green-50', 'bg-red-50', 'bg-blue-50', 'bg-yellow-50');
        statusElement.classList.add('block');
        
        switch (type) {
            case 'success':
                statusElement.classList.add('bg-green-50', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-100');
                statusElement.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ${message}`;
                break;
            case 'error':
                statusElement.classList.add('bg-red-50', 'dark:bg-red-900', 'text-red-800', 'dark:text-red-100');
                statusElement.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i> ${message}`;
                break;
            case 'loading':
                statusElement.classList.add('bg-blue-50', 'dark:bg-blue-900', 'text-blue-800', 'dark:text-blue-100');
                statusElement.innerHTML = `<i class="fas fa-circle-notch fa-spin mr-2"></i> ${message}`;
                break;
            case 'info':
                statusElement.classList.add('bg-yellow-50', 'dark:bg-yellow-900', 'text-yellow-800', 'dark:text-yellow-100');
                statusElement.innerHTML = `<i class="fas fa-info-circle mr-2"></i> ${message}`;
                break;
        }
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 5000);
        }
    }
    
    // Helper to get CSRF token from cookies
    function getCsrfToken() {
        const name = 'csrf_token=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i].trim();
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        console.warn('CSRF token not found. Ensure you are logged in.');
        return '';
    }
    
    // Initialize the sequence generator
    initSequenceGenerator();
});
