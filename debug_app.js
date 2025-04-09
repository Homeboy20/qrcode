/**
 * Debugging script for sequence generation
 * Include this in the index.html page to help debug sequence generation issues
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug script loaded');
    
    // Add a debug button to the sequence tab
    function addDebugButton() {
        const sequenceTab = document.getElementById('sequence-tab');
        if (!sequenceTab) {
            console.error('Sequence tab not found');
            return;
        }
        
        // Create a debug button
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug Generator';
        debugButton.style.position = 'fixed';
        debugButton.style.bottom = '20px';
        debugButton.style.right = '20px';
        debugButton.style.zIndex = '1000';
        debugButton.style.padding = '10px';
        debugButton.style.background = 'red';
        debugButton.style.color = 'white';
        debugButton.style.border = 'none';
        debugButton.style.borderRadius = '4px';
        debugButton.style.cursor = 'pointer';
        
        // Add click handler
        debugButton.addEventListener('click', function() {
            debugSequenceGeneration();
        });
        
        // Add to the page
        document.body.appendChild(debugButton);
        console.log('Debug button added');
    }
    
    // Direct sequence generation debug function
    function debugSequenceGeneration() {
        console.log('Starting direct sequence generation debug');
        
        // Get the sequence-results container
        const resultsContainer = document.getElementById('sequence-results');
        if (!resultsContainer) {
            console.error('sequence-results container not found');
            return;
        }
        
        // Show debugging info
        resultsContainer.innerHTML = '<div style="padding: 15px; background: #f0f0f0; border-radius: 4px;">' +
            '<h3>Debugging Sequence Generation</h3>' +
            '<p>Sending test API request...</p>' +
            '</div>';
        
        // Make the API request
        fetch('http://127.0.0.1:5000/generate_sequence', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prefix: 'DEBUG',
                start: 1,
                count: 2,
                pad_length: 2,
                barcode_type: 'code128',
                suffix: '-TEST',
                save_to_system: false
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('API response:', data);
            
            if (data.sequence_data && data.sequence_data.length > 0) {
                // Create manual display of barcode
                let html = '<div style="padding: 15px; background: #f0f0f0; border-radius: 4px;">' +
                    '<h3>Debug Results</h3>' +
                    '<p>API call successful. Found ' + data.sequence_data.length + ' barcodes.</p>';
                
                // Add the first barcode
                const barcode = data.sequence_data[0];
                html += '<div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; background: white; text-align: center;">' +
                    '<p><strong>Barcode Data:</strong> ' + barcode.data + '</p>' +
                    '<img src="' + barcode.image_data + '" style="max-width: 300px; margin: 10px 0;" alt="Barcode">' +
                    '<a href="' + barcode.image_data + '" download="barcode.png" style="display: block; margin-top: 10px;">Download</a>' +
                    '</div>';
                
                html += '</div>';
                
                // Update the container
                resultsContainer.innerHTML = html;
            } else {
                resultsContainer.innerHTML = '<div style="padding: 15px; background: #ffeeee; border-radius: 4px; color: #cc0000;">' +
                    '<h3>Error</h3>' +
                    '<p>No barcodes returned from API.</p>' +
                    '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
                    '</div>';
            }
        })
        .catch(error => {
            console.error('API error:', error);
            resultsContainer.innerHTML = '<div style="padding: 15px; background: #ffeeee; border-radius: 4px; color: #cc0000;">' +
                '<h3>Error</h3>' +
                '<p>Failed to call API: ' + error.message + '</p>' +
                '</div>';
        });
    }
    
    // Check if we're on the sequence tab
    function checkSequenceTab() {
        const hash = window.location.hash;
        if (hash === '#sequence-tab') {
            console.log('On sequence tab - adding debug button');
            setTimeout(addDebugButton, 500); // Wait for UI to stabilize
        }
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkSequenceTab);
    
    // Check initial state
    checkSequenceTab();
    
    // Expose debug function globally
    window.debugSequenceGeneration = debugSequenceGeneration;
    
    console.log('Debug setup complete');
}); 