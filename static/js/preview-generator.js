/**
 * Barcode and QR Code Preview Generator
 * Provides real-time preview functionality as the user inputs data
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize preview functionality
    initBarcodePreview();
    initQRCodePreview();
    
    /**
     * Set up real-time barcode preview
     */
    function initBarcodePreview() {
        // Create preview container if it doesn't exist
        const barcodeForm = window.safeDOM.getElement('barcode-form');
        if (!barcodeForm) return;
        
        // Create or get the preview container
        let previewContainer = window.safeDOM.getElement('barcode-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'barcode-preview-container';
            previewContainer.className = 'preview-container bg-gray-50 border rounded-md p-4 mb-4 text-center hidden';
            
            // Find where to insert the preview (before the submit button)
            const submitButton = barcodeForm.querySelector('button[type="submit"]');
            if (submitButton && submitButton.parentNode) {
                submitButton.parentNode.insertBefore(previewContainer, submitButton);
            } else {
                barcodeForm.appendChild(previewContainer);
            }
        }
        
        // Create or get the preview canvas
        let previewCanvas = window.safeDOM.getElement('barcode-preview-canvas');
        if (!previewCanvas) {
            previewCanvas = document.createElement('svg');
            previewCanvas.id = 'barcode-preview-canvas';
            previewCanvas.className = 'mx-auto';
            previewContainer.appendChild(previewCanvas);
            
            // Add preview label
            const previewLabel = document.createElement('div');
            previewLabel.className = 'text-sm text-gray-500 mt-2';
            previewLabel.textContent = 'Preview - will be generated on submit';
            previewContainer.appendChild(previewLabel);
        }
        
        // Get form input elements
        const dataInput = window.safeDOM.getElement('barcode_data');
        const typeSelect = window.safeDOM.getElement('barcode_type');
        
        if (!dataInput || !typeSelect) return;
        
        // Function to update the barcode preview
        function updateBarcodePreview() {
            const data = dataInput.value.trim();
            const type = typeSelect.value;
            
            if (data.length > 0) {
                try {
                    // Clear previous barcode
                    JsBarcode(previewCanvas, data, {
                        format: type.toUpperCase(),
                        lineColor: "#000",
                        background: "#fff",
                        width: 2,
                        height: 80,
                        displayValue: true,
                        fontSize: 14,
                        margin: 10,
                        valid: function(valid) {
                            if (valid) {
                                previewContainer.classList.remove('hidden');
                                // Clear any validation errors for successful preview
                                FormValidator.clearError('barcode_data');
                            } else {
                                previewContainer.classList.add('hidden');
                                FormValidator.showError('barcode_data', 'Invalid barcode data for this format');
                            }
                        }
                    });
                } catch (error) {
                    console.warn('Barcode preview error:', error);
                    previewContainer.classList.add('hidden');
                }
            } else {
                previewContainer.classList.add('hidden');
            }
        }
        
        // Add event listeners with debounce
        let debounceTimer;
        dataInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateBarcodePreview, 300);
        });
        
        typeSelect.addEventListener('change', updateBarcodePreview);
    }
    
    /**
     * Set up real-time QR code preview using qrcodejs library
     */
    function initQRCodePreview() {
        // Create preview container if it doesn't exist
        const qrForm = window.safeDOM.getElement('qrcode-form');
        if (!qrForm) return;
        
        // Create or get the preview container
        let previewContainer = window.safeDOM.getElement('qrcode-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'qrcode-preview-container';
            previewContainer.className = 'preview-container bg-gray-50 border rounded-md p-4 mb-4 text-center hidden';
            
            // Find where to insert the preview (before the submit button)
            const submitButton = qrForm.querySelector('button[type="submit"]');
            if (submitButton && submitButton.parentNode) {
                submitButton.parentNode.insertBefore(previewContainer, submitButton);
            } else {
                qrForm.appendChild(previewContainer);
            }
        }
        
        // Create or get the preview div for QR code
        let previewDiv = window.safeDOM.getElement('qrcode-preview-div');
        if (!previewDiv) {
            previewDiv = document.createElement('div');
            previewDiv.id = 'qrcode-preview-div';
            previewDiv.className = 'mx-auto inline-block';
            previewContainer.appendChild(previewDiv);
            
            // Add preview label
            const previewLabel = document.createElement('div');
            previewLabel.className = 'text-sm text-gray-500 mt-2';
            previewLabel.textContent = 'Preview - final version will be generated on submit';
            previewContainer.appendChild(previewLabel);
        }
        
        // Initialize QR code generator
        let qrcode = null;
        
        // Get form input element
        const dataInput = window.safeDOM.getElement('qr_data');
        if (!dataInput) return;
        
        // Function to update the QR code preview
        function updateQRCodePreview() {
            const data = dataInput.value.trim();
            
            if (data.length > 0) {
                // Clear previous QR code
                previewDiv.innerHTML = '';
                
                // Create new QR code
                try {
                    qrcode = new QRCode(previewDiv, {
                        text: data,
                        width: 128,
                        height: 128,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M
                    });
                    
                    previewContainer.classList.remove('hidden');
                } catch (error) {
                    console.warn('QR code preview error:', error);
                    previewContainer.classList.add('hidden');
                }
            } else {
                previewContainer.classList.add('hidden');
            }
        }
        
        // Add event listener with debounce
        let debounceTimer;
        dataInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateQRCodePreview, 300);
        });
    }
}); 