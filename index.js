import app from './src/app.js';
const serverless = require('serverless-http');

module.exports = serverless(app);
