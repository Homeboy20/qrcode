/**
 * Theme Switcher for Barcode Generator
 * Provides dark/light mode toggling with localStorage persistence
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme switcher
    initThemeSwitcher();
    
    /**
     * Set up theme switcher functionality
     */
    function initThemeSwitcher() {
        const themeToggle = window.safeDOM.getElement('theme-toggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        const currentTheme = localStorage.getItem('theme');
        
        // Apply initial theme based on saved preference or system preference
        applyTheme(currentTheme || (prefersDarkScheme.matches ? 'dark' : 'light'));
        
        // Toggle theme when button is clicked
        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                // Check the current state
                const isDark = document.body.classList.contains('dark-theme');
                // Toggle to opposite theme
                const newTheme = isDark ? 'light' : 'dark';
                applyTheme(newTheme);
                // Save preference
                localStorage.setItem('theme', newTheme);
            });
        }
        
        // Listen for system preference changes
        prefersDarkScheme.addEventListener('change', function(e) {
            // Only apply if the user hasn't set a preference
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    /**
     * Apply a theme to the document
     * @param {string} theme - 'dark' or 'light'
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            
            // Update the theme toggle icon
            const sunIcon = document.querySelector('#theme-toggle .fa-sun');
            const moonIcon = document.querySelector('#theme-toggle .fa-moon');
            
            if (sunIcon) sunIcon.classList.add('hidden');
            if (moonIcon) moonIcon.classList.remove('hidden');
            
            // Set meta theme-color for browser UI
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#111827');
            } else {
                const newMeta = document.createElement('meta');
                newMeta.name = 'theme-color';
                newMeta.content = '#111827';
                document.head.appendChild(newMeta);
            }
        } else {
            document.body.classList.remove('dark-theme');
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            
            // Update the theme toggle icon
            const sunIcon = document.querySelector('#theme-toggle .fa-sun');
            const moonIcon = document.querySelector('#theme-toggle .fa-moon');
            
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (moonIcon) moonIcon.classList.add('hidden');
            
            // Set meta theme-color for browser UI
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#f9fafb');
            } else {
                const newMeta = document.createElement('meta');
                newMeta.name = 'theme-color';
                newMeta.content = '#f9fafb';
                document.head.appendChild(newMeta);
            }
        }
    }
}); 