const serverless = require('serverless-http');
const { spawn } = require('child_process');
const path = require('path');

// Create a proxy Express app to forward requests to the Python Flask app
const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Forward all requests to the Python Flask app
app.all('*', (req, res) => {
  console.log(`Received request for: ${req.path}`);
  
  // Start Python process
  const pythonProcess = spawn('python', [
    '-c', 
    'import sys; sys.path.append("."); from app_handler import handler; print(handler({"path": "' + req.path + '"}, {}))'
  ], {
    cwd: __dirname,
    env: process.env
  });
  
  let dataString = '';
  
  // Collect data from Python process
  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });
  
  // Handle Python process error
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });
  
  // Handle Python process completion
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    
    if (code !== 0) {
      return res.status(500).send('Internal Server Error');
    }
    
    try {
      // Try to parse Python output as JSON
      const result = JSON.parse(dataString);
      
      // Set response headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }
      
      // Set response status code
      res.status(result.statusCode || 200);
      
      // Send response body
      res.send(result.body);
    } catch (err) {
      console.error('Error parsing Python output:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Export handler using serverless-http
exports.handler = serverless(app); 