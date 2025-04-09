# Barcode Generator API Reference

This document provides detailed specifications for all backend API endpoints in the Barcode Generator application. Use this reference for integrating with the API or implementing additional features.

## Base URL

All API endpoints are relative to the base URL:

```
http://127.0.0.1:5000/
```

For production, replace with your deployed domain.

## Authentication

Most endpoints require authentication using Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

Some endpoints (marked as "Public") can be accessed without authentication.

## Error Responses

All endpoints use standard HTTP status codes and return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description",
  "status": "error"
}
```

Common error codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid authentication)
- `403` - Forbidden (insufficient permissions)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Server Error (internal failure)

## Rate Limiting

API requests are rate-limited to prevent abuse. Limits are currently set to:
- 100 requests per minute per IP address
- 20 barcode generation requests per minute per user

When a rate limit is exceeded, the API returns status code `429` with information about when the limit resets.

---

## Endpoints

### Generate Single Barcode

Creates a single barcode with the provided data and options.

**URL**: `/generate_barcode`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "data": "BARCODE-12345",
  "barcode_type": "code128",
  "save": true
}
```

**Parameters**:
- `data` (string, required): The content to encode in the barcode
- `barcode_type` (string, required): The type of barcode to generate
  - Accepted values: `code128`, `code39`, `ean`, `ean13`, `ean8`, `upc`, `upca`, `isbn`, `isbn13`, `gs1`, `pdf417`, `qr`
- `save` (boolean, optional): Whether to save the barcode to the user's account (default: true)

**Successful Response** (200 OK):
```json
{
  "success": true,
  "id": "abc123def456",
  "data": "BARCODE-12345",
  "barcode_type": "code128",
  "created_at": "2023-07-15T12:34:56Z"
}
```

**Error Response Examples**:

Invalid barcode type (400 Bad Request):
```json
{
  "success": false,
  "error": "Invalid barcode type. Supported types: code128, code39, ean, ean13, ean8, upc, upca, isbn, isbn13, gs1, pdf417, qr",
  "status": "error"
}
```

Missing data (400 Bad Request):
```json
{
  "success": false,
  "error": "Barcode data is required",
  "status": "error"
}
```

---

### Generate QR Code

Creates a QR code with the provided data and styling options.

