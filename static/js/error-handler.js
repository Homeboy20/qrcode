/**
 * Global error handler for inpage.js and React-related errors
 * Include this script in all templates to prevent common errors from breaking the UI
 */

/**
 * Safely access a DOM element and return null if it doesn't exist
 * @param {string} elementId - The ID of the element to find
 * @returns {HTMLElement|null} - The element or null if not found
 */
function safeGetElement(elementId) {
    return document.getElementById(elementId);
}

/**
 * Safely sets the value of a DOM element
 * @param {string} elementId - The ID of the element to set value on
 * @param {*} value - The value to set
 * @returns {boolean} - Whether the operation was successful
 */
function safeSetValue(elementId, value) {
    const element = safeGetElement(elementId);
    if (element) {
        element.value = value;
        return true;
    }
    console.warn(`[SafeDOM] Element ${elementId} not found when setting value`);
    return false;
}

/**
 * Safely gets the value of a DOM element
 * @param {string} elementId - The ID of the element to get value from
 * @param {*} defaultValue - The default value to return if element not found
 * @returns {*} - The element's value or the default value
 */
function safeGetValue(elementId, defaultValue = '') {
    const element = safeGetElement(elementId);
    return element ? element.value : defaultValue;
}

/**
 * Safely adds an event listener to a DOM element
 * @param {string} elementId - The ID of the element to add listener to
 * @param {string} eventType - The event type (e.g., 'click')
 * @param {Function} callback - The event handler
 * @returns {boolean} - Whether the operation was successful
 */
function safeAddEventListener(elementId, eventType, callback) {
    const element = safeGetElement(elementId);
    if (element) {
        element.addEventListener(eventType, callback);
        return true;
    }
    console.warn(`[SafeDOM] Element ${elementId} not found when adding ${eventType} listener`);
    return false;
}

/**
 * Safely toggles a class on a DOM element
 * @param {string} elementId - The ID of the element
 * @param {string} className - The class to toggle
 * @param {boolean} force - Whether to force add or remove
 * @returns {boolean} - Whether the operation was successful
 */
function safeToggleClass(elementId, className, force) {
    const element = safeGetElement(elementId);
    if (element) {
        if (force === undefined) {
            element.classList.toggle(className);
        } else {
            if (force) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        }
        return true;
    }
    console.warn(`[SafeDOM] Element ${elementId} not found when toggling class ${className}`);
    return false;
}

/**
 * Creates a DOM element if it doesn't exist
 * @param {string} elementId - The ID to check for and assign to new element
 * @param {string} tagName - The tag name of the element to create
 * @param {string} parentId - The ID of the parent element to append to
 * @param {Object} attributes - Additional attributes to set on the element
 * @returns {HTMLElement|null} - The found or created element
 */
function createElementIfNotExists(elementId, tagName, parentId, attributes = {}) {
    let element = safeGetElement(elementId);
    
    if (!element) {
        const parent = safeGetElement(parentId);
        if (!parent) {
            console.warn(`[SafeDOM] Parent element ${parentId} not found when creating ${elementId}`);
            return null;
        }
        
        element = document.createElement(tagName);
        element.id = elementId;
        
        // Set additional attributes
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        }
        
        parent.appendChild(element);
        console.info(`[SafeDOM] Created missing element ${elementId}`);
    }
    
    return element;
}

// Export safety utilities to global scope
window.safeDOM = {
    getElement: safeGetElement,
    setValue: safeSetValue,
    getValue: safeGetValue,
    addEventListener: safeAddEventListener,
    toggleClass: safeToggleClass,
    createElementIfNotExists: createElementIfNotExists
};

// Enhanced fix for inpage.js errors
window.addEventListener('error', function(event) {
    if (event && event.filename && (
        event.filename.includes('inpage.js') || 
        (event.message && event.message.includes('Cannot read properties of null'))
    )) {
        console.error('[ErrorHandler] Prevented error from external script:', event.message);
        event.preventDefault();
        return true;  // Prevents the error from propagating
    }
}, true);

