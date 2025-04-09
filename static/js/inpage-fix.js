// inpage-fix.js
// This script adds a fix for the inpage.js TypeError: Cannot read properties of null (reading 'type')

console.log("Loading inpage-fix.js");

(function() {
  // This is a defensive patch to prevent the error from inpage.js
  // The error occurs at line 2269 trying to read a 'type' property from a null object
  
  // Create a wrapper around the original inpage functionality
  window.addEventListener('DOMContentLoaded', function() {
    // Patch the potential error point
    try {
      // If inpage.js is loaded, this will add some defensive checks
      if (window.ph) {
        const originalFn = window.ph;
        window.ph = function(obj) {
          // Make sure the object and its properties exist before access
          if (obj === null || obj === undefined) {
            console.log("inpage-fix: Prevented null object access");
            return null; // Return safely
          }
          return originalFn(obj); // Call the original function
        };
        console.log("inpage-fix: Applied fix to window.ph");
      }
      
      // Add general error handler for this specific error
      window.addEventListener('error', function(event) {
        if (event.error && event.error.message && 
            event.error.message.includes("Cannot read properties of null (reading 'type')") &&
            event.filename && event.filename.includes('inpage.js')) {
          console.log("inpage-fix: Caught and suppressed error from inpage.js");
          event.preventDefault(); // Prevent the error from propagating
          return true; // Indicate the error was handled
        }
      });
      
      console.log("inpage-fix: Error handlers installed");
    } catch (e) {
      console.error("Error applying inpage fix:", e);
    }
  });
})(); 