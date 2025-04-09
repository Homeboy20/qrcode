/**
 * Authentication helper functions
 */

// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth helper script loaded');
    
    // Initialize auth tabs if they exist
    initializeAuthTabs();
    
    // Initialize Firebase error handling
    addFirebaseErrorHandler();
    
    // Initialize manual form submission handlers
    initFormSubmitHandlers();
});

/**
 * Show a status message to the user
 * @param {string} message - The message to show
 * @param {string} type - The message type (success, error, info)
 */
function showStatusMessage(message, type = 'info') {
    const statusDiv = document.getElementById('form-status');
    if (!statusDiv) return;
    
    // Set appropriate styles based on message type
    statusDiv.className = 'mt-4 p-2 text-sm text-center rounded';
    switch(type) {
        case 'success':
            statusDiv.classList.add('bg-green-100', 'text-green-800');
            break;
        case 'error':
            statusDiv.classList.add('bg-red-100', 'text-red-800');
            break;
        case 'info':
        default:
            statusDiv.classList.add('bg-blue-100', 'text-blue-800');
            break;
    }
    
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    
    // Automatically hide after 5 seconds
    setTimeout(() => {
        statusDiv.classList.add('hidden');
    }, 5000);
}

/**
 * Initialize form submission handlers
 */
function initFormSubmitHandlers() {
    // Password login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('Password login form found');
        loginForm.addEventListener('submit', function(e) {
            console.log('Login form submitted');
            showStatusMessage('Submitting login form...', 'info');
        });
    }
    
    // Password register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        console.log('Password register form found');
        registerForm.addEventListener('submit', function(e) {
            console.log('Register form submitted');
            showStatusMessage('Submitting registration form...', 'info');
        });
    }
    
    // Email button click handler
    const emailButton = document.getElementById('email-button');
    if (emailButton) {
        emailButton.addEventListener('click', function() {
            handleEmailAuth();
        });
    }
    
    // Phone verification button
    const phoneButton = document.getElementById('phone-button');
    if (phoneButton) {
        phoneButton.addEventListener('click', function() {
            handlePhoneAuth();
        });
    }
    
    // Verify code button
    const verifyCodeButton = document.getElementById('verify-code-button');
    if (verifyCodeButton) {
        verifyCodeButton.addEventListener('click', function() {
            verifyPhoneCode();
        });
    }
}

/**
 * Handle email authentication
 */
function handleEmailAuth() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error('Firebase is not available');
        showStatusMessage('Firebase is not available. Please use password authentication.', 'error');
        setActiveAuthTab('password', getTabElements());
        return;
    }
    
    const email = prompt("Please enter your email address:");
    if (!email) return;
    
    // Show status message
    showStatusMessage('Sending verification email...', 'info');
    
    // Get the current page (login or register)
    const isLogin = window.location.pathname.includes('login');
    const redirectPath = isLogin ? '/login' : '/register';
    
    try {
        // Send sign-in link to email
        const actionCodeSettings = {
            url: window.location.origin + redirectPath + '?email=' + email,
            handleCodeInApp: true,
        };
        
        firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
            .then(() => {
                // Email sent
                localStorage.setItem('emailForSignIn', email);
                
                const emailVerificationSent = document.getElementById('email-verification-sent');
                const emailButton = document.getElementById('email-button');
                
                if (emailVerificationSent) emailVerificationSent.classList.remove('hidden');
                if (emailButton) emailButton.classList.add('hidden');
                
                console.log('Verification email sent to: ' + email);
                showStatusMessage('Verification email sent! Please check your inbox.', 'success');
            })
            .catch((error) => {
                console.error('Error sending email:', error);
                showStatusMessage('Error sending email: ' + error.message, 'error');
                
                // Switch to password authentication if Firebase fails
                setTimeout(() => {
                    setActiveAuthTab('password', getTabElements());
                }, 2000);
            });
    } catch (error) {
        console.error('Firebase operation failed:', error);
        showStatusMessage('Email authentication failed. Please use password.', 'error');
        
        // Switch to password authentication
        setTimeout(() => {
            setActiveAuthTab('password', getTabElements());
        }, 1000);
    }
}

/**
 * Handle phone authentication
 */
