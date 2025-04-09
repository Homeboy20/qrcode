import os
import re

# Get all HTML templates
templates_dir = 'templates'
templates = [os.path.join(templates_dir, f) for f in os.listdir(templates_dir) if f.endswith('.html')]

# Track updated files
updated_count = 0

# Error handler script tag
script_tag = '  <script src="/static/js/error-handler.js"></script>\n'

# Process each template
for template_path in templates:
    # Read the file content
    with open(template_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check if the file already has the error handler script
    if '</body>' in content and not '/static/js/error-handler.js' in content:
        # Add the script before the closing body tag
        modified_content = content.replace('</body>', script_tag + '</body>')
        
        # Write the updated content back to the file
        with open(template_path, 'w', encoding='utf-8') as file:
            file.write(modified_content)
        
        updated_count += 1
        print(f"Updated: {template_path}")

print(f"\nTotal templates updated: {updated_count}") 