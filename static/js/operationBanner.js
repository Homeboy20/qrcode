// Operation Banner Script
// This script handles notifications and operation status banners

console.log("Script loaded: operationBanner.js");

class OperationBanner {
  constructor() {
    this.bannerContainer = null;
    this.init();
  }

  init() {
    // Create banner container if it doesn't exist
    if (!this.bannerContainer) {
      this.bannerContainer = document.createElement('div');
      this.bannerContainer.id = 'operation-banner-container';
      this.bannerContainer.style.position = 'fixed';
      this.bannerContainer.style.top = '20px';
      this.bannerContainer.style.right = '20px';
      this.bannerContainer.style.zIndex = '9999';
      document.body.appendChild(this.bannerContainer);
    }
  }

  // Show a success notification
  showSuccess(message, duration = 5000) {
    this.showBanner(message, 'success', duration);
  }

  // Show an error notification
  showError(message, duration = 7000) {
    this.showBanner(message, 'error', duration);
  }

  // Show an info notification
  showInfo(message, duration = 5000) {
    this.showBanner(message, 'info', duration);
  }

  // Show a warning notification
  showWarning(message, duration = 6000) {
    this.showBanner(message, 'warning', duration);
  }

  // Create and display a banner
  showBanner(message, type, duration) {
    const banner = document.createElement('div');
    banner.className = `operation-banner operation-banner-${type}`;
    banner.style.marginBottom = '10px';
    banner.style.padding = '15px';
    banner.style.borderRadius = '4px';
    banner.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    banner.style.animation = 'slidein 0.3s ease-in-out';
    banner.style.transition = 'all 0.3s ease';
    banner.style.maxWidth = '300px';
    
    // Set color based on type
    if (type === 'success') {
      banner.style.backgroundColor = '#d4edda';
      banner.style.color = '#155724';
      banner.style.borderLeft = '4px solid #28a745';
    } else if (type === 'error') {
      banner.style.backgroundColor = '#f8d7da';
      banner.style.color = '#721c24';
      banner.style.borderLeft = '4px solid #dc3545';
    } else if (type === 'warning') {
      banner.style.backgroundColor = '#fff3cd';
      banner.style.color = '#856404';
      banner.style.borderLeft = '4px solid #ffc107';
    } else { // info
      banner.style.backgroundColor = '#d1ecf1';
      banner.style.color = '#0c5460';
      banner.style.borderLeft = '4px solid #17a2b8';
    }
    
    // Create message text
    const messageText = document.createElement('div');
    messageText.innerHTML = message;
    banner.appendChild(messageText);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '5px';
    closeButton.style.right = '5px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = 'inherit';
    closeButton.addEventListener('click', () => {
      this.closeBanner(banner);
    });
    banner.appendChild(closeButton);
    
    // Add banner to container
    this.bannerContainer.appendChild(banner);
    
    // Auto-close after duration
    if (duration > 0) {
      setTimeout(() => {
        this.closeBanner(banner);
      }, duration);
    }
    
    return banner;
  }
  
  // Close/remove a banner
  closeBanner(banner) {
    banner.style.opacity = '0';
    banner.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      if (banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
    }, 300);
  }
}

// Create global instance
window.operationBanner = new OperationBanner(); 