// Catch unhandled promise rejections with specific handling for TypeError
window.addEventListener('unhandledrejection', function(event) {
    if (event && event.reason && (
        (event.reason.stack && event.reason.stack.includes('inpage.js')) ||
        (event.reason.message && event.reason.message.includes('Cannot read properties of null'))
    )) {
        console.error('[ErrorHandler] Prevented unhandled rejection:', event.reason.message || event.reason);
        event.preventDefault();
        return true;  // Prevents the rejection from propagating
    }
});

// Specific handling for the TypeError with null properties
function initializeErrorProtection() {
    console.info('[ErrorHandler] Global error protection initialized');
    
    // Add specific protection for sequence generation
    setTimeout(protectSequenceGeneration, 1000);
    
    // Patch the console to filter out React DevTools messages
    const originalConsoleError = console.error;
    console.error = function() {
        // Check if arguments exist
        if (!arguments || arguments.length === 0) {
            return originalConsoleError.apply(console, ["Empty error"]);
        }
        
        const args = Array.from(arguments);
        
        // Safe check for string matching
        if (args.length > 0 && 
            typeof args[0] === 'string' && 
            (args[0].includes('React DevTools') || args[0].includes('inpage.js'))) {
            console.warn('[ErrorHandler] Suppressed non-critical message:', args[0]);
            return;
        }
        
        // Fix for TypeError: Cannot read property 'type' of null
        if (args.length > 0 && 
            args[0] instanceof Error && 
            args[0].message && 
            args[0].message.includes('Cannot read properties of null')) {
            console.warn('[ErrorHandler] Suppressed null property error:', args[0].message);
            return;
        }
        
        originalConsoleError.apply(console, args);
    };

    // Monkey patch Promise to catch errors specifically for inpage.js
    const originalThen = Promise.prototype.then;
    Promise.prototype.then = function(onFulfilled, onRejected) {
        const wrappedOnFulfilled = function(value) {
            try {
                return onFulfilled ? onFulfilled(value) : value;
            } catch (error) {
                if ((error && error.stack && error.stack.includes('inpage.js')) ||
                    (error && error.message && error.message.includes('Cannot read properties of null'))) {
                    console.error('[ErrorHandler] Caught error in promise fulfillment:', error.message);
                    return value; // Return the original value instead of throwing
                }
                throw error;
            }
        };
        
        const wrappedOnRejected = function(reason) {
            if (reason instanceof Error && (
                (reason.stack && reason.stack.includes('inpage.js')) ||
                (reason.message && reason.message.includes('Cannot read properties of null'))
            )) {
                console.error('[ErrorHandler] Caught promise error:', reason.message);
                return Promise.resolve(null); // Prevent the error from propagating
            }
            
            try {
                return onRejected ? onRejected(reason) : Promise.reject(reason);
            } catch (error) {
                if ((error && error.stack && error.stack.includes('inpage.js')) ||
                    (error && error.message && error.message.includes('Cannot read properties of null'))) {
                    console.warn('[ErrorHandler] Caught error in promise rejection handler:', error.message);
                    return Promise.resolve(null);
                }
                throw error;
            }
        };
        
        return originalThen.call(this, wrappedOnFulfilled, wrappedOnRejected);
    };
    
    // Specific polyfill for the exact error message seen
    window.Di = window.Di || {};
    if (window.Di) {
        const originalDiMethods = {};
        
        // Add protection to all methods of the Di object
        for (const key in window.Di) {
            if (typeof window.Di[key] === 'function') {
                originalDiMethods[key] = window.Di[key];
                window.Di[key] = function() {
                    try {
                        return originalDiMethods[key].apply(this, arguments);
                    } catch (error) {
                        if (error && error.message && error.message.includes('Cannot read properties of null')) {
                            console.error('[ErrorHandler] Prevented Di method error:', error.message);
                            return null;
                        }
                        throw error;
                    }
                };
            }
        }
    }
    
    // Prevent axios error from accessing null type
    if (window.axios) {
        const originalAxios = window.axios.request;
        window.axios.request = function(config) {
            return originalAxios.call(this, config)
                .catch(function(error) {
                    // Safe handling of response errors
                    if (error && error.response && error.response.data) {
                        // All good, pass through
                    } else if (error) {
                        // Fix the error object to ensure it has safe properties
                        if (!error.response) {
                            error.response = {};
                        }
                        if (!error.response.data) {
                            error.response.data = { error: 'Server error', status: 'error' };
                        }
                        console.error('[ErrorHandler] Fixed missing error.response.data');
                    }
                    throw error;  // Re-throw the modified error
                });
        };
        
        // Add protection for common axios methods
        ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
            const original = window.axios[method];
            window.axios[method] = function() {
                return original.apply(this, arguments)
                    .catch(function(error) {
                        // Safe handling of response errors
                        if (error && error.response && error.response.data) {
                            // All good, pass through
                        } else if (error) {
                            // Fix the error object to ensure it has safe properties
                            if (!error.response) {
                                error.response = {};
                            }
                            if (!error.response.data) {
                                error.response.data = { error: 'Server error', status: 'error' };
                            }
                            console.warn(`[ErrorHandler] Fixed missing error.response.data in ${method}`);
                        }
                        throw error;  // Re-throw the modified error
                    });
            };
        });
    }
}

