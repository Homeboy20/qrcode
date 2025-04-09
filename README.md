# Advanced Barcode Generator

A full-featured barcode and QR code generation application built with Flask.

## Features

- Generate various types of barcodes (Code128, Code39, EAN-13, EAN-8, UPC-A)
- Create QR codes with support for dynamic linking
- Batch sequence generation for creating multiple barcodes at once
- User authentication with Firebase
- History tracking for generated barcodes
- Analytics and reporting tools
- Dark/light theme support
- Mobile-responsive design

## Technology Stack

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript, Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: SQLite

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/barcode-generator.git
   cd barcode-generator
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (optional):
   - Create a `.env` file with necessary configuration

5. Initialize the database:
   ```bash
   python recreate_database.py
   ```

6. Run the application:
   ```bash
   python app.py
   ```

7. Access the application at `http://127.0.0.1:5000`

## Usage

- **Barcode Generator**: Create standard barcodes with various encodings
- **QR Code Generator**: Generate QR codes for text, URLs, or other data
- **Sequence Generator**: Create batches of sequential barcodes
- **History**: View and manage previously generated barcodes
- **Analytics**: Analyze barcode usage and statistics

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 