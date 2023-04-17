// Import the Express framework
const express = require('express');

// Create an instance of the Express app
const app = express();

// Define a route for the root URL
app.get('/test', (req, res) => {
  res.status(200).send('Hello, world!');
});

// Start the server and listen on port 3000
app.listen(3000, () => {
  console.log('Server started on port 3000');
});