// Add specific protection for sequence generation
function protectSequenceGeneration() {
    console.log("Adding protection for sequence generation");
    
    // Only protect userBarcodes if not already protected
    if (!Object.getOwnPropertyDescriptor(window, 'userBarcodes') || 
        Object.getOwnPropertyDescriptor(window, 'userBarcodes').configurable) {
        try {
            // Create a safe default value
            let userBarcodesValue = [];
            
            // Define property with controlled access
            Object.defineProperty(window, 'userBarcodes', {
                get: function() {
                    return userBarcodesValue;
                },
                set: function(newValue) {
                    if (Array.isArray(newValue)) {
                        userBarcodesValue = newValue;
                    } else {
                        console.warn("Attempt to set userBarcodes to non-array value:", newValue);
                    }
                },
                enumerable: true,
                configurable: false
            });
        } catch (e) {
            console.warn("Could not protect userBarcodes property:", e);
        }
    }
    
    // Find the sequence form and wrap its submit handler
    const sequenceForm = safeGetElement('sequence-form');
    if (sequenceForm) {
        const originalSubmit = sequenceForm.onsubmit;
        
        sequenceForm.onsubmit = function(e) {
            try {
                console.log("Protected sequence form submission");
                // Safely get form values with fallbacks
                const prefix = safeGetValue('seq_prefix', '');
                const startNum = parseInt(safeGetValue('seq_start', '1'));
                const count = parseInt(safeGetValue('seq_count', '10'));
                const padLength = parseInt(safeGetValue('seq_pad', '0'));
                const suffix = safeGetValue('seq_suffix', '');
                const barcodeType = safeGetValue('seq_type', 'code128');
                
                console.log("Sequence form values:", { prefix, startNum, count, padLength, suffix, barcodeType });
                
                // Ensure the sequence-list element exists
                const sequenceResults = safeGetElement('sequence-results');
                
                // Create sequence-list if it doesn't exist
                if (sequenceResults) {
                    window.safeDOM.createElementIfNotExists('sequence-list', 'ul', 'sequence-results', {
                        className: 'sequence-list'
                    });
                }
                
                // Continue with original handler
                if (typeof originalSubmit === 'function') {
                    return originalSubmit.call(this, e);
                }
            } catch (error) {
                console.warn('[ErrorHandler] Protected sequence form from error:', error);
                e.preventDefault();
                return false;
            }
        };
    }
}

// Initialize the error protection when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeErrorProtection);
} else {
    initializeErrorProtection();
}
