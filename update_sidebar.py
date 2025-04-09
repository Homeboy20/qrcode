import os
import re

# Templates to update
admin_templates = [
    'templates/dashboard.html',
    'templates/manage_users.html',
    'templates/manage_payments.html',
    'templates/manage_barcodes.html',
    'templates/manage_qrcodes.html',
    'templates/subscription_packages.html',
    'templates/api_settings.html',
    'templates/analytics.html',
    'templates/admin_dashboard.html'
]

# Regex pattern to match and replace sidebar
sidebar_pattern = re.compile(
    r'<aside id="sidebar"[^>]*>.*?</aside>',
    re.DOTALL
)

# Include directive to replace sidebar with
sidebar_include = '{% include "includes/sidebar.html" %}'

# Get the contents of the includes/sidebar.html file
# We will need this for templates that use Flask's render_template_string
with open('templates/includes/sidebar.html', 'r', encoding='utf-8') as f:
    sidebar_content = f.read()

# Process each template
updated_files = 0
for template_path in admin_templates:
    if not os.path.exists(template_path):
        print(f"Skipping {template_path} - file not found")
        continue
        
    # Read template content
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check if there's a sidebar to replace
        if '<aside id="sidebar"' in content:
            # Replace the sidebar with the include directive
            updated_content = sidebar_pattern.sub(sidebar_include, content)
            
            # Write the updated file
            with open(template_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            updated_files += 1
            print(f"Updated {template_path}")
    except Exception as e:
        print(f"Error updating {template_path}: {str(e)}")

print(f"\nUpdated {updated_files} templates with standardized sidebar")

# Now let's make sure the toggleSubmenu function is properly included
script_pattern = re.compile(
    r'function toggleSubmenu\(.*?\)\s*\{.*?\}',
    re.DOTALL
)

for template_path in admin_templates:
    if not os.path.exists(template_path):
        continue
        
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Only add the script if it's not already there and there's no include
        if 'function toggleSubmenu' not in content and sidebar_include not in content:
            # Find the closing </body> tag
            if '</body>' in content:
                # Add a minimal script before closing body
                script = """
<script>
    // Toggle submenu visibility
    function toggleSubmenu(id) {
        const submenu = document.getElementById(id);
        submenu.classList.toggle('hidden');
    }
</script>
</body>"""
                updated_content = content.replace('</body>', script)
                
                # Write the updated file
                with open(template_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                print(f"Added toggleSubmenu function to {template_path}")
    except Exception as e:
        print(f"Error updating scripts in {template_path}: {str(e)}")

print("\nSidebar update complete!") 