function handlePhoneAuth() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.error('Firebase is not available');
        showStatusMessage('Firebase is not available. Please use password authentication.', 'error');
        setActiveAuthTab('password', getTabElements());
        return;
    }
    
    const phoneInput = document.getElementById('phone-input');
    if (!phoneInput) return;
    
    let phoneNumber = phoneInput.value.trim();
    if (!phoneNumber) {
        alert("Please enter a valid phone number");
        return;
    }
    
    // Format phone number if needed
    // Ensure it has a + prefix for international format
    if (!phoneNumber.startsWith('+')) {
        // If it begins with a digit, add the + sign
        if (/^\d/.test(phoneNumber)) {
            phoneNumber = '+' + phoneNumber;
        } else {
            alert("Phone number must be in international format (e.g., +1 123 456 7890)");
            return;
        }
    }
    
    // Show status message
    showStatusMessage('Sending verification code...', 'info');
    
    try {
        // Check if API key issues are likely
        if (!firebase.apps || !firebase.apps.length || 
            (firebase.apps.length > 0 && 
             (!firebase.apps[0].options || !firebase.apps[0].options.apiKey || 
              firebase.apps[0].options.apiKey.includes('error')))) {
            throw new Error('Firebase API key issue detected');
        }
        
        // Reset reCAPTCHA if there was a previous attempt
        if (window.recaptchaVerifier && window.recaptchaVerifier.clear) {
            try {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            } catch (e) {
                console.error('Error clearing reCAPTCHA:', e);
            }
        }
        
        // Initialize reCAPTCHA
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'normal',
            'callback': (response) => {
                console.log('reCAPTCHA verified');
                const phoneButton = document.getElementById('phone-button');
                if (phoneButton) phoneButton.disabled = false;
            },
            'expired-callback': () => {
                console.log('reCAPTCHA expired');
                showStatusMessage('reCAPTCHA verification expired. Please try again.', 'warning');
            }
        });
        
        window.recaptchaVerifier.render().then(function(widgetId) {
            window.recaptchaWidgetId = widgetId;
        }).catch(function(error) {
            console.error('reCAPTCHA render error:', error);
            showStatusMessage('Could not initialize reCAPTCHA. Using password authentication instead.', 'error');
            setTimeout(() => {
                setActiveAuthTab('password', getTabElements());
            }, 2000);
            return;
        });
        
        // Send verification code
        firebase.auth().signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
            .then((confirmationResult) => {
                // Code sent
                window.confirmationResult = confirmationResult;
                
                const verificationCodeContainer = document.getElementById('verification-code-container');
                const phoneButton = document.getElementById('phone-button');
                
                if (verificationCodeContainer) verificationCodeContainer.classList.remove('hidden');
                if (phoneButton) phoneButton.disabled = true;
                
                console.log('Verification code sent to: ' + phoneNumber);
                showStatusMessage('Verification code sent to your phone', 'success');
            })
            .catch((error) => {
                console.error("Phone auth error:", error);
                
                // Specific error handling
                let errorMessage = 'Error sending SMS: ' + error.message;
                
                if (error.code === 'auth/invalid-phone-number') {
                    errorMessage = 'Invalid phone number format. Use international format (e.g., +1 123 456 7890)';
                } else if (error.code === 'auth/internal-error') {
                    errorMessage = 'Firebase internal error. Please try with a different phone number or use password authentication.';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'Too many authentication attempts. Please try again later or use password authentication.';
                } else if (error.code === 'auth/captcha-check-failed') {
                    errorMessage = 'reCAPTCHA verification failed. Please try again.';
                } else if (error.code === 'auth/quota-exceeded') {
                    errorMessage = 'Service quota exceeded. Please try again later or use password authentication.';
                } else if (error.code === 'auth/api-key-not-valid' || error.message.includes('api-key-not-valid')) {
                    errorMessage = 'Firebase API key issue. Please use password authentication instead.';
                }
                
                showStatusMessage(errorMessage, 'error');
                
                // Reset reCAPTCHA
                if (window.recaptchaWidgetId) {
                    try {
                        grecaptcha.reset(window.recaptchaWidgetId);
                    } catch (e) {
                        console.error('Error resetting reCAPTCHA:', e);
                    }
                }
                
                // Switch to password authentication if Firebase fails
                setTimeout(() => {
                    setActiveAuthTab('password', getTabElements());
                }, 2500);
            });
    } catch (error) {
        console.error('Firebase operation failed:', error);
        showStatusMessage('Phone authentication unavailable. Please use password authentication.', 'error');
        
        // Switch to password authentication
        setTimeout(() => {
            setActiveAuthTab('password', getTabElements());
        }, 1500);
    }
}

