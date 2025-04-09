/**
 * Camera Scanner for Barcode Generator
 * Use device camera to scan barcodes and QR codes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize camera scanner
    initCameraScanner();
    
    /**
     * Set up camera scanner functionality
     */
    function initCameraScanner() {
        // Create camera tab UI if it doesn't exist yet
        setupCameraUI();
        
        // Add event listeners for camera functions
        setupCameraListeners();
    }
    
    /**
     * Create the camera scanner UI
     */
    function setupCameraUI() {
        // Find the tabs list and check if camera tab already exists
        const tabsList = document.querySelector('#tabs');
        if (!tabsList) return;
        
        // Check if camera tab exists
        let cameraTab = document.querySelector('#tab-scanner');
        if (!cameraTab) {
            // Create a new tab
            const tabItem = document.createElement('li');
            tabItem.className = 'mr-2 flex-1 md:flex-none';
            tabItem.innerHTML = `
                <a href="#" class="inline-block w-full p-4 border-b-2 border-transparent rounded-t-lg"
                id="tab-scanner" data-target="scanner-tab">
                    <i class="fas fa-camera mr-2"></i>Scanner
                </a>
            `;
            tabsList.appendChild(tabItem);
            
            // Create the tab content
            const tabContents = document.querySelector('.tab-panel-container');
            if (!tabContents) return;
            
            const cameraTabContent = document.createElement('div');
            cameraTabContent.id = 'scanner-tab';
            cameraTabContent.className = 'tab-content hidden';
            cameraTabContent.innerHTML = `
                <div class="grid md:grid-cols-2 gap-8">
                    <!-- Camera View -->
                    <div class="space-y-5 flex flex-col">
                        <div class="bg-primary-50 dark:bg-gray-700 rounded-lg p-5 border border-primary-100 dark:border-gray-600 
                               hover:shadow-md transition-shadow">
                            <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                <i class="fas fa-camera mr-2 text-primary-500"></i>
                                Barcode Scanner
                            </h2>
                            
                            <div class="camera-container relative aspect-video bg-black rounded-md overflow-hidden mb-4">
                                <video id="camera-preview" class="w-full h-full object-cover" playsinline></video>
                                <div id="camera-overlay" class="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none"></div>
                                <div id="scanning-indicator" class="absolute top-2 left-2 flex items-center bg-black/70 text-white text-xs py-1 px-2 rounded-md">
                                    <i class="fas fa-sync fa-spin mr-1"></i>
                                    <span>Scanning...</span>
                                </div>
                                <div id="scanner-result" class="absolute bottom-0 left-0 right-0 bg-primary-600 text-white py-3 px-4 text-center transform translate-y-full transition-transform duration-300">
                                    <p class="font-medium">Barcode detected!</p>
                                    <p id="scanned-value" class="text-sm mt-1 overflow-hidden text-ellipsis"></p>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                <!-- Camera controls -->
                                <div class="flex justify-between">
                                    <button id="start-camera-btn" class="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                                        <i class="fas fa-play mr-2"></i>
                                        Start Camera
                                    </button>
                                    <button id="stop-camera-btn" class="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors" disabled>
                                        <i class="fas fa-stop mr-2"></i>
                                        Stop Camera
                                    </button>
                                </div>
                                
                                <!-- Camera selection -->
                                <div>
                                    <label for="camera-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Select Camera
                                    </label>
                                    <select id="camera-select" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                                        <option value="">Loading cameras...</option>
                                    </select>
                                </div>
                                
                                <!-- Scanner Settings -->
                                <div>
                                    <h3 class="text-md font-medium text-gray-800 dark:text-white mb-2">Scanner Settings</h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center">
                                            <input type="checkbox" id="scan-qr" checked
                                                class="rounded text-primary-600 focus:ring-primary-500 mr-2" />
                                            <label for="scan-qr" class="text-sm text-gray-600 dark:text-gray-300">
                                                Scan QR codes
                                            </label>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="checkbox" id="scan-barcodes" checked
                                                class="rounded text-primary-600 focus:ring-primary-500 mr-2" />
                                            <label for="scan-barcodes" class="text-sm text-gray-600 dark:text-gray-300">
                                                Scan linear barcodes
                                            </label>
                                        </div>
                                        <div class="flex items-center">
                                            <input type="checkbox" id="continuous-scan" checked
                                                class="rounded text-primary-600 focus:ring-primary-500 mr-2" />
                                            <label for="continuous-scan" class="text-sm text-gray-600 dark:text-gray-300">
                                                Continuous scanning
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Scan Results -->
                    <div class="space-y-5">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
                                    Scan Results
                                </h3>
                                <button id="clear-scans-btn" class="flex items-center px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors">
                                    <i class="fas fa-trash-alt mr-1"></i>
                                    Clear
                                </button>
                            </div>
                            
                            <div id="scan-history" class="space-y-3 max-h-96 overflow-y-auto">
                                <p class="text-gray-500 dark:text-gray-400 italic text-sm">No scans yet. Start the camera to begin scanning.</p>
                            </div>
                        </div>
                        
                        <!-- Verification Section -->
                        <div id="verification-section" class="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 hidden">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                                Barcode Verification
                            </h3>
                            
                            <div id="verification-result" class="p-4 rounded-md mb-4">
                                <!-- Verification results will appear here -->
                            </div>
                            
                            <div class="space-y-3">
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    Enter a barcode to verify:
                                </p>
                                <div class="flex space-x-2">
                                    <input type="text" id="verify-input" placeholder="Type or scan a barcode" 
                                        class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white">
                                    <button id="verify-btn" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                                        Verify
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add the tab content to the page
            const tabPanelContainer = document.querySelector('.p-6');
            if (tabPanelContainer) {
                tabPanelContainer.appendChild(cameraTabContent);
            }
        }
    }
    
    /**
     * Set up event listeners for camera functions
     */
    function setupCameraListeners() {
        // Camera control buttons
        const startCameraBtn = window.safeDOM.getElement('start-camera-btn');
        const stopCameraBtn = window.safeDOM.getElement('stop-camera-btn');
        
        if (startCameraBtn && stopCameraBtn) {
            // Start camera button
            startCameraBtn.addEventListener('click', function() {
                startCamera();
                startCameraBtn.disabled = true;
                stopCameraBtn.disabled = false;
            });
            
            // Stop camera button
            stopCameraBtn.addEventListener('click', function() {
                stopCamera();
                startCameraBtn.disabled = false;
                stopCameraBtn.disabled = true;
            });
        }
        
        // Clear scans button
        const clearScansBtn = window.safeDOM.getElement('clear-scans-btn');
        if (clearScansBtn) {
            clearScansBtn.addEventListener('click', function() {
                clearScanHistory();
            });
        }
        
        // Verify button
        const verifyBtn = window.safeDOM.getElement('verify-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', function() {
                const input = window.safeDOM.getElement('verify-input');
                if (input && input.value.trim()) {
                    verifyBarcode(input.value.trim());
                }
            });
        }
        
        // Check if tab switching happens to stop camera
        const scannerTabLink = document.querySelector('#tab-scanner');
        if (scannerTabLink) {
            // When another tab is clicked
            document.querySelectorAll('#tabs a:not(#tab-scanner)').forEach(tab => {
                tab.addEventListener('click', function() {
                    // Stop camera if it's running
                    stopCamera();
                    if (startCameraBtn) startCameraBtn.disabled = false;
                    if (stopCameraBtn) stopCameraBtn.disabled = true;
                });
            });
            
            // Initialize camera selector on tab click
            scannerTabLink.addEventListener('click', function() {
                initCameraSelector();
                
                // Show verification section
                const verificationSection = window.safeDOM.getElement('verification-section');
                if (verificationSection) {
                    verificationSection.classList.remove('hidden');
                }
            });
        }
    }
    
    // Camera state variables
    let videoElement = null;
    let cameraStream = null;
    let scannerInterval = null;
    let availableCameras = [];
    
    /**
     * Initialize camera selector dropdown
     */
    function initCameraSelector() {
        const cameraSelect = window.safeDOM.getElement('camera-select');
        if (!cameraSelect) return;
        
        // Check if the browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraSelect.innerHTML = '<option value="">Camera not supported in this browser</option>';
            return;
        }
        
        // Get list of available cameras
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                // Filter to only video input devices (cameras)
                const cameras = devices.filter(device => device.kind === 'videoinput');
                availableCameras = cameras;
                
                if (cameras.length === 0) {
                    cameraSelect.innerHTML = '<option value="">No cameras found</option>';
                    return;
                }
                
                // Populate the dropdown
                cameraSelect.innerHTML = '';
                cameras.forEach((camera, index) => {
                    const option = document.createElement('option');
                    option.value = camera.deviceId;
                    option.textContent = camera.label || `Camera ${index + 1}`;
                    cameraSelect.appendChild(option);
                });
                
                // Handle camera selection change
                cameraSelect.addEventListener('change', function() {
                    if (cameraStream) {
                        // Stop the current stream before changing camera
                        stopCamera();
                        // Restart with new camera
                        startCamera();
                    }
                });
            })
            .catch(error => {
                console.error('Error getting cameras:', error);
                cameraSelect.innerHTML = '<option value="">Error: Could not get cameras</option>';
            });
    }
    
    /**
     * Start the camera with current settings
     */
    function startCamera() {
        videoElement = window.safeDOM.getElement('camera-preview');
        if (!videoElement) return;
        
        const cameraSelect = window.safeDOM.getElement('camera-select');
        const selectedCameraId = cameraSelect ? cameraSelect.value : '';
        
        // Camera constraints
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment', // Prefer back camera
            }
        };
        
        // If a specific camera is selected, use it
        if (selectedCameraId) {
            constraints.video.deviceId = { exact: selectedCameraId };
        }
        
        // Start the camera
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                cameraStream = stream;
                videoElement.srcObject = stream;
                
                // Play the video
                videoElement.play()
                    .then(() => {
                        // Show scanning indicator
                        const scanningIndicator = window.safeDOM.getElement('scanning-indicator');
                        if (scanningIndicator) {
                            scanningIndicator.style.display = 'flex';
                        }
                        
                        // Start scanning for barcodes
                        startScanning();
                    })
                    .catch(error => {
                        console.error('Error playing video:', error);
                    });
            })
            .catch(error => {
                console.error('Error accessing camera:', error);
                showCameraError(error.message);
            });
    }
    
    /**
     * Stop the camera
     */
    function stopCamera() {
        // Stop scanning interval
        if (scannerInterval) {
            clearInterval(scannerInterval);
            scannerInterval = null;
        }
        
        // Stop camera stream
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        
        // Clear video source
        if (videoElement) {
            videoElement.srcObject = null;
        }
        
        // Hide scanning indicator
        const scanningIndicator = window.safeDOM.getElement('scanning-indicator');
        if (scanningIndicator) {
            scanningIndicator.style.display = 'none';
        }
        
        // Hide scanner result
        const scannerResult = window.safeDOM.getElement('scanner-result');
        if (scannerResult) {
            scannerResult.style.transform = 'translateY(100%)';
        }
    }
    
    /**
     * Start scanning for barcodes in the video stream
     */
    function startScanning() {
        // This function would ideally use a barcode scanning library like ZXing or QuaggaJS
        // For this example, we'll show a placeholder implementation
        
        // Check settings
        const scanQR = window.safeDOM.getElement('scan-qr')?.checked || true;
        const scanBarcodes = window.safeDOM.getElement('scan-barcodes')?.checked || true;
        const continuousScan = window.safeDOM.getElement('continuous-scan')?.checked || true;
        
        // Set up scanning interval (simulated for this example)
        scannerInterval = setInterval(() => {
            // Simulate random barcode detection
            if (Math.random() < 0.1) { // 10% chance of detecting a barcode
                const isBarcodeFormat = Math.random() < 0.5;
                let detectedValue;
                
                if (isBarcodeFormat && scanBarcodes) {
                    // Simulate a barcode format
                    detectedValue = '978' + Math.floor(Math.random() * 10000000000);
                } else if (scanQR) {
                    // Simulate a QR code format
                    detectedValue = 'https://example.com/' + Math.random().toString(36).substring(2, 8);
                } else {
                    return; // Skip if the format is not enabled for scanning
                }
                
                // Display the detected barcode
                showDetectedBarcode(detectedValue, isBarcodeFormat ? 'EAN-13' : 'QR Code');
                
                // If not continuous scanning, stop after detecting one barcode
                if (!continuousScan) {
                    stopCamera();
                    const startCameraBtn = window.safeDOM.getElement('start-camera-btn');
                    const stopCameraBtn = window.safeDOM.getElement('stop-camera-btn');
                    if (startCameraBtn) startCameraBtn.disabled = false;
                    if (stopCameraBtn) stopCameraBtn.disabled = true;
                }
            }
        }, 1500); // Check every 1.5 seconds (for simulation)
    }
    
    /**
     * Show a detected barcode
     */
    function showDetectedBarcode(value, format) {
        // Show the result in the overlay
        const scannerResult = window.safeDOM.getElement('scanner-result');
        const scannedValue = window.safeDOM.getElement('scanned-value');
        
        if (scannerResult && scannedValue) {
            scannedValue.textContent = `${value} (${format})`;
            scannerResult.style.transform = 'translateY(0)';
            
            // Hide after a few seconds
            setTimeout(() => {
                scannerResult.style.transform = 'translateY(100%)';
            }, 3000);
        }
        
        // Add to scan history
        addToScanHistory(value, format);
    }
    
    /**
     * Add a scan to the history
     */
    function addToScanHistory(value, format) {
        const scanHistory = window.safeDOM.getElement('scan-history');
        if (!scanHistory) return;
        
        // Clear placeholder text if present
        if (scanHistory.querySelector('p.italic')) {
            scanHistory.innerHTML = '';
        }
        
        // Create scan item
        const scanItem = document.createElement('div');
        scanItem.className = 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md';
        
        // Format the current date/time
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        scanItem.innerHTML = `
            <div>
                <p class="font-medium text-gray-900 dark:text-white">${value}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    <span class="mr-2">${format}</span>
                    <span>${timeString}</span>
                </p>
            </div>
            <div class="flex space-x-2">
                <button class="verify-btn p-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                    <i class="fas fa-check-circle"></i>
                </button>
                <button class="lookup-btn p-1 text-secondary-600 hover:text-secondary-800 dark:text-secondary-400 dark:hover:text-secondary-300">
                    <i class="fas fa-search"></i>
                </button>
            </div>
        `;
        
        // Add actions to buttons
        const verifyBtn = scanItem.querySelector('.verify-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', function() {
                verifyBarcode(value);
            });
        }
        
        const lookupBtn = scanItem.querySelector('.lookup-btn');
        if (lookupBtn) {
            lookupBtn.addEventListener('click', function() {
                // Populate verify input
                const verifyInput = window.safeDOM.getElement('verify-input');
                if (verifyInput) {
                    verifyInput.value = value;
                }
                
                // Show verification section
                const verificationSection = window.safeDOM.getElement('verification-section');
                if (verificationSection) {
                    verificationSection.classList.remove('hidden');
                }
            });
        }
        
        // Add to history (at the top)
        scanHistory.insertBefore(scanItem, scanHistory.firstChild);
    }
    
    /**
     * Clear the scan history
     */
    function clearScanHistory() {
        const scanHistory = window.safeDOM.getElement('scan-history');
        if (scanHistory) {
            scanHistory.innerHTML = '<p class="text-gray-500 dark:text-gray-400 italic text-sm">No scans yet. Start the camera to begin scanning.</p>';
        }
    }
    
    /**
     * Verify a barcode against the database
     */
    function verifyBarcode(value) {
        const verificationResult = window.safeDOM.getElement('verification-result');
        if (!verificationResult) return;
        
        // Show loading state
        verificationResult.innerHTML = `
            <div class="flex items-center justify-center text-gray-600 dark:text-gray-400">
                <i class="fas fa-circle-notch fa-spin mr-2"></i>
                <span>Verifying...</span>
            </div>
        `;
        
        // Make API call to verify barcode
        // This is a simulated API call
        setTimeout(() => {
            // Simulate verification result (success/failure)
            const isValid = Math.random() < 0.7; // 70% chance of success
            
            if (isValid) {
                verificationResult.innerHTML = `
                    <div class="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-md p-4">
                        <div class="flex">
                            <i class="fas fa-check-circle text-xl mr-3"></i>
                            <div>
                                <p class="font-medium">Valid Barcode</p>
                                <p class="text-sm mt-1">This barcode was found in the database.</p>
                                <div class="mt-2 text-xs grid grid-cols-2 gap-2">
                                    <div>
                                        <p class="font-medium">Type:</p>
                                        <p>EAN-13</p>
                                    </div>
                                    <div>
                                        <p class="font-medium">Generated:</p>
                                        <p>2023-03-15</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                verificationResult.innerHTML = `
                    <div class="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-md p-4">
                        <div class="flex">
                            <i class="fas fa-times-circle text-xl mr-3"></i>
                            <div>
                                <p class="font-medium">Invalid Barcode</p>
                                <p class="text-sm mt-1">This barcode was not found in the database.</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }, 1500);
    }
    
    /**
     * Show camera error message
     */
    function showCameraError(message) {
        const cameraContainer = document.querySelector('.camera-container');
        if (!cameraContainer) return;
        
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'absolute inset-0 bg-red-600/80 flex items-center justify-center text-white p-4 text-center';
        errorOverlay.innerHTML = `
            <div>
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p class="font-medium">Camera Error</p>
                <p class="text-sm mt-1">${message}</p>
            </div>
        `;
        
        cameraContainer.appendChild(errorOverlay);
    }
}); 