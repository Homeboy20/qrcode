from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time
import os

def test_sequence_generator_frontend():
    """Test the sequence generator from the frontend UI"""
    print("Testing sequence generator from UI...")
    
    # Set up Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        # Initialize the WebDriver
        driver = webdriver.Chrome(options=chrome_options)
        
        # Navigate to the homepage
        driver.get("http://127.0.0.1:5000")
        print("Navigated to homepage")
        
        # Wait for the page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "barcode-generator"))
        )
        
        # Find the "Bulk Generator" tab and click it
        try:
            bulk_tab = driver.find_element(By.XPATH, "//button[contains(text(), 'Bulk Generator')]")
            bulk_tab.click()
            print("Clicked on Bulk Generator tab")
            
            # Wait for the bulk generator form to be visible
            WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.ID, "sequence-generator"))
            )
            
            # Fill in the form fields
            driver.find_element(By.ID, "seq_prefix").send_keys("TEST")
            driver.find_element(By.ID, "seq_start").clear()
            driver.find_element(By.ID, "seq_start").send_keys("1")
            driver.find_element(By.ID, "seq_count").clear()
            driver.find_element(By.ID, "seq_count").send_keys("3")
            driver.find_element(By.ID, "seq_pad").clear()
            driver.find_element(By.ID, "seq_pad").send_keys("2")
            driver.find_element(By.ID, "seq_suffix").send_keys("-SEQ")
            
            # Click the generate button
            generate_button = driver.find_element(By.ID, "generate-sequence-btn")
            print(f"Generate button is displayed: {generate_button.is_displayed()}")
            print(f"Generate button text: {generate_button.text}")
            
            # Check if the button is visible
            if not generate_button.is_displayed():
                print("WARNING: Generate button is not visible!")
                
                # Take a screenshot for debugging
                driver.save_screenshot("debug_screenshot.png")
                print(f"Screenshot saved to {os.path.abspath('debug_screenshot.png')}")
                
                # Print the HTML of the sequence generator form
                print("Sequence generator form HTML:")
                print(driver.find_element(By.ID, "sequence-generator").get_attribute("outerHTML"))
            
            # Click the button
            generate_button.click()
            print("Clicked on Generate button")
            
            # Wait for the results to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "sequence-results"))
            )
            
            # Check if results were displayed
            results_container = driver.find_element(By.ID, "sequence-results")
            results_html = results_container.get_attribute("innerHTML")
            
            print("\nSequence Results HTML:")
            print(results_html[:500] + "..." if len(results_html) > 500 else results_html)
            
            # Check if the results contain barcode images
            barcode_images = results_container.find_elements(By.TAG_NAME, "img")
            print(f"\nFound {len(barcode_images)} barcode images in the results")
            
            if len(barcode_images) > 0:
                print("Sequence generator is working correctly!")
            else:
                print("No barcode images found in the results. Check for errors.")
                
                # Check for any error messages
                error_elements = results_container.find_elements(By.XPATH, "//*[contains(@class, 'error')]")
                for error in error_elements:
                    print(f"Error message found: {error.text}")
            
        except Exception as e:
            print(f"Error during test: {str(e)}")
            # Take a screenshot for debugging
            driver.save_screenshot("error_screenshot.png")
            print(f"Error screenshot saved to {os.path.abspath('error_screenshot.png')}")
            
            # Print the current page source
            print("\nCurrent page source:")
            print(driver.page_source[:1000] + "..." if len(driver.page_source) > 1000 else driver.page_source)
    
    finally:
        # Clean up
        driver.quit()
        print("Test completed")

if __name__ == "__main__":
    test_sequence_generator_frontend() 