/**
 * Verify phone code
 */
function verifyPhoneCode() {
    if (!window.confirmationResult) {
        alert('No verification code was sent. Please try again.');
        showStatusMessage('No verification code was sent', 'error');
        return;
    }
    
    const codeInput = document.getElementById('verification-code');
    if (!codeInput) return;
    
    const code = codeInput.value.trim();
    if (!code) {
        alert("Please enter the verification code");
        return;
    }
    
    // Show status message
    showStatusMessage('Verifying code...', 'info');
    
    window.confirmationResult.confirm(code)
        .then((result) => {
            // User signed in successfully
            showStatusMessage('Phone verified! Logging in...', 'success');
            const user = result.user;
            user.getIdToken().then(token => {
                // Set token and submit form
                const firebaseToken = document.getElementById('firebase-token');
                const authMethod = document.getElementById('auth-method');
                const firebaseAuthForm = document.getElementById('firebase-auth-form');
                
                if (firebaseToken) firebaseToken.value = token;
                if (authMethod) authMethod.value = 'phone';
                if (firebaseAuthForm) {
                    console.log('Submitting Firebase auth form');
                    firebaseAuthForm.submit();
                } else {
                    console.error('Firebase auth form not found');
                    showStatusMessage('Error: Authentication form not found', 'error');
                }
            });
        })
        .catch((error) => {
            console.error('Code verification error:', error);
            alert('Invalid verification code: ' + error.message);
            showStatusMessage('Invalid verification code', 'error');
        });
}

/**
 * Initialize authentication tabs for login and register forms
 */
function initializeAuthTabs() {
    const tabElements = getTabElements();
    
    // Verify all elements exist
    let allElementsExist = true;
    for (const type in tabElements) {
        if (!tabElements[type].tab || !tabElements[type].pane) {
            console.log(`Auth tab elements for ${type} not found, skipping initialization`);
            allElementsExist = false;
        }
    }
    
    if (!allElementsExist) {
        console.log('Not all auth tab elements found, skipping tab initialization');
        return;
    }
    
    console.log('Initializing auth tabs');
    
    // Set up click handlers for tabs
    for (const type in tabElements) {
        tabElements[type].tab.addEventListener('click', function() {
            setActiveAuthTab(type, tabElements);
        });
    }
    
    // Check if Firebase is properly initialized before using it
    const isFirebaseAvailable = typeof firebase !== 'undefined' && 
                               firebase.apps && 
                               firebase.apps.length > 0 && 
                               typeof firebase.auth === 'function';
    
    if (isFirebaseAvailable) {
        try {
            // Check if we're on an email sign-in link
            if (typeof firebase.auth().isSignInWithEmailLink === 'function' && 
                firebase.auth().isSignInWithEmailLink(window.location.href)) {
                handleEmailSignInLink();
                return; // Skip setting default tab
            }
        } catch (error) {
            console.error('Error checking for email sign-in link:', error);
        }
        
        // Initialize with email tab active by default if Firebase is available
        setActiveAuthTab('email', tabElements);
    } else {
        console.warn('Firebase not properly initialized, defaulting to password authentication');
        // Set password as default since Firebase is not available
        setActiveAuthTab('password', tabElements);
    }
}

/**
 * Get tab elements for the current page
 */
function getTabElements() {
    return {
        email: {
            tab: document.getElementById('email-tab'),
            pane: document.getElementById('email-auth')
        },
        phone: {
            tab: document.getElementById('phone-tab'),
            pane: document.getElementById('phone-auth')
        },
        password: {
            tab: document.getElementById('password-tab'),
            pane: document.getElementById('password-auth')
        }
    };
}

/**
 * Handle email sign-in link
 */
