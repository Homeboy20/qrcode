// Define a simple structure for label templates
const labelTemplates = [
  {
    id: 'default',
    name: 'Default Template',
    layout: '<div class="label"><span class="barcode">{barcode}</span></div>'
  },
  {
    id: 'detailed',
    name: 'Detailed Template',
    layout: '<div class="label"><span class="barcode">{barcode}</span><span class="details">{details}</span></div>'
  }
];

// Function to get a template by ID
function getTemplateById(id) {
  return labelTemplates.find(template => template.id === id) || labelTemplates[0];
}

// Export the function for use in other modules
export { getTemplateById }; 