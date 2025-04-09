/**
 * QR Code Integration Helper
 * This script helps with generating and displaying QR codes from the server API
 */

// Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';
const QR_ENDPOINT = '/generate_qrcode';
const BARCODE_ENDPOINT = '/generate_barcode';
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'X-CSRFToken': ''
};

/**
 * Generate a QR code and display it in the specified container
 * @param {string} data - The data to encode in the QR code
 * @param {string} containerId - The ID of the container element to display the QR code in
 * @param {boolean} isDynamic - Whether this is a dynamic QR code with redirect
 * @param {string} redirectUrl - URL to redirect to (for dynamic QR codes)
 */
function generateAndDisplayQR(data, containerId, isDynamic = false, redirectUrl = '') {
    if (!data) {
        console.error('No data provided for QR code generation');
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container element with ID '${containerId}' not found`);
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="loading">Generating QR code...</div>';
    
    // Prepare the request payload
    const payload = {
        data: data,
        is_dynamic: isDynamic
    };
    
    if (isDynamic && redirectUrl) {
        payload.redirect_url = redirectUrl;
    }
    
    // Make the API request
    fetch(`${API_BASE_URL}${QR_ENDPOINT}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Unknown error generating QR code');
        }
        
        // Store the QR code ID for future reference
        const qrId = data.id;
        
        // Get the image URL
        if (!data.image_url) {
            throw new Error('No image URL in the response');
        }
        
        const imageUrl = `${API_BASE_URL}${data.image_url}`;
        
        // Create a new image element
        const img = new Image();
        img.alt = 'QR Code';
        img.className = 'qr-code';
        
        // Set up load and error handlers
        img.onload = function() {
            console.log('QR code image loaded successfully');
        };
        
        img.onerror = function() {
            console.error('Failed to load QR code image');
            container.innerHTML = `
                <div class="error">
                    <p>Error loading QR code image</p>
                    <p>Try direct link: <a href="${imageUrl}" target="_blank">Open image</a></p>
                </div>
            `;
        };
        
        // Set the source to trigger loading
        img.src = imageUrl;
        
        // Clear the container and append the image
        container.innerHTML = '';
        container.appendChild(img);
        
        // Add download link
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = `qrcode_${qrId}.png`;
        downloadLink.textContent = 'Download QR Code';
        downloadLink.className = 'download-link';
        container.appendChild(downloadLink);
        
        // For direct download, create a separate button that uses fetch+blob approach
        const directDownloadBtn = document.createElement('button');
        directDownloadBtn.textContent = 'Direct Download';
        directDownloadBtn.className = 'direct-download-btn';
        directDownloadBtn.onclick = function() {
            // Fetch the image as a blob
            fetch(imageUrl)
                .then(response => response.blob())
                .then(blob => {
                    // Create an object URL for the blob
                    const url = window.URL.createObjectURL(blob);
                    
                    // Create a temporary link element
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `qrcode_${qrId}_direct.png`;
                    
                    // Add to the DOM, click it, and remove it
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                })
                .catch(error => {
                    console.error('Error downloading image:', error);
                    alert('Failed to download the image. See console for details.');
                });
        };
        container.appendChild(directDownloadBtn);
        
    })
    .catch(error => {
        console.error('Error generating or displaying QR code:', error);
        container.innerHTML = `
            <div class="error">
                <p>Error: ${error.message}</p>
            </div>
        `;
    });
}

/**
 * Generate a barcode and display it in the specified container
 * Similar to generateAndDisplayQR but for barcodes
 */
function generateAndDisplayBarcode(data, barcodeType, containerId, isDynamic = false, redirectUrl = '') {
    if (!data) {
        console.error('No data provided for barcode generation');
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container element with ID '${containerId}' not found`);
        return;
    }
    
    // Show loading state
    container.innerHTML = '<div class="loading">Generating barcode...</div>';
    
    // Prepare the request payload
    const payload = {
        data: data,
        barcode_type: barcodeType,
        is_dynamic: isDynamic
    };
    
    if (isDynamic && redirectUrl) {
        payload.redirect_url = redirectUrl;
    }
    
    // Make the API request
    fetch(`${API_BASE_URL}${BARCODE_ENDPOINT}`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.error || 'Unknown error generating barcode');
        }
        
        // Get the image URL
        if (!data.image_url) {
            throw new Error('No image URL in the response');
        }
        
        const imageUrl = `${API_BASE_URL}${data.image_url}`;
        
        // Create an img element for the barcode
        const img = new Image();
        img.alt = 'Barcode';
        img.className = 'barcode';
        
        // Set up load and error handlers
        img.onload = function() {
            console.log('Barcode image loaded successfully');
        };
        
        img.onerror = function() {
            console.error('Failed to load barcode image');
            container.innerHTML = `
                <div class="error">
                    <p>Error loading barcode image</p>
                    <p>Try direct link: <a href="${imageUrl}" target="_blank">Open image</a></p>
                </div>
            `;
        };
        
        // Set the source to trigger loading
        img.src = imageUrl;
        
        // Clear the container and append the image
        container.innerHTML = '';
        container.appendChild(img);
        
        // Add download link
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = `barcode_${data.id}.png`;
        downloadLink.textContent = 'Download Barcode';
        downloadLink.className = 'download-link';
        container.appendChild(downloadLink);
        
        // Add direct download button
        const directDownloadBtn = document.createElement('button');
        directDownloadBtn.textContent = 'Direct Download';
        directDownloadBtn.className = 'direct-download-btn';
        directDownloadBtn.onclick = function() {
            fetch(imageUrl)
                .then(response => response.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `barcode_${data.id}_direct.png`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                })
                .catch(error => {
                    console.error('Error downloading image:', error);
                    alert('Failed to download the image.');
                });
        };
        container.appendChild(directDownloadBtn);
    })
    .catch(error => {
        console.error('Error generating or displaying barcode:', error);
        container.innerHTML = `
            <div class="error">
                <p>Error: ${error.message}</p>
            </div>
        `;
    });
} 