**URL**: `/generate_qrcode`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "qr_type": "text",
  "data": "Sample text for QR code",
  "foreground": "000000",
  "background": "FFFFFF",
  "is_dynamic": false,
  "redirect_url": "",
  "save": true
}
```

**Parameters**:
- `qr_type` (string, required): Type of QR code content
  - Accepted values: `text`, `url`, `email`, `phone`, `sms`, `wifi`, `vcard`
- `data` (string, required): The primary content to encode
- `foreground` (string, optional): Foreground color in hex format, without # (default: "000000")
- `background` (string, optional): Background color in hex format, without # (default: "FFFFFF")
- `is_dynamic` (boolean, optional): Whether this is a dynamic QR code (default: false)
- `redirect_url` (string, conditional): Required if is_dynamic is true
- Additional parameters depending on qr_type:
  - For `email`: `subject`, `body`
  - For `sms`: `message`
  - For `wifi`: `ssid`, `password`, `encryption`
  - For `vcard`: `firstname`, `lastname`, `phone`, `email`, `url`, `company`, `title`

**Successful Response** (200 OK):
```json
{
  "success": true,
  "id": "qr123def456",
  "qr_type": "text",
  "data": "Sample text for QR code",
  "is_dynamic": false,
  "created_at": "2023-07-15T12:34:56Z"
}
```

**Error Responses**:
Same pattern as generate_barcode, with specific validation for each QR type.

---

### Generate Sequence

Generates a sequence of barcodes with incremental numbering.

**URL**: `/generate_sequence`  
**Method**: `POST`  
**Auth Required**: Yes (except when save_to_system is false)  

**Request Body**:
```json
{
  "prefix": "ITEM",
  "start": 1,
  "count": 10,
  "pad_length": 3,
  "barcode_type": "code128",
  "suffix": "",
  "save_to_system": false
}
```

**Parameters**:
- `prefix` (string, optional): Text to prepend to each barcode
- `start` (integer, required): Starting number for the sequence
- `count` (integer, required): Number of barcodes to generate (1-1000)
- `pad_length` (integer, optional): Zero-padding length for numbers (0-20)
- `barcode_type` (string, required): Type of barcode to generate
- `suffix` (string, optional): Text to append to each barcode
- `save_to_system` (boolean, optional): Whether to save barcodes permanently

**Successful Response** (200 OK):
```json
{
  "success": true,
  "count": 10,
  "temp_barcodes": true,
  "sequence_data": [
    {
      "data": "ITEM001",
      "barcode_type": "code128",
      "image_data": "data:image/png;base64,..."
    },
    {
      "data": "ITEM002",
      "barcode_type": "code128",
      "image_data": "data:image/png;base64,..."
    },
    // Additional items...
  ],
  "saved_to_account": false
}
```

**Alternative Response** (saved barcodes):
```json
{
  "success": true,
  "count": 10,
  "temp_barcodes": false,
  "ids": ["abc123", "def456", "..."],
  "sequence_data": [
    {
      "id": "abc123",
      "data": "ITEM001",
      "barcode_type": "code128"
    },
    // Additional items...
  ],
  "saved_to_account": true
}
```

**Error Response Examples**:

Count too large (400 Bad Request):
```json
{
  "success": false,
  "error": "Count must be between 1 and 1000",
  "status": "error"
}
```

---

### Get Barcode

Retrieves a specific barcode image or metadata.

**URL**: `/barcode/<id>`  
**Method**: `GET`  
**Auth Required**: Public for temporary barcodes, Auth required for permanent ones  

**URL Parameters**:
- `id` (string, required): The ID of the barcode to retrieve

**Query Parameters**:
- `metadata` (boolean, optional): If true, returns barcode metadata instead of image (default: false)
- `format` (string, optional): Image format to return (default: "png")
  - Accepted values: "png", "svg", "pdf"

**Successful Response** (200 OK):
Without metadata: Returns the barcode image with appropriate Content-Type header.

With metadata=true:
```json
{
  "id": "abc123",
  "data": "BARCODE-12345",
  "barcode_type": "code128",
  "created_at": "2023-07-15T12:34:56Z",
  "user_id": "user123",
  "scan_count": 5,
  "last_scan": "2023-07-16T09:23:45Z"
}
```

**Error Response Example**:

Barcode not found (404 Not Found):
```json
{
  "success": false,
  "error": "Barcode not found",
  "status": "error"
}
```

---

### List Barcodes

Retrieves a list of barcodes for the authenticated user.

**URL**: `/barcodes`  
**Method**: `GET`  
**Auth Required**: Yes  

**Query Parameters**:
- `page` (integer, optional): Page number for pagination (default: 1)
- `per_page` (integer, optional): Items per page (default: 20, max: 100)
- `type` (string, optional): Filter by barcode type
- `search` (string, optional): Search term to filter barcodes
- `sort` (string, optional): Sort field (default: "created_at")
  - Accepted values: "created_at", "data", "scan_count"
- `order` (string, optional): Sort order (default: "desc")
  - Accepted values: "asc", "desc"

**Successful Response** (200 OK):
```json
{
  "success": true,
  "barcodes": [
    {
      "id": "abc123",
      "data": "BARCODE-12345",
      "barcode_type": "code128",
      "created_at": "2023-07-15T12:34:56Z",
      "scan_count": 5
    },
    // Additional items...
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 98
  }
}
```

---

### Delete Barcode

Deletes a specific barcode.

**URL**: `/barcode/<id>`  
**Method**: `DELETE`  
**Auth Required**: Yes  

**URL Parameters**:
- `id` (string, required): The ID of the barcode to delete

**Successful Response** (200 OK):
```json
{
  "success": true,
  "message": "Barcode deleted successfully"
}
```

**Error Response Example**:

Not authorized (403 Forbidden):
```json
{
  "success": false,
  "error": "You are not authorized to delete this barcode",
  "status": "error"
}
```

---

### Get Analytics

Retrieves analytics data for a specific barcode.

**URL**: `/analytics/<id>`  
**Method**: `GET`  
**Auth Required**: Yes  

**URL Parameters**:
- `id` (string, required): The ID of the barcode

**Query Parameters**:
- `period` (string, optional): Time period for analytics (default: "all")
  - Accepted values: "day", "week", "month", "year", "all"

**Successful Response** (200 OK):
```json
{
  "success": true,
  "barcode_id": "abc123",
  "barcode_data": "BARCODE-12345",
  "barcode_type": "code128",
  "total_scans": 125,
  "created_at": "2023-07-15T12:34:56Z",
  "last_scan": "2023-08-01T14:22:33Z",
  "scans_by_day": {
    "2023-07-15": 10,
    "2023-07-16": 25,
    // Additional days...
  },
  "scans_by_country": {
    "US": 80,
    "CA": 25,
    "UK": 20
    // Additional countries...
  },
  "is_dynamic": false,
  "redirect_url": null
}
```

---

### Get User Profile

Retrieves the current user's profile information.

**URL**: `/profile`  
**Method**: `GET`  
**Auth Required**: Yes  

**Successful Response** (200 OK):
```json
{
  "success": true,
  "user_id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2023-01-15T12:00:00Z",
  "account_type": "basic",
  "usage": {
    "total_barcodes": 156,
    "total_scans": 1890,
    "storage_used": "12.5 MB",
    "storage_limit": "100 MB"
  }
}
```

---

## Error Codes Reference

Below is a complete list of error codes that may be returned by the API:

| Error Code | Description |
|------------|-------------|
| `invalid_barcode_type` | The specified barcode type is not supported |
| `invalid_data` | The provided barcode data is invalid |
| `invalid_qr_type` | The specified QR code type is not supported |
| `invalid_parameters` | One or more required parameters are missing or invalid |
| `count_too_large` | The requested count exceeds the maximum allowed |
| `rate_limit_exceeded` | You have exceeded the rate limit for this endpoint |
| `unauthorized` | Authentication is required for this endpoint |
| `forbidden` | You don't have permission to access this resource |
| `not_found` | The requested resource was not found |
| `server_error` | An unexpected server error occurred |

## SDKs and Code Examples

### Python Example

```python
import requests
import json