function handleEmailSignInLink() {
    showStatusMessage('Verifying email link...', 'info');
    
    // If the user has stored their email
    let email = localStorage.getItem('emailForSignIn');
    if (!email) {
        email = prompt('Please provide your email for confirmation');
    }
    
    if (!email) {
        showStatusMessage('Email verification cancelled', 'error');
        return;
    }
    
    // Sign in with email link
    firebase.auth().signInWithEmailLink(email, window.location.href)
        .then((result) => {
            // Clear the email from storage
            localStorage.removeItem('emailForSignIn');
            
            showStatusMessage('Email verified! Logging in...', 'success');
            
            // Get ID token and submit
            result.user.getIdToken().then(token => {
                const firebaseToken = document.getElementById('firebase-token');
                const authMethod = document.getElementById('auth-method');
                const firebaseAuthForm = document.getElementById('firebase-auth-form');
                
                if (firebaseToken) firebaseToken.value = token;
                if (authMethod) authMethod.value = 'email';
                if (firebaseAuthForm) {
                    console.log('Submitting Firebase auth form after email sign-in');
                    firebaseAuthForm.submit();
                } else {
                    console.error('Firebase auth form not found');
                    showStatusMessage('Error: Authentication form not found', 'error');
                }
            });
        })
        .catch((error) => {
            console.error("Email sign-in error:", error);
            alert('Error with email sign-in: ' + error.message);
            showStatusMessage('Email verification failed: ' + error.message, 'error');
        });
}

/**
 * Set active authentication tab
 * @param {string} tabType - The tab type to activate ('email', 'phone', or 'password')
 * @param {Object} elements - Object containing tab elements
 */
function setActiveAuthTab(tabType, elements) {
    console.log(`Setting active tab to ${tabType}`);
    
    // Remove active class from all tabs and panes
    for (const type in elements) {
        if (elements[type].tab) elements[type].tab.classList.remove('active');
        if (elements[type].pane) elements[type].pane.classList.remove('active');
    }
    
    // Add active class to selected tab and pane
    if (elements[tabType].tab) elements[tabType].tab.classList.add('active');
    if (elements[tabType].pane) elements[tabType].pane.classList.add('active');
    
    // Initialize reCAPTCHA if phone tab is selected
    if (tabType === 'phone') {
        // Check if Firebase is properly initialized
        const isFirebaseAvailable = typeof firebase !== 'undefined' && 
                                  firebase.apps && 
                                  firebase.apps.length > 0 && 
                                  typeof firebase.auth === 'function';
        
        if (isFirebaseAvailable && !window.recaptchaVerifier) {
            try {
                const recaptchaContainer = document.getElementById('recaptcha-container');
                if (recaptchaContainer) {
                    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                        'size': 'normal',
                        'callback': () => {
                            // reCAPTCHA verified
                            const phoneButton = document.getElementById('phone-button');
                            if (phoneButton) phoneButton.disabled = false;
                        },
                        'expired-callback': () => {
                            console.log('reCAPTCHA expired');
                            const phoneButton = document.getElementById('phone-button');
                            if (phoneButton) phoneButton.disabled = true;
                        }
                    });
                    
                    // Add catch handler for the render promise
                    window.recaptchaVerifier.render().catch(error => {
                        console.error('reCAPTCHA render error:', error);
                        showStatusMessage('Phone authentication unavailable. Please use password.', 'error');
                        
                        // Switch to password tab
                        setTimeout(() => {
                            setActiveAuthTab('password', elements);
                        }, 1500);
                    });
                }
            } catch (error) {
                console.error('Failed to initialize reCAPTCHA:', error);
                showStatusMessage('Phone authentication unavailable. Please use password.', 'error');
                
                // Switch to password tab
                setTimeout(() => {
                    setActiveAuthTab('password', elements);
                }, 1500);
            }
        } else if (!isFirebaseAvailable) {
            console.error('Firebase not properly initialized for phone authentication');
            showStatusMessage('Phone authentication unavailable. Please use password.', 'error');
            
            // Switch to password tab
            setTimeout(() => {
                setActiveAuthTab('password', elements);
            }, 1500);
        }
    }
}

/**
 * Add error handling for Firebase authentication
 */
function addFirebaseErrorHandler() {
    window.addEventListener('error', function(event) {
        if (event && event.message && 
            (event.message.includes('firebase') || 
             event.message.includes('FirebaseError'))) {
            console.error('Firebase initialization error:', event.message);
            
            // Try to enable password auth if Firebase fails
            const passwordTab = document.getElementById('password-tab');
            const passwordPane = document.getElementById('password-auth');
            
            if (passwordTab && passwordPane) {
                // Remove active class from all tabs and panes
                document.querySelectorAll('.auth-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.auth-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                
                // Activate password tab
                passwordTab.classList.add('active');
                passwordPane.classList.add('active');
                
                // Show a message to the user
                console.log('Switched to password authentication due to Firebase error');
            }
        }
    }, true);
} 