API_URL = "http://127.0.0.1:5000"
TOKEN = "your_firebase_token"

def generate_sequence(prefix, start, count, pad_length, barcode_type, suffix=""):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TOKEN}"
    }
    
    data = {
        "prefix": prefix,
        "start": start,
        "count": count,
        "pad_length": pad_length,
        "barcode_type": barcode_type,
        "suffix": suffix,
        "save_to_system": True
    }
    
    response = requests.post(
        f"{API_URL}/generate_sequence",
        headers=headers,
        data=json.dumps(data)
    )
    
    return response.json()

# Example usage
result = generate_sequence("ITEM", 1, 10, 3, "code128", "-2023")
print(result)
```

### JavaScript Example

```javascript
async function generateBarcode(data, barcodeType) {
    const response = await fetch('/generate_barcode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({
            data: data,
            barcode_type: barcodeType,
            save: true
        })
    });
    
    return await response.json();
}

// Example usage
generateBarcode('PRODUCT-12345', 'code128')
    .then(result => {
        console.log('Barcode generated:', result);
        // Display or process the barcode
    })
    .catch(error => {
        console.error('Error generating barcode:', error);
    });
```

## Webhook Integration

For enterprise users, the API supports webhook notifications for barcode scan events. Configure webhooks through the user